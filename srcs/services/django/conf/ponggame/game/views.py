import json
import random
import logging
import math
import jwt
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth import get_user_model, authenticate
from django.conf import settings
from django.views.decorators.http import require_GET
from django.utils.timezone import now
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
# from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework_simplejwt.tokens import RefreshToken
from asgiref.sync import async_to_sync
from .models import twoFactorAuth, userProfile, Tournament, TourneyMatch, GameRoom
from .pong_logic import game_state_instance
from .serializers import TourneyMatchSerializer, TournamentSerializer
from .connection import generate_room_id

logger = logging.getLogger(__name__)

User = get_user_model()

# =============================== BLOCKCHAIN ============================== #

from web3 import Web3
import os

ganache_url = "http://ganache:8545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

# Check the connection
if web3.is_connected():
	print("Connected to Ganache")
else:
	raise Exception("Failed to connect to Ganache")

# Set the default account

web3.eth.default_accounts = web3.eth.accounts[0]

print("Contas:", web3.eth.accounts)

abi_file_path = "./abi/TournamentScore.json"

if not os.path.exists(abi_file_path):
    raise Exception("ABI file not found")

with open("./abi/TournamentScore.json", "r") as abi_file:
	contract_json = json.load(abi_file)
	abi = contract_json.get("abi")

# Contract Adress:

network_id = "5777"

if network_id not in contract_json["networks"]:
	raise Exception(f"Contract not deployed on network {network_id}")

contract_adress = contract_json["networks"][network_id]["address"]

contract = web3.eth.contract(address=contract_adress, abi=abi)

def register_tournament_result(tournament_id, name, winner):
	print(tournament_id)
	print(name)
	print(winner)
	tx = contract.functions.storeResult(
		tournament_id,
		name,
		winner,
		[]
	).transact({'from': web3.eth.default_accounts})

	web3.eth.wait_for_transaction_receipt(tx)
	print(f"Tournament {tournament_id} saved in the blockchain")

def tournament_results(request, tournament_id):
	try:
		result = contract.functions.getTournamentResult(tournament_id).call()

		tournament_data = {
			"id": result[0],
			"tournamentName": result[1],
			"winner": result[2],
		}
		return JsonResponse({"success": True, "data": tournament_data})
	except Exception as e:
		return JsonResponse({"success": False, "error": str(e)})

def all_tournament_results(request):
	tournaments = []

	# All IDs from tournaments in django
	tournament_ids = Tournament.objects.values_list("id", flat=True)

	for tournament_id in tournament_ids:
		try:

			result = contract.functions.getTournamentResult(tournament_id).call()

			tournament_data = {
				"id": result[0],
				"tournamentName": result[1],
				"winner": result[2],
			}
			tournaments.append(tournament_data)
		except Exception as e:
			# Se o torneio não estiver na blockchain ou houver erro, ignoramos esse ID
			print(f"Erro ao buscar torneio {tournament_id}: {e}")
			continue

	return JsonResponse({"data": tournaments})

# =============================== Tournaments ============================== #
def makeNewRound(playersArr, tournament):
	print("MakeNewRound")
	print(playersArr)
	print("CurrRound:", tournament.currRound)
	nbrMatches = math.floor(int(tournament.nbrPlayers) / math.pow(2, tournament.currRound) + 0.5)
	if nbrMatches == 0:
		print("Value:", nbrMatches)
		nbrMatches = 1
	print("nbrMatches:", nbrMatches)
	odd = 0

	if playersArr.__len__() % 2:
		nbrMatches = math.floor(int(tournament.nbrPlayers) / math.pow(2, tournament.currRound))
		nbr = random.randrange(0, playersArr.__len__() - 1)
		odd = playersArr.pop(nbr)
	i = 0
	for x in range(0, nbrMatches):
		match = TourneyMatch(
			tournament = tournament,
			player1 = playersArr[i],
			player2 = playersArr[i + 1],
			round = tournament.currRound
		)
		print(match)
		match.save()
		i += 2
	if odd:
		game = GameRoom(
			room_id = generate_room_id(),
			game_type = "Tournament",
			player1 = odd,
			player2 = None,
			player1_score = 5,
			player2_score = 0,
			winner = odd,
			created_at = now(),
			is_active = False
		)
		game.save()
		match = TourneyMatch(
			tournament = tournament,
			player1 = odd,
			player2 = None,
			game = game,
			round = tournament.currRound
		)
		match.save()
		print(match)
	print(nbrMatches)
	print("End of MakeNewRound")

