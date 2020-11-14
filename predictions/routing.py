from django.urls import re_path
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from . import consumers

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter([
            re_path(r'ws/predictions/(?P<year>\w+)/$', consumers.PredictionConsumer.as_asgi()),
        ])
    )
})
