from django.contrib import admin
from .models import  GameRoom, userProfile, Tournament, TourneyMatch

# Register your models here.
admin.site.register(GameRoom)

admin.site.register(Tournament)
admin.site.register(TourneyMatch)
# admin.site.register(GameResult)

# userProfile model
admin.site.register(userProfile)