from django.urls import path
from .consumers import QueueConsumer, GameConsumer

websocket_urlpatterns = [
    path('ws/queue/', QueueConsumer.as_asgi()),
    path('ws/game/<room_id>/', GameConsumer.as_asgi()),
]
