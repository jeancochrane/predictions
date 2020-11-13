from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/predictions/(?P<year>\w+)/$', consumers.PredictionConsumer.as_asgi()),
]