def getTournMatches(request):
	if request.method == "POST":
		tournId = request.session.get("TournamentId", -1)
		if tournId == -1:
			return JsonResponse({"status": "Error", "detail": "Invalid session_id cookie"}, status=401)
		tournament = Tournament.objects.get(id=tournId)
		matches = TourneyMatch.objects.filter(tournament=tournament, round=tournament.currRound).order_by("pk")
		winners = matches.exclude(game=None)

		print("LOL:", request.session['TournamentId'])
		if winners.__len__() == matches.__len__():
			if tournament.currRound != tournament.nbrRounds:
				print("ALL won")
				tournament.currRound = tournament.currRound + 1
				tournament.save()
				arr = list(winners.values_list("game__winner", flat=True))
				print(arr)
				makeNewRound(list(winners.values_list("game__winner", flat=True)), tournament)
			else:
				tournament.isFinished = True
				tournament.winner = matches[0].game.winner
				tournament.save()

				# Save in the Blockchain
				try:
					register_tournament_result(tournament.id, tournament.name, tournament.winner)
				except Exception as e:
					print(f"Error registering on the blockchain: {e}")
		tournMatches = []
		for x in range(1, tournament.currRound + 1):
			matches = TourneyMatch.objects.filter(tournament=tournament, round=x).order_by("pk")
			seri = TourneyMatchSerializer(matches, many=True)
			tournMatches.append(seri.data)
		return JsonResponse({
			"TournMatches": tournMatches,
			"CurrRound": tournament.currRound,
			"Winner": tournament.winner
		})
	return JsonResponse({"status": "Error", "detail": "Wrong Method"}, status=405)

def tournament_variables(request):
	if request.method == "GET":
		tournId = request.session.get("TournamentId", -1)
		if tournId != -1:
			tournament = Tournament.objects.get(id=tournId)
			ret = TournamentSerializer(tournament)
			print(ret.data)
			return JsonResponse({"Tournament": ret.data})
		return JsonResponse({"Tournament": "NO"}, status=200)
	return JsonResponse({"status": "Error", "detail": "Wrong Method"}, status=405)

def save_tournament(request):
	try:
		info = json.loads(request.body)
	except json.JSONDecodeError:
		return

	name = info.get("name")
	playersArr = info.get("playersArr")
	nbrPlayers = info.get("nbrPlayers")
	nbrRounds = info.get("nbrRounds")
	isFinished = info.get("isFinished")
	print(name)
	print(nbrPlayers)
	print(nbrRounds)
	print(isFinished)

	tournament = Tournament(
			name=name,
            nbrPlayers=nbrPlayers,
            nbrRounds=nbrRounds,
            isFinished=isFinished,
			created_at=now(),
			currRound=1
	)
	tournament.save()
	makeNewRound(playersArr, tournament)
	request.session['TournamentId'] = tournament.pk
	print(tournament.id)

	return JsonResponse({
		"tournament_id":tournament.id,
        "created_at": tournament.created_at,
    })

# =============================== Register User ============================== #
def get_csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})

@csrf_exempt
def register_user(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body)
		except json.JSONDecodeError:
			return JsonResponse({'message': 'Invalid body'}, status=400)

		username = data.get('username')
		password = data.get('password')
		email = data.get('email')

		if not username or not password or not email:
			return JsonResponse({'message': 'Missing required fields'}, status=400)

		if User.objects.filter(username=username).exists():
			return JsonResponse({'message': 'Username already exists'}, status=400)
		if User.objects.filter(email=email).exists():
			return JsonResponse({'message': 'Email already exists'}, status=400)

		user = User(username=username, email=email)

		user.set_password(password)
		user.save()

		userProfile.objects.create(user=user)

		return JsonResponse({'message': 'User created successfully'}, status=201)

	return JsonResponse({'error': 'Invalid HTTP method. Only POST is allowed'}, status=405)

