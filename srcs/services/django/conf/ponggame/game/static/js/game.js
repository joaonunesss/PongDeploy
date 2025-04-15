import {replaceStateRouter, router} from "./router.js"

const gamehmtl = /* html */ `
	<div id="PlayerNamesContainer" class="d-flex justify-content-between w-100 mx-auto" style="display: none!important;">
		<p id="Player1Name" class="text-white"></p>
		<p id="Player2Name" class="text-white"></p>
	</div> 
	<p id="Score" class="score w-50 mx-auto">0 - 0</p>
		<div class="gameScreen mx-auto">
			<div class="z-1 d-flex justify-content-center align-items-center w-100 h-100 position-absolute">
				<span hidden class="countdown">3</span>
			</div>
			<canvas id="pong" class="z-0 game border border-white"></canvas>
		</div>
		<div id="GameButtons" class="p-3 d-flex justify-content-center gap-3">
			<button id="StartGame" class="btn" type="button">Start Game</button>
		</div>
`;


let gameStruct = {
	isGameRunning: false,
	keysPressed: new Set(),
	canvas: {},
	ctx: {},
	socket: {},
	gameState: {},
	player1: "",
	player2: "",
	roomId: ""
};

const modes = {
	"Multiplayer": multi_game,
	"Local": local_game,
	"Tournament": tournament_game,
	"AI": ai_game
}

function switchListeners(remove, add, innerText) {
	const startGameBtn = document.getElementById("StartGame")

	if (startGameBtn) {
		startGameBtn.innerHTML = innerText
		startGameBtn.addEventListener("click", add)
		startGameBtn.removeEventListener("click", remove)
	}
}

function MatchPanic() {
	console.log("Calling MatchPanic")
	gameStruct.isGameRunning = false
	gameStruct.socket.close()
	gameStruct.ctx.clearRect(0, 0, gameStruct.canvas.width, gameStruct.canvas.height)
	navigation.removeEventListener("navigate", MatchPanic)
	console.log("End Panic")
}

export async function gamePage(app, params) {
	console.log(params)
	gameStruct.gamemode = params.Gamemode
	if (gameStruct.gamemode == "Multiplayer" && !sessionStorage.getItem("User")
		|| gameStruct.gamemode == "Tournament" && !history.state.MatchId) {
		replaceStateRouter(null, "/")
		return
	}
	app.innerHTML = gamehmtl;

	gameStruct.canvas = document.getElementById("pong");
	gameStruct.ctx = gameStruct.canvas.getContext("2d");
	gameStruct.canvas.width = gameStruct.canvas.offsetWidth;
	gameStruct.canvas.height = gameStruct.canvas.offsetHeight;

	// Split functions between gamemodes. Dont wrap all functions in the button
	const startGameBtn = app.querySelector("#StartGame");
	startGameBtn.addEventListener("click", prepareGame);
}

function startCountdown() {
	return new Promise((resolve) => {
		let countdown = document.querySelector(".countdown");
		countdown.innerHTML = 3;
		countdown.hidden = false;
		gameStruct.canvas.style.filter = 'blur(8px)';
		const interval = setInterval(() => {
			countdown.innerHTML--;
		}, 1000);
		setTimeout(() => {
			clearInterval(interval);
			countdown.hidden = true;
			gameStruct.canvas.style.filter = 'blur(0)';
			resolve();
		}, 4000);
	});
}

async function multi_game() {
	console.log("Multiplayer Game")
	switchListeners(prepareGame, cancelQueue, "Cancel Queue")
	const roomId = await QueueWebSocket()
	
	return roomId
}

async function local_game() {
	console.log("Local Game")
	const roomId = getRoomId()

	gameStruct.player1 = sessionStorage.getItem("User") || "Player1"
	gameStruct.player2 = "Player2"
	return roomId
}

async function tournament_game() {
	console.log("Tournament Game")
	const roomId = getRoomId()

	gameStruct.player1 = localStorage.getItem("Player1")
	gameStruct.player2 = localStorage.getItem("Player2")
	localStorage.removeItem("Player1")
	localStorage.removeItem("Player2")
	return roomId
}

