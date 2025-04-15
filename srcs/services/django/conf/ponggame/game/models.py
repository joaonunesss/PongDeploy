from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
from datetime import timedelta
import uuid


class GameRoom(models.Model):
    room_id = models.CharField(max_length=100, unique=True)
    game_type = models.CharField(max_length=20, null=False)
    player1 = models.CharField(max_length=100, blank=True, null=True)
    player2 = models.CharField(max_length=100, blank=True, null=True)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    winner = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

class Tournament(models.Model):
	name = models.CharField(max_length=100, blank=True, null=True)
	nbrPlayers = models.IntegerField(default=0)
	nbrRounds = models.IntegerField (default=0)
	currRound = models.IntegerField(default=0)
	winner = models.CharField(max_length=100, blank=True, null=True)
	isFinished = models.BooleanField(default=False)
	created_at = models.DateTimeField(default=now)

class TourneyMatch(models.Model):
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
	player1 = models.CharField(max_length=100, blank=True, null=True)
	player2 = models.CharField(max_length=100, blank=True, null=True)
	game = models.ForeignKey(GameRoom, blank=True, null=True, on_delete=models.CASCADE)
	round = models.IntegerField(default=0)

	def __str__(self):
		return f'{self.tournament.pk}: {self.player1} vs {self.player2}'

class userProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='userProfile')
	game_wins = models.IntegerField(default=0)
	total_games = models.IntegerField(default=0)
	tournament_wins = models.IntegerField(default=0)
	total_tournaments = models.IntegerField(default=0)
	game_wins = models.IntegerField(default=0)
	total_games = models.IntegerField(default=0)
	tournament_wins = models.IntegerField(default=0)
	total_tournaments = models.IntegerField(default=0)

	def __str__(self):
		return self.user.username

class twoFactorAuth(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)  # Link to User model
	code = models.CharField(max_length=6)  # Store 6-digit code
	created_at = models.DateTimeField(default=now)  # Timestamp of code creation
	session_id = models.UUIDField(default=uuid.uuid4, unique=True)  # To track sessions

	def is_expired(self):
		return now() > self.created_at + timedelta(minutes=5)