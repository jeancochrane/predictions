import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.exceptions import PermissionDenied

from predictions import models


class PredictionConsumer(WebsocketConsumer):
    # TODO: Convert this consumer to async

    def connect(self):
        self.user = self.scope['user']
        # TODO: More advanced permissions
        # TODO: Only open the connection if env var is set
        if not self.user.is_staff:
            self.is_connected = False
            self.close()
        else:
            self.is_connected = True
            self.year = self.scope['url_route']['kwargs']['year']
            self.year_group_name = f'predictions_{self.year}'

            async_to_sync(self.channel_layer.group_add)(
                self.year_group_name,
                self.channel_name
            )
            self.accept()

    def disconnect(self, close_code):
        if self.is_connected:
            async_to_sync(self.channel_layer.group_discard)(
                self.year_group_name,
                self.channel_name
            )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        if message_type == 'create':
            self.create_prediction(text_data_json)
        elif message_type == 'update':
            self.update_prediction(text_data_json)
        elif message_type == 'delete':
            self.delete_prediction(text_data_json)
        else:
            raise ValueError(
                f'Message type not recognized: {message_type}'
            )

    def create_prediction(self, text_data_json):
        """
        Create a new Prediction object and send its metadata in a message to
        the channel layer group.
        """
        text = text_data_json.get('text')
        if not text:
            raise ValueError('text is required when creating predictions')

        prediction = models.Prediction.objects.create(user=self.user, text=text)
        async_to_sync(self.channel_layer.group_send)(
           self.year_group_name,
           {
                'type': 'send_create_message',
                'text': text,
                'username': self.user.username,
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
            raise ValueError('id is required when updating predictions')

        position_x = text_data_json.get('positionX')
        position_y = text_data_json.get('positionY')
        if not position_x and position_y:
            raise ValueError(
                'positionX and positionY are required when updating predictions'
            )

        prediction = models.Prediction.objects.get(id=prediction_id)
        if prediction.user != self.user:
            raise PermissionDenied(
                'You must be the creator of a prediction to update it'
            )
        else:
            prediction.position_x = position_x
            prediction.position_y = position_y
            prediction.save()
            async_to_sync(self.channel_layer.group_send)(
                self.year_group_name,
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
            raise ValueError('id is required when deleting predictions')

        prediction = models.Prediction.objects.get(id=prediction_id)
        if prediction.user != self.user:
            raise PermissionDenied(
                'You must be the creator of a prediction to delete it'
            )
        else:
            prediction.delete()
            async_to_sync(self.channel_layer.group_send)(
                self.year_group_name,
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
            'username': event['username'],
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