async function ai_game() {
	console.log("AI Game")
	const roomId = getRoomId()

	gameStruct.player1 = sessionStorage.getItem("User") || "Player1"
	gameStruct.player2 = "AI"
	localStorage.removeItem("Player1")
	return roomId

}

async function prepareGame(e) {
	console.log("Inside StartGame")
	const game = modes[gameStruct.gamemode]

	game().then((roomId) => {
		if (!roomId) {
			return
		}
		console.log(roomId)
		const url = `wss://${window.location.host}/ws/game/${roomId}/`
		const msg = {
			gametype: gameStruct.gamemode,
			player1: gameStruct.player1,
			player2: gameStruct.player2,
			matchId: history.state.MatchId || null,
			// room_id: roomId Commented until a related error occurs
		}
		startGame(url, msg)
	})
}

async function startGame(url, msg) {
	const startGameBtn = document.getElementById("StartGame")

	startGameBtn.hidden = true
	gameStruct.ctx.clearRect(0, 0, gameStruct.canvas.width, gameStruct.canvas.height)
	await startGameWebSocket(url)
	navigation.addEventListener("navigate", MatchPanic)
	document.getElementById("PlayerNamesContainer").style.display = "flex"
	document.getElementById("Player1Name").innerText = gameStruct.player1;
	document.getElementById("Player2Name").innerText = gameStruct.player2;
	drawTable();
	await startCountdown()
	sendToWebSocket(msg)
	keyboardControlsListener()
	while (gameStruct.isGameRunning) {
		await gameLoop()
		console.log("GAme Loop")
	}
	gameStruct.socket.close()
	startGameBtn.hidden = false
}

function cancelQueue(e) {
	console.log("Cancel queue")
	e.currentTarget.params.close()
	switchListeners(prepareGame, cancelQueue, "Start Game")
}

function sendToWebSocket(dataToSend) {
	if (gameStruct.socket.readyState === WebSocket.OPEN) {
		gameStruct.socket.send(JSON.stringify(dataToSend));
	}
}

function keyboardControlsListener() {
	window.addEventListener("keydown", (e) => gameStruct.keysPressed.add(e.key))
	window.addEventListener("keyup", (e) => gameStruct.keysPressed.delete(e.key))
}

function gameLoop() {
	if (!gameStruct.isGameRunning) {
		console.log("End Game")
	}
	updateGameLogic();
	drawGame();
	return (new Promise(requestAnimationFrame))
}

function drawgameWinner(data) {
	gameStruct.ctx.clearRect(0, 0, gameStruct.canvas.width, gameStruct.canvas.height);

	gameStruct.ctx.font = "40px Comic Sans";
	gameStruct.ctx.fillStyle = "white";
	gameStruct.ctx.textAlign = "center";

	const winnerText = `${data.winner} has Won!`;

	gameStruct.ctx.fillText(
		winnerText, 
		gameStruct.canvas.width / 2, 
		gameStruct.canvas.height / 2
	);
}

function updateGameLogic() {
	const player1Move = getPlayerMovement(1);
	const player2Move = getPlayerMovement(2);
	sendToWebSocket({ player1_move: player1Move, player2_move: player2Move });
}

function getPlayerMovement(player) {
	let move = 0;
	if (gameStruct.gamemode === "Multiplayer" || gameStruct.gamemode === "AI") {
		if (gameStruct.keysPressed.has("w") || gameStruct.keysPressed.has("ArrowUp")) move = -1;
		else if (gameStruct.keysPressed.has("s") || gameStruct.keysPressed.has("ArrowDown")) move = 1;
	} else if (gameStruct.gamemode === "Local" || gameStruct.gamemode === "Tournament") {
		if (player === 1) {
			if (gameStruct.keysPressed.has("w")) move = -1;
			if (gameStruct.keysPressed.has("s")) move = 1;
		} else if (player === 2) {
			if (gameStruct.keysPressed.has("ArrowUp")) move = -1;
			if (gameStruct.keysPressed.has("ArrowDown")) move = 1;
		}
	}
	return move;
}
 
