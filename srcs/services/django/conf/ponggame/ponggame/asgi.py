import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from game import connection
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ponggame.settings')

# Define the ASGI application
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
			    path('ws/queue/', connection.QueueConsumer.as_asgi()),
                path('ws/game/<room_id>/', connection.GameConsumer.as_asgi()),
        ])
    ),
})
