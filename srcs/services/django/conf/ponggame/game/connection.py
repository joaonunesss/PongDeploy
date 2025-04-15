import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .pong_logic import game_state_instance
import logging
from django.contrib.auth import get_user_model
from django.conf import settings
import random
from http.cookies import SimpleCookie
from asgiref.sync import sync_to_async
logger = logging.getLogger(__name__)
import jwt

User = get_user_model()
matchmaking_queue = []

@sync_to_async
def get_user_from_token(token):
	decoded = jwt.decode(token, options={"verify_signature": False})
	user = User.objects.get(id=decoded["user_id"])
	return user.username

def generate_room_id():
	return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=6))

class QueueConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		cookies = self.scope["headers"]
		cookie_header = dict(cookies).get(b"cookie", b"").decode()
		simple_cookie = SimpleCookie()
		simple_cookie.load(cookie_header)
		if settings.SIMPLE_JWT["AUTH_COOKIE"] in simple_cookie:
			token_jwt = simple_cookie[settings.SIMPLE_JWT["AUTH_COOKIE"]].value
		username = await get_user_from_token(token_jwt)
		for it in matchmaking_queue:
			if it[1] == username:
				print("user already in queue")
				await self.close()
				return
		matchmaking_queue.append((self, username))
		await self.accept()
		if len(matchmaking_queue) >= 2:
			player1,name1 = matchmaking_queue.pop(0)
			player2,name2 = matchmaking_queue.pop(0)
			new_room_id = generate_room_id()
			message = json.dumps({"type": "match_found", "room_id": new_room_id, "player1": name1, "player2": name2})
			# print("Name 1: ",name1)
			# print("Name 2: ",name2)
			await player1.send(text_data=message)
			await player2.send(text_data=message)
			await asyncio.sleep(0.1)
			await player1.close()
			await player2.close()
		else:
			await self.send(text_data=json.dumps({"type": "waiting", "message": "Waiting for an opponent..."}))

	async def disconnect(self, code):
		for it in matchmaking_queue:
			if it[0] == self:
				matchmaking_queue.remove(it)

class GameConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.requested_room = self.scope['url_route']['kwargs']['room_id']
		
		self.room_group_name = self.requested_room
		self.gameType = None

		player = await game_state_instance.add_player(self.channel_name, self.room_group_name)
		if player:
			await self.channel_layer.group_add(self.room_group_name, self.channel_name)
			await self.accept()
			await self.send(text_data=json.dumps({"type": "accept_connection", "player": player}))
			print(f"Player {player} connected to room {self.room_group_name} successfully")
		else:
			await self.send(text_data=json.dumps({"type": "connection_rejected", "reason": "Game is full"}))
			await self.close()

	async def disconnect(self, code):
		if hasattr(self, 'room_group_name'):
			await game_state_instance.remove_player(self.channel_name, self.room_group_name)
			await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
			if hasattr(self, 'game_task') and len(game_state_instance.get_connected_players(self.room_group_name)) == 0:
				self.game_task.cancel()
		else:
			print("disconnect called without room_group_name set")

	async def receive(self, text_data):
		data = json.loads(text_data)
		action = data.get("action")
		matchId = data.get("matchId")
		self.gameType = data.get("gametype", 0)
		if matchId:
			await game_state_instance.add_matchToTourn(self.room_group_name, matchId)
		if self.gameType:
			player1 = data.get("player1")
			player2 = data.get("player2")
			await game_state_instance.update_player_name(self.gameType, self.room_group_name, player1, player2)
			game_state_instance.move_player(self.channel_name, text_data, self.gameType, self.room_group_name)
		if action == "reset_game":
			game_state_instance.reset_game(self.room_group_name)
			await self.channel_layer.group_send(
				self.room_group_name,
				{"type": "game_update", "message": game_state_instance.get_game_state(self.room_group_name)}
			)
		if not hasattr(self, "game_task") or self.game_task.done():
			if len(game_state_instance.get_connected_players(self.room_group_name)) == 2 and self.gameType == "Multiplayer":
				await game_state_instance.start_game_loop(self.room_group_name, self.gameType, self.channel_layer)

			elif self.gameType == "Local" or self.gameType == "Tournament" or self.gameType == "AI":
				await game_state_instance.start_game_loop(self.room_group_name, self.gameType, self.channel_layer)

		game_state_instance.move_player(self.channel_name, text_data, self.gameType, self.room_group_name)
		await self.channel_layer.group_send(
			self.room_group_name,
			{"type": "game_update", "message": game_state_instance.get_game_state(self.room_group_name)}
		)


	async def game_update(self, event):
		await self.send(text_data=json.dumps(event['message']))