function drawPaddles() {
	let paddleHeight = 100;
	let paddleWidth = 20;
	let gap = 5;
	gameStruct.ctx.fillStyle = "#4890cf";
	gameStruct.ctx.fillRect(gap, gameStruct.gameState.player1_y, paddleWidth, paddleHeight);
	gameStruct.ctx.fillStyle = "#c95153";
	gameStruct.ctx.fillRect(gameStruct.canvas.width - paddleWidth - gap, gameStruct.gameState.player2_y, paddleWidth, paddleHeight);
}

function drawTable() {
	gameStruct.ctx.beginPath();
	gameStruct.ctx.strokeStyle = "white";
	gameStruct.ctx.moveTo(gameStruct.canvas.width / 2, 0);
	gameStruct.ctx.lineTo(gameStruct.canvas.width / 2, gameStruct.canvas.height);
	gameStruct.ctx.stroke();
	gameStruct.ctx.closePath();
}

function drawBall() {
	let ballRadius = 10;
	gameStruct.ctx.fillStyle = "white";
	gameStruct.ctx.beginPath();
	gameStruct.ctx.arc(gameStruct.gameState.ball_x, gameStruct.gameState.ball_y, ballRadius, 0, Math.PI * 2);
	gameStruct.ctx.fill();
	gameStruct.ctx.closePath();
}

function drawGame() {
	gameStruct.ctx.clearRect(0, 0, gameStruct.canvas.width, gameStruct.canvas.height);
	drawTable();
	drawPaddles();
	drawBall();
}

function getRoomId() {
	return (Math.random().toString(36).substring(2, 8))
}

async function startGameWebSocket(url) {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(url);

		socket.onopen = function () {
			console.log("Opened Local Websocket:", socket.url)
			gameStruct.isGameRunning = true
			gameStruct.socket = socket
			resolve(socket)
		}
		socket.onmessage = function (event) {
			const data = JSON.parse(event.data)
			
			if (data.type === "accept_connection") {
				console.log(data)
			}
			else if (data.state === "over")
			{
				gameStruct.isGameRunning = false
				drawgameWinner(data)
				if (gameStruct.gamemode === "Tournament")
				{
					history.replaceState({Done: "Done"}, "")
					router("/tournament/brackets")
				}
			}
			else 
			{
				gameStruct.gameState = data
				const scoreElement = document.querySelector('#Score');
				if (!scoreElement)
				{
					socket.close()
					return;
				}
				scoreElement.innerHTML = `${data.player1_score} - ${data.player2_score}`;
			}
		}
		socket.onerror = function () {
			console.log("Error in WebSocket")
		}
		socket.onclose = function () {
			console.log("Closing Connection on Websocket:", socket.url)
			gameStruct.isGameRunning = false
			navigation.removeEventListener("navigate", MatchPanic)
		}
	})
}

function QueueWebSocket() {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(`wss://${window.location.host}/ws/queue/`)
		let roomId
	
		socket.onopen = function () {
			console.log("Opened Queue Websocket:", socket.url)
			gameStruct.socket = socket
			navigation.addEventListener("navigate", MatchPanic)
		}
		socket.onmessage = function (event) {
			const data = JSON.parse(event.data)
			if (data.type === "waiting") {
				console.log("Waiting For a Match")
				document.getElementById("StartGame").params = socket
			} else if (data.type === "match_found") {
				console.log(data)
				gameStruct.player1 = data.player1
				gameStruct.player2 = data.player2
				console.log("Found Match")
				roomId = data.room_id
			}
		}
		socket.onerror = function () {
			console.error("Error in Queue WebSocket")
		}
		socket.onclose = function () {
			console.log("Closing Connection on Queue Websocket:", socket.url)
			switchListeners(cancelQueue, prepareGame, "Start Game")
			navigation.removeEventListener("navigate", MatchPanic)
			resolve(roomId)
		}
	})
}