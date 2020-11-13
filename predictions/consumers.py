import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class PredictionConsumer(WebsocketConsumer):
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
        # TODO: Implement sticky deletion
        text_data_json = json.loads(text_data)
        text = text_data_json['text']
        # TODO: Also save stickies to the database
        async_to_sync(self.channel_layer.group_send)(
           self.year_group_name,
           {
                'type': 'predictions.new_sticky',
                'text': text,
                'username': self.user.username
            }
        )

    def predictions_new_sticky(self, event):
        self.send(text_data=json.dumps({
            'text': event['text'],
            'username': event['username']
        }))
