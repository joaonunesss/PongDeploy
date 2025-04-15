# serializers.py
from rest_framework import serializers
from .models import TourneyMatch, GameRoom, Tournament

class GameRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameRoom
        fields = [
            'room_id',
            'game_type',
            'player1',
            'player2',
            'player1_score',
            'player2_score',
            'winner',
            'created_at',
            'is_active'
        ]

class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'nbrPlayers', 'nbrRounds', 'currRound', 'isFinished', 'winner', 'created_at']

class TourneyMatchSerializer(serializers.ModelSerializer):
    game = GameRoomSerializer(read_only=True)

    class Meta:
        model = TourneyMatch
        fields = ['id', 'tournament', 'player1', 'player2', 'game', 'round']