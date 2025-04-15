import json
import random
import time
from .models import GameRoom, userProfile, TourneyMatch
from django.utils.timezone import now
from asgiref.sync import sync_to_async
import asyncio
from django.core.cache import cache
from django.contrib.auth.models import User


WIDTH = 750
HEIGHT = 400
PADDLE_HEIGHT = 100

@sync_to_async
def save_game_result(room_id, player1_score, player2_score):
	room = GameRoom.objects.get(room_id=room_id)
	if (player1_score == 5):
		game_winner = room.player1
	else:
		game_winner = room.player2
	room.player1_score=player1_score
	room.player2_score=player2_score
	room.winner=game_winner
	room.is_active=False
	room.save()
	return room

@sync_to_async
def create_game_room(room_id):
	return GameRoom.objects.get_or_create(
		room_id=room_id
		)

@sync_to_async
def get_player_names(room_id):
	try:
		room = GameRoom.objects.get(room_id=room_id)
		return room.winner
	except GameRoom.DoesNotExist:
		return None

@sync_to_async
def save_game_room(room):
	room.save()

@sync_to_async
def delete_game_room_db(room_id):
	try:
		room = GameRoom.objects.get(room_id=room_id)
		room.delete()
	except GameRoom.DoesNotExist:
		pass

class AI:
	def __init__(self):
		self.reaction_delay = 1.5
		self.current_time = time.monotonic()
		self.last = self.current_time

	def ai_decision(self, game):
		ball_x = game.get("ball_x", 0)
		ball_y = game.get("ball_y", 0)
		ball_vx = game.get("ball_speed_x", 0)
		ball_vy = game.get("ball_speed_y", 0)
		paddle_y = game.get("player2_y", 0)
		paddle_speed = 6  

		self.current_time = time.monotonic()
		if (self.current_time - self.last > self.reaction_delay):
			if ball_vx > 0:  
				time_to_reach_ai = (WIDTH - ball_x) / float(abs(ball_vx) + 1e-6)
				predicted_y = ball_y + ball_vy * time_to_reach_ai

				while predicted_y < 0 or predicted_y > HEIGHT:
					if predicted_y < 0:
						predicted_y = -predicted_y  
					elif predicted_y > HEIGHT:
						predicted_y = 2 * HEIGHT - predicted_y  
			else:
				predicted_y = HEIGHT // 2  

			if paddle_y + PADDLE_HEIGHT // 2 < predicted_y - paddle_speed:
				return 1  
			elif paddle_y + PADDLE_HEIGHT // 2 > predicted_y + paddle_speed:
				return -1
			self.last = self.current_time
		return 0  



