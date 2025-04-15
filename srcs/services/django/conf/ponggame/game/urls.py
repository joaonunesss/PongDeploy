from django.urls import path, re_path, include
from django.views.generic import TemplateView
from .views import register_user, send2FaEmail, verify2FaCode, getTournMatches, get_csrf_token
from .views import start_game, move_paddle, get_game_state, reset_game
from .views import tournament_variables, save_tournament, jwt_token, user_info
from .views import logout_user

from .views import tournament_results, all_tournament_results

urlpatterns = [

    path('', TemplateView.as_view(template_name='index.html'), name='index'),

    path('api/tournament/create', save_tournament, name='save_tournament'),
    path('api/tournament', tournament_variables, name='tournament_variables'),
    path('api/tournament/matches', getTournMatches, name='tournament_variables'),
    # This is for register page
    path('register/', register_user, name='register'),

    # This is for jwt token, jwt refresh token
    path('game/token', jwt_token, name='token_obtain_pair'),
    # path('game/token/refresh', jwt_refresh_token, name='token_refresh'),

    path('user/info', user_info, name='user_info'),
    path('logout', logout_user, name='logout_user'),


    # This is for sending 2fa email
    path('send2FaEmail/', send2FaEmail, name='send2FaEmail'),

    # This is for verifying 2fa code
    path('verify2FaCode/', verify2FaCode, name='verify2FaCode'),

    # This is for django expose metrics
    path('', include("django_prometheus.urls")),

    # API endpoints to be used by CLI (Implement API module)
    path("api/game/start", start_game, name="start_game"), # Game start
    path("api/game/move", move_paddle, name="move_paddle"),
    path("api/game/state", get_game_state, name="get_game_state"),
    path("api/game/reset", reset_game, name="reset_game"),

    # Ensure CSRF token is generated
    path("get_csrf_token/", get_csrf_token, name="get_csrf_token"),

    # BLOCKCHAIN
	path('tournament/<int:tournament_id>/results/', tournament_results, name='tournament_results'),
	path('tournament/all', all_tournament_results, name='all_tournament_results'),

    # This re-path will catch all routes
    re_path(r"^.*$", TemplateView.as_view(template_name='index.html'), name='index'),
]
