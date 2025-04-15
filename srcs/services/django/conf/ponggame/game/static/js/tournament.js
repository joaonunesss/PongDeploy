import * as dom from "./domApi.js"
import { GETrequest, POSTrequest } from "./Requests.js";
import {router} from "./router.js"
import {blockchainResults} from "./blockchain.js"
import { fetchCSRFToken, getCSRFToken } from "./EventUtils.js";

const tournamentHtml = /* html */`
	<div class="TournamentPage">
		<h1 class="text-center text-white display-3 mb-5">Tournaments</h1>
		<div class="d-flex align-items-center flex-column gap-4">
			<button class="btn btn-primary w-50 p-4" data-bs-toggle="modal" data-bs-target="#exampleModal">Create Local Tournament</button>
			<button id="block-btn" class="btn btn-primary w-50 p-4">Get Blockchain Tournament Results</button>
			<button hidden id="CurrentTournament" type="button" class="btn btn-primary w-50 p-4">See Current Tournament</button>
		</div>
		<div id="message" class="w-50 mx-auto mt-4"></div>
	</div>
`;

const createTournModalHtml = /* html */`
	<div class="modal" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
	  <div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
		  <div class="modal-header">
			<h1 class="modal-title fs-5" id="exampleModalLabel">Create Tournament</h1>
			<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
		  </div>
		  <div class="modal-body">
			<form>
			  <div class="mb-3">
				<label class="form-label">Tournament Name</label>
				<input id="TournamentName" name="TournamentName" type="text" class="form-control"/>
			  </div>
			  <div class="mb-3">
				<label for="PlayerNumber" class="form-label">Player Number</label>
				<input id="PlayerNumber" name="PlayerNumber" min="1" type="number" class="form-control"/>
			  </div>
			</form>
		  </div>
		  <div class="modal-footer">
			<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			<button id="CreateTournament" type="button" class="btn btn-primary" data-bs-dismiss="modal">Create</button>
		  </div>
		</div>
	  </div>
	</div>
`;

export async function getBlockchain()
{
	console.log("This getBlockchain");

	const blockBtn = document.getElementById("block-btn");
	const messageDiv = document.getElementById("message");
	
		blockBtn.addEventListener("click", async (event) => {
			event.preventDefault();
	
			await fetchCSRFToken(); // Ensure the CSRF cookie is set
	
			try {
				const response = await fetch("/tournament/all", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						"X-CSRFToken": getCSRFToken(),
					},
					credentials: "same-origin",
				});
	
				if (response.ok) {
					console.log("Requesting Blockchain results");
					console.log(response)
					const json = await response.json()
					blockchainResults(json.data);
				} else {
					messageDiv.innerHTML = `<div class="alert alert-danger">Failed to retrieve results.</div>`;
				}
			} catch (error) {
				console.error("Error requesting Blockchain results:", error);
				messageDiv.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again later.</div>`;
			}
		});
}

function check_player_count(player_count)
{
	const messageDiv = document.getElementById("message");
	try
	{
		if (player_count && (!isNaN(player_count) && Number.isInteger(Number(player_count))))
			{
				if (player_count <= 1)
					throw "Player Count must have more than 1 player"
				else if (player_count > 10)
					throw "Player Count must have 10 or less players"
				localStorage.setItem("PlayerCount", player_count);
			}
			else
			throw "Player Count must be a digit";
	}
	catch(err)
	{
		messageDiv.innerHTML = `<div class="alert alert-danger"> ` + err + ` </div>`
		return(0)
	}
	return(1)
}

export async function tournamentPage(app) {
	console.log("This is Tournament Page");
	
	const json = await GETrequest("/api/tournament")
	if (!json) {
		console.log("Error in GetRequest")
		return
	}
	const tourn = json.Tournament
	console.log("Tourn", tourn)

	app.innerHTML = tournamentHtml;

	getBlockchain();

	if (tourn.id) {
		const currentTournBtn = app.querySelector("#CurrentTournament");
		currentTournBtn.hidden = false;
		currentTournBtn.addEventListener("click", () => {
			router("/tournament/brackets");
		})
	}

	const body = document.querySelector("body");
	body.insertAdjacentHTML("beforeend", createTournModalHtml);
	
	/* Anchor or button #CreateTournament */
	const createTournBtn = body.querySelector("#CreateTournament");
	createTournBtn.addEventListener("click", (e) => {
		console.log("CreateTourn Listener");
		const player_count = body.querySelector("#PlayerNumber").value;
		console.log(body.querySelector("#PlayerNumber").value);
		localStorage.setItem("TournamentName", body.querySelector("#TournamentName").value)
		if (check_player_count(player_count))
			router("/tournament/alias");
	});
}

export async function makeTourn(nbrPlayers, tournName, playersArr) {
	return new Promise((resolve, reject) => {
		let nbrRounds = 0;
		let nbrMatches = nbrPlayers;

		do {
			nbrMatches = nbrMatches / 2;
			nbrRounds++;
		} while (nbrMatches > 1)
		POSTrequest("/api/tournament/create", {
			name: tournName,
			nbrPlayers: nbrPlayers,
			nbrRounds: nbrRounds,
			playersArr: playersArr,
			isFinished: false
		})
		.then((data) => {
			console.log(data)
			console.log(data.tournament_id);
			resolve();
		})
	})
}