class GameStateManager:
	def __init__(self):
		self.rooms = {}
		self.game_tasks = {}
		self.last_ai_move = {}
		self.ai_instance = AI()

	@sync_to_async
	def add_matchToTourn(self, room_id, matchId):
		room = GameRoom.objects.get(room_id=room_id)
		tourneyMatch = TourneyMatch.objects.get(id=matchId)
		tourneyMatch.game = room
		tourneyMatch.save()

	@sync_to_async
	def update_player_name(self, gameType, room_id, player1, player2):
		room = GameRoom.objects.get(room_id=room_id)
		room.game_type = gameType
		if (room.player1 == None):
			room.player1 = player1
		if(room.player2 == None):
			room.player2 = player2
		room.save()

	async def start_game_loop(self, room_id, gameType, channel_layer):
		if room_id in self.rooms:
			game = self.rooms[room_id]["game_state"]
		if (game["state"] == "over"):
			return
		if room_id in self.game_tasks and not self.game_tasks[room_id].done():
			return
		self.game_tasks[room_id] = asyncio.create_task(self.run_game_loop(room_id, gameType, channel_layer))

	async def run_game_loop(self, room_id, gameType, channel_layer):
		while True:
			await asyncio.sleep(0.016)
			updated_state = await self.update_game_logic(room_id, gameType)
			if updated_state is None:
				break
			if channel_layer is not None:
				await channel_layer.group_send(
					room_id,
					{"type": "game_update", "message": updated_state}
			)


	def reset_game(self, room_id):
		time.sleep(1.9)
		if room_id in self.rooms:
			game = self.rooms[room_id]["game_state"]
			game["player1_score"] = 0
			game["player2_score"] = 0
			game["ball_x"] = WIDTH // 2
			game["ball_y"] = HEIGHT // 2
			game["ball_speed_x"] = random.choice([5, -5])
			game["ball_speed_y"] = random.choice([5, -5])
			game["player1_y"] = HEIGHT // 2 - PADDLE_HEIGHT // 2
			game["player2_y"] = HEIGHT // 2 - PADDLE_HEIGHT // 2
			game["hit"] = 0
			game["state"] = "running"
			return True
		return False

	def reset_ball(self, room_id):
		if room_id in self.rooms:
			game = self.rooms[room_id]["game_state"]
			game["ball_x"] = WIDTH // 2
			game["ball_y"] = HEIGHT // 2
			game["ball_speed_x"] = random.choice([5, -5])
			game["ball_speed_y"] = random.choice([5, -5])
			game["hit"] = 0

	def move_player(self, channel_name, text_data, gameType, room_id):
		if room_id not in self.rooms:
			return
		
		room_key = f"game_room:{room_id}"
		room = cache.get(room_key) or {"connected_players": {}, "game_state": None}

		game = self.rooms[room_id]["game_state"]
		data = json.loads(text_data)
		player1_move = data.get("player1_move", 0)
		player2_move = data.get("player2_move", 0)
		speed = 8
		if gameType:
			self.gameType = gameType
		elif "gametype" in data:
			self.gameType = data["gametype"]	
		if self.gameType == "AI":
			player2_move = self.ai_instance.ai_decision(game)
		if player1_move or player2_move:
			if self.gameType == "Multiplayer":
				if room["connected_players"].get(channel_name) == "Player 1":
					game["player1_y"] = max(0, min(HEIGHT - PADDLE_HEIGHT, game["player1_y"] + player1_move * speed))
				if (room["connected_players"].get(channel_name) == "Player 2"):
					game["player2_y"] = max(0, min(HEIGHT - PADDLE_HEIGHT, game["player2_y"] + player2_move * speed))
			elif self.gameType == "Local" or self.gameType == "Tournament" or self.gameType == "AI":
				game["player1_y"] = max(0, min(HEIGHT - PADDLE_HEIGHT, game["player1_y"] + player1_move * speed))
				game["player2_y"] = max(0, min(HEIGHT - PADDLE_HEIGHT, game["player2_y"] + player2_move * speed))

		cache.set(room_key, room)


	async def update_game_logic(self, room_id, gameType):
		if room_id not in self.rooms:
			return None
		game = self.rooms[room_id]["game_state"]
		if (game["player1_score"] >= 5 or game["player2_score"] >= 5 ) and game["state"] != "over":
				await save_game_result(room_id, game["player1_score"], game["player2_score"])
				winner_name = await get_player_names(room_id)
				game["winner"] = winner_name
				game["state"] = "over"
				game.is_active = False
				return game

		ball_radius = 10
		if game["ball_speed_x"] > 14:
			game["ball_speed_x"] = 14
		if game["ball_speed_y"] > 14:
			game["ball_speed_y"] = 14
		game["ball_x"] += game["ball_speed_x"]
		game["ball_y"] += game["ball_speed_y"]

		if game["ball_y"] <= 0 or game["ball_y"] + ball_radius >= HEIGHT:
			game["ball_speed_y"] = -game["ball_speed_y"]
			if game["ball_y"] <= 0:
				game["ball_y"] = 0
			elif game["ball_y"] + ball_radius >= HEIGHT:
				game["ball_y"] = HEIGHT - ball_radius

		if game["ball_x"] <= 30:
			if game["player1_y"] <= game["ball_y"] <= game["player1_y"] + PADDLE_HEIGHT and game["hit"] == 0:
				game["ball_speed_x"] = -game["ball_speed_x"] * 1.1
				hit_position = (game["ball_y"] - (game["player1_y"] + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)
				game["ball_speed_y"] = hit_position * abs(game["ball_speed_x"])
				game["hit"] = 1
			elif game["ball_x"] + ball_radius <= 0:
				game["player2_score"] += 1
				self.reset_ball(room_id)
		elif game["ball_x"] + ball_radius >= WIDTH - 25:
			if game["player2_y"] <= game["ball_y"] <= game["player2_y"] + PADDLE_HEIGHT and game["hit"] == 0:
				game["ball_speed_x"] = -game["ball_speed_x"] * 1.1
				hit_position = (game["ball_y"] - (game["player2_y"] + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2)
				game["ball_speed_y"] = hit_position * abs(game["ball_speed_x"])
				game["hit"] = 1
			elif game["ball_x"] >= WIDTH:
				game["player1_score"] += 1
				self.reset_ball(room_id)
		else:
			game["hit"] = 0

		return game

	async def add_player(self, channel_name, room_id):
		if room_id not in self.rooms:
			room = await create_game_room(room_id)
			self.rooms[room_id] = {
				"connected_players": {},
				"game_state": {
					"player1_score": 0,
					"player2_score": 0,
					"ball_x": WIDTH // 2,
					"ball_y": HEIGHT // 2,
					"ball_speed_x": random.choice([5, -5]),
					"ball_speed_y": random.choice([5, -5]),
					"player1_y": HEIGHT // 2 - PADDLE_HEIGHT // 2,
					"player2_y": HEIGHT // 2 - PADDLE_HEIGHT // 2,
					"hit": 0,
					"state": "running",
					"winner": "None",
				},
			}
		room_key = f"game_room:{room_id}"
		room = cache.get(room_key) or {"connected_players": {}, "game_state": None}
		if len(room["connected_players"]) < 2:
			player = f"Player {len(room['connected_players']) + 1}"
			room["connected_players"][channel_name] = player
			cache.set(room_key, room)
			return player
		return None


	async def remove_player(self, channel_name, room_id):
		if room_id in self.rooms and channel_name in self.rooms[room_id]["connected_players"]:
			del self.rooms[room_id]["connected_players"][channel_name]
			if not self.rooms[room_id]["connected_players"]:
				del self.rooms[room_id]
		if ((self.rooms[room_id]["game_state"]["player1_score"] < 5 and self.rooms[room_id]["game_state"]["player2_score"] < 5) and not self.rooms[room_id]["connected_players"]):
			if random.randint(0, 1) == 0:
				self.rooms[room_id]["game_state"]["player1_score"] = 5
			else:
				self.rooms[room_id]["game_state"]["player2_score"] = 5

	def get_connected_players(self, room_id):
		room = cache.get(f"game_room:{room_id}")
		players = room["connected_players"] if room else {}
		return players

	def get_game_state(self, room_id):
		return self.rooms.get(room_id, {}).get("game_state", {})


game_state_instance = GameStateManager()