def logout_user(request):
	response = JsonResponse({"status": "Success", "details": "Logout user"}, status=200)
	response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
	return response

@api_view(["GET"])
def user_info(request):
	if request.method == "GET":
		token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])
		
		if not token:
			return JsonResponse({"status": "Success", "detail": "Token Expired/Guest User"}, status=200)
		try:
			vtoken = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
			user = User.objects.get(id=vtoken["user_id"])
			return JsonResponse({"username": user.username}, status=200)
		except:
			return JsonResponse({"status": "Error", "detail": "Invalid Token"}, status=401)
	return JsonResponse({
		"status": "Error",
		"msg": "Method not Allowed"
	}, status=405)

def get_tokens_for_user(user):
	refresh = RefreshToken.for_user(user)

	return {
		'access': str(refresh.access_token),
	}

@api_view(['POST'])
def jwt_token(request):
	if request.method == "POST":
		try:
			data = json.loads(request.body)
		except:
			return JsonResponse({"status": "Error", "detail": "Bad Request"}, status=400)
		username = data.get("username")
		password = data.get("password")
		user = authenticate(username=username, password=password)
		if not user:
			return JsonResponse({"status": "Error", "detail": "Invalid credentials"}, status=401)
		response = JsonResponse({"status": "Success"}, status=200)
		token = get_tokens_for_user(user)
		response.set_cookie(
			key = settings.SIMPLE_JWT["AUTH_COOKIE"],
			value = token["access"],
			httponly = settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
			secure = settings.SIMPLE_JWT["SECURE"],
			samesite = settings.SIMPLE_JWT["SAMESITE"]
		)
		return response
	return JsonResponse({"status": "Error", "detail": "Wrong Method"}, status=405)

# ============================ 2FA Send/Veriffy OTP Code ===================== #
@require_POST
@csrf_exempt
def send2FaEmail(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body)
		except json.JSONDecodeError as e:
			logger.error(f"JSON decode error: {e}")
			return JsonResponse({'message': 'Invalid JSON body'}, status=400)

		# Authenticate the user
		user = authenticate(username=data.get('username'), password=data.get('password'))
		if user is None:
			logger.error("Invalid credentials")
			return JsonResponse({'message': 'Invalid credentials'}, status=401)

		# Retrieve the email from the database
		username = user.username
		email = user.email
		if not email:
			logger.error(f"User {username} does not have an email associated")
			return JsonResponse({'message': 'User does not have an email associated'}, status=400)

		# Generate the 2FA code
		code = str(random.randint(100000, 999999))
		# Print 2FA code
		print(f"code {code}")

		try:
			created = twoFactorAuth.objects.update_or_create(
				user=user,
				defaults={
					'code': code,
					'created_at': now()
				}
			)
			logger.debug(f"2FA record updated/created for user {username} (created: {created}).")
		except Exception as e:
			logger.error(f"Error updating/creating 2FA record: {e}")
			return JsonResponse({'message': f'Error updating 2FA record: {str(e)}'}, status=500)

		message_text = (
			f"Hello {user.username},\n\n"
			f"Your 2FA code for loggin in is: {code}\n\n"
			"Lets Have Some Fun!!"
		)
		#HTML for 2FA email
		html_message = f"""
		<!DOCTYPE html>
		<html lang="pt">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Seu Código de Acesso</title>
			<style>
				body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; padding: 20px; }}
				.container {{ background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); max-width: 400px; margin: auto; }}
				.code {{ font-size: 24px; font-weight: bold; color: #007BFF; background: #e7f3ff; padding: 10px; border-radius: 5px; display: inline-block; margin: 15px 0; }}
				.footer {{ font-size: 12px; color: #666; margin-top: 20px; }}
			</style>
		</head>
		<body>
			<div class="container">
				<h2>🔒 Verificação de Segurança</h2>
				<p>Olá <strong>{user.username}</strong>, use o código abaixo para acessar sua conta:</p>
				<div class="code">{code}</div>
				<p>O código expira em 5 minutos.</p>
				<p>Se você não solicitou este código, ignore este email.</p>
				<p class="footer">Protegemos sua conta com segurança avançada.</p>
			</div>
		</body>
		</html>
		"""
		try:
			send_mail(
				subject="Your 2FA Code for Ping, Pong, Panic",
				message=message_text,
				html_message=html_message,
				from_email=settings.DEFAULT_FROM_EMAIL,
				recipient_list=[email],
				fail_silently=False,
			)
			logger.debug("Email sent successfully")
			return JsonResponse({'message': '2FA code sent successfully'}, status=200)
		except Exception as e:
			logger.error(f"Error sending email: {e}")
			return JsonResponse({'message': f'Error sending email: {str(e)}'}, status=500)

