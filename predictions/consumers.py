import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.conf import settings

from predictions import models


class BaseConsumer(WebsocketConsumer):

    def connect(self):
        if settings.PREDICTIONS_ACTIVE:
            self.is_connected = True
            self.user = self.scope['user']
            self.group_name = self.get_group_name()

            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )
            self.accept()
        else:
            self.is_connected = False
            self.close()

    def get_group_name(self):
        return 'predictions_group'

    def disconnect(self, close_code):
        if self.is_connected:
            async_to_sync(self.channel_layer.group_discard)(
                self.group_name,
                self.channel_name
            )

    def receive(self, text_data):
        raise NotImplementedError(
            'Children must implement the receive() method'
        )

    def send_error(self, message):
        """
        Send an error message to a single connection.
        """
        self.send(text_data=json.dumps({
            'type': 'error',
            'text': message
        }))


class PredictionConsumer(BaseConsumer):

    def receive(self, text_data):
        if models.user_can_manage_predictions(self.user):
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            if message_type == 'create':
                self.create_prediction(text_data_json)
            elif message_type == 'update':
                self.update_prediction(text_data_json)
            elif message_type == 'delete':
                self.delete_prediction(text_data_json)
            else:
                self.send_error(
                    f'Message type not recognized: {message_type}'
                )
        else:
            self.send_error(
                'You do not have permission to send messages'
            )

    def create_prediction(self, text_data_json):
        """
        Create a new Prediction object and send its metadata in a message to
        the channel layer group.
        """
        text = text_data_json.get('text')
        if not text:
            self.send_error('text is required when creating predictions')

        prediction = models.Prediction.objects.create(user=self.user, text=text)
        async_to_sync(self.channel_layer.group_send)(
           self.group_name,
           {
                'type': 'send_create_message',
                'text': text,
                'userId': self.user.id,
                'color': self.user.profile.color,
                'id': prediction.id,
                'position_x': prediction.position_x,
                'position_y': prediction.position_y
            }
        )

    def update_prediction(self, text_data_json):
        """
        Update an existing Prediction object and send its metadata in a message
        to the channel layer group.
        """
        prediction_id = text_data_json.get('id')
        if not prediction_id:
            self.send_error('id is required when updating predictions')

        position_x = text_data_json.get('positionX')
        position_y = text_data_json.get('positionY')
        if not position_x and position_y:
            self.send_error(
                'positionX and positionY are required when updating predictions'
            )

        prediction = models.Prediction.objects.get(id=prediction_id)
        prediction.position_x = position_x
        prediction.position_y = position_y
        prediction.save()

        async_to_sync(self.channel_layer.group_send)(
            self.group_name,
            {
                'type': 'send_update_message',
                'id': prediction_id,
                'position_x': position_x,
                'position_y': position_y
            }
        )

    def delete_prediction(self, text_data_json):
        """
        Delete an existing Prediction object and send its metadata in a
        message to the channel layer group.
        """
        prediction_id = text_data_json.get('id')
        if not prediction_id:
            self.send_error('id is required when deleting predictions')

        prediction = models.Prediction.objects.get(id=prediction_id)
        if prediction.user != self.user:
            self.send_error(
                'You must be the creator of a prediction to delete it'
            )
        else:
            prediction.delete()
            async_to_sync(self.channel_layer.group_send)(
                self.group_name,
                {
                    'type': 'send_delete_message',
                    'id': prediction_id
                }
            )

    def send_create_message(self, event):
        """
        Handle a message from the group to create a new prediction.
        """
        self.send(text_data=json.dumps({
            'type': 'create',
            'text': event['text'],
            'userId': event['userId'],
            'color': event['color'],
            'id': event['id'],
            'positionX': event['position_x'],
            'positionY': event['position_y']
        }))

    def send_update_message(self, event):
        """
        Handle a message from the group to update an existing prediction.
        """
        self.send(text_data=json.dumps({
            'type': 'update',
            'id': event['id'],
            'positionX': event['position_x'],
            'positionY': event['position_y']
        }))

    def send_delete_message(self, event):
        """
        Handle a message from the group to delete an existing prediction.
        """
        self.send(text_data=json.dumps({
            'type': 'delete',
            'id': event['id']
        }))


class CursorConsumer(BaseConsumer):

    def get_group_name(self):
        return 'predictions_cursor'

    def receive(self, text_data):
        if models.user_can_manage_predictions(self.user):
            # Initialize the output message data dict
            message_data = {
                'type': 'send_cursor_message',
                'userId': self.user.id
            }
            # Parse the incoming data
            text_data_json = json.loads(text_data)
            for coord_param in ['x', 'y']:
                try:
                    message_data[coord_param] = text_data_json[coord_param]
                except KeyError:
                    self.send_error(
                        f'Missing required coordinate parameter "{coord_param}"'
                    )
            async_to_sync(self.channel_layer.group_send)(
                self.group_name,
                message_data
            )
        else:
            self.send_error(
                'You do not have permission to send messages'
            )

    def send_cursor_message(self, event):
        # Only send cursor messages to other users
        if event['userId'] != self.user.id:
            self.send(text_data=json.dumps({
                'type': 'cursor',
                'userId': event['userId'],
                'x': event['x'],
                'y': event['y']
            }))


class ChatConsumer(BaseConsumer):

    def get_group_name(self):
        return 'predictions_chat'

    def receive(self, text_data):
        if models.user_can_manage_predictions(self.user):
            text_data_json = json.loads(text_data)
            message_text = text_data_json.get('message')
            if not message_text:
                self.send_error('message cannot be empty')
            elif len(message_text) > models.ChatMessage.max_length:
                self.send_error(
                    f'messages cannot exceed {models.ChatMessage.max_length} characters'
                )
            else:
                chat_message = models.ChatMessage.objects.create(
                    user=self.user,
                    text=message_text
                )
                message_data = {
                    'type': 'send_chat_message',
                    'userId': self.user.id,
                    'username': self.user.username,
                    'text': message_text,
                    'messageId': chat_message.id,
                    'created': chat_message.get_created()
                }
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    message_data
                )
        else:
            self.send_error(
                'You do not have permissions to send messages'
            )

    def send_chat_message(self, event):
        self.send(text_data=json.dumps({
            'type': 'chat',
            'userId': event['userId'],
            'text': event['text'],
            'messageId': event['messageId'],
            'created': event['created']
        }))