@csrf_exempt
def verify2FaCode(request):
	if request.method != 'POST':
		print(f"Invalid method: {request.method}")
		return JsonResponse({'message': 'Method Not Allowed'}, status=405)

	if request.method == 'POST':
		try:
			data = json.loads(request.body)
		except json.JSONDecodeError:
			return JsonResponse({'message': 'Invalid JSON body'}, status=400)

		username = data.get('username')
		otpCode = data.get('otpCode')

		if not username or not otpCode:
			return JsonResponse({'message': 'Username and OTP code are required'}, status=400)

		try:
			user = User.objects.get(username=username)
			two_fa = twoFactorAuth.objects.get(user=user)
		except (User.DoesNotExist, twoFactorAuth.DoesNotExist):
			return JsonResponse({'message': 'Invalid username or 2FA code not found'}, status=404)

		if two_fa.is_expired():
			return JsonResponse({'message': 'OTP code has expired'}, status=400)

		if two_fa.code != otpCode:
			return JsonResponse({'message': 'Invalid OTP code'}, status=400)

		two_fa.delete()

		return JsonResponse({'message': '2FA verification successful'}, status=200)

	return JsonResponse({'message': 'Invalid request method'}, status=405)

# =============================== API Endpoints ======================================== #
#@csrf_exempt
def start_game(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            room_id = data.get("room_id")
            gameType = data.get("gameType", "Local")
            if not room_id:
                return JsonResponse({"error": "room_id is required"}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

        # For CLI usage we can use a default channel name (since we are not on a websocket)
        channel_name = "cli_channel"

        # Run your async function until it completes, then returns its result
        player = async_to_sync(game_state_instance.add_player)(channel_name, room_id)

        # Start the game loop. Note: In a CLI context, you might not have a channel_layer,
        # so you can pass None or create a stub layer. With WebSockets, the real channel_layer is used.
        async_to_sync(game_state_instance.start_game_loop)(room_id, gameType, None)

        return JsonResponse({
            "message": "Game started",
            "room_id": room_id,
            "player": player
        })
    return JsonResponse({"error": "Only POST method allowed."}, status=405)

#@csrf_exempt
def move_paddle(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            room_id = data.get("room_id")
            # In a WebSocket scenario, each move is associated with a channel.
            # For CLI/API, we can use a default channel name.
            channel_name = "cli_channel"
            gameType = data.get("gameType")
            if not room_id:
                return JsonResponse({"error": "room_id is required"}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

        # The move_player function in your logic expects the raw text data
        text_data = json.dumps(data)
        game_state_instance.move_player(channel_name, text_data, gameType, room_id)

        return JsonResponse({"message": "Move processed"})
    return JsonResponse({"error": "Only POST method allowed."}, status=405)

#@csrf_exempt
def get_game_state(request):
    if request.method == "GET":
        room_id = request.GET.get("room_id")
        if not room_id:
            return JsonResponse({"error": "room_id parameter required"}, status=400)
        state = game_state_instance.get_game_state(room_id)
        return JsonResponse(state)
    return

#@csrf_exempt
def reset_game(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            room_id = data.get("room_id")
            if not room_id:
                return JsonResponse({"error": "room_id is required"}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

        success = game_state_instance.reset_game(room_id)

        if success:
            return JsonResponse({"message": "Game reset successfully!"})
        else:
            return JsonResponse({"error": "Game not found."}, status=404)

    return JsonResponse({"error": "Only POST method allowed."}, status=405)
# =============================== END ======================================== #
