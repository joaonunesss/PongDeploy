import * as dom from "./domApi.js"
import { replaceStateRouter, router } from "./router.js";
import { POSTrequest } from "./Requests.js";
import { makeTourn } from "./tournament.js";
import { isalphanum } from "./EventUtils.js";

const tournamentRoomHtml = /* html */`
	<div class="TournamentPage">
		<h1 class="text-center text-white">Tournament Room</h1>
		<form id="TournamentPlayerAliasForm">
			<div id="TournamentPlayersAlias" class="d-flex justify-content-center flex-wrap text-white"></div>
			<div class="w-50 mx-auto text-center">
				<button id="StartTournament" type="button" class="btn btn-primary m-3">Start Tournament</button>
			<div>
		</form>
	</div>
`;

export function tournamentAliasPage(app) {
	console.log("This is tournament Page");

	app.innerHTML = tournamentRoomHtml;

	const nbrPlayers = localStorage.getItem("PlayerCount");
	const tournName = localStorage.getItem("TournamentName")

	playersAliasHtml(app, nbrPlayers);
	const startTournBtn = app.querySelector("#StartTournament");
	startTournBtn.addEventListener("click", async (e) => {
		const form = new FormData(app.querySelector("#TournamentPlayerAliasForm"));
		try {
			const playersArr = checkPlayerAlias(form);
			await makeTourn(nbrPlayers, tournName, playersArr);
			localStorage.removeItem("PlayerCount")
			localStorage.removeItem("TournamentName")
			replaceStateRouter(null, "/tournament/brackets");
		} 
		catch (err) 
		{
			dom.addClassesToElement(startTournBtn, ["btn-danger"])
			console.error(err);
		}
	});
}

function checkPlayerAlias(form) {
	console.log("Inside CheckAlias");
	const playerAlias = form.getAll("PlayerAlias");
	let check = [];

	console.log(playerAlias);
	for (let alias of playerAlias) {
		if (alias === "") {
			throw "Empty Alias";
		} else if (!isalphanum(alias)) {
			throw "Not Supported Alias"
		}
		if (!check.find((otherPlayersAlias) => otherPlayersAlias === alias)) {
			console.log("First of many");
		} else {
			throw "Same Alias";
		}
		check.push(alias);
	}
	console.log("End CheckAlias");
	return (check)
}

function playersAliasHtml(app, playerCount) {
	const tournamentAlias = app.querySelector("#TournamentPlayersAlias");

	for (let i = 0; i < playerCount; i++) {
		const playerAlias = dom.constructElement("div.p-3");
		const aliasLabel = dom.constructElement("label#alias.form-label.text-center.w-100");
		aliasLabel.innerHTML = "Player " + (i + 1);
		const aliasInput = dom.constructElement("input.form-control[for=alias][name=PlayerAlias][type=text]");
		playerAlias.append(aliasLabel);
		playerAlias.append(aliasInput);
		tournamentAlias.append(playerAlias);
	}
}

/* Brackets Functions */
const tournBracketsHtml = /* html */`
	<div class="TournamentPage">
		<h1 class="text-white text-center mb-5">Brackets</h1>
		<div id="TournamentInfo" class="d-flex justify-content-between mb-5">
			<div id="TournamentBrackets" class="d-flex"></div>
		</div>
		<h1 id="TournGames" class="text-center mb-5">Games</h1>
		<div id="TournamentGames" class="d-flex gap-3 justify-content-around flex-wrap"></div>
	</div>
`

export async function tournamentBracketsPage(app) {
	console.log("This is tournament Brackets Page")
	const url = "/api/tournament/matches";
	const json = await POSTrequest(url, {})

	if (!json) {
		console.log("Error While Tournament Post")
		replaceStateRouter(null, "/tournament")
		return
	}
	console.log(json);
	const winner = json.Winner 
	const matches = json.TournMatches
	const currRound = json.CurrRound

	app.innerHTML = tournBracketsHtml;
	if (winner) {
		tournWinner(app.querySelector("#TournamentInfo"), winner)
	}
	console.log(matches)
	makeRoundsHtml(matches)
	makeGamesHtml(matches[currRound - 1])
}

function makeRoundsHtml(matches) {
	const tournBracketsDiv = document.querySelector("#TournamentBrackets");
	
	for (let i = 0; matches[i]; i++) {
		const round = makeRoundHtml(matches[i], i, matches);
		tournBracketsDiv.append(round);
	}
}
		
function makeRoundHtml(matches, nbrRound, allMatch) {
	const round = dom.constructElement(`div#Round${nbrRound}.d-flex
		.gap-3.flex-column[data-value=Bracket]`);
	let tournItem
	let i = 1
	for (let match of matches) {
		tournItem = dom.constructElement("div.d-flex.align-items-center.TournamentItem.flex-fill");
		const matchHtml = dom.constructElement("div.d-flex.flex-column");
		const playersHtml = assignPlayer(match);
		dom.appendManyElements(matchHtml, playersHtml);
		tournItem.append(matchHtml)
		round.append(tournItem);
		i++
	}
	return (round);
}

function assignPlayer(match) {
	let playersHtml = null;
	let i = 0
	
	playersHtml = dom.constructManyElements("div.Player", 2);
	playersHtml[0].innerHTML = match.player1;
	if (match.player2) {
		playersHtml[1].innerHTML = match.player2;
	}
	while (match.game) {
		if (match.game.winner !== playersHtml[i].innerHTML) {
			dom.addClassesToElement(playersHtml[i], ["text-dark"])
			break
		}
		i++
	}
	return (playersHtml);
}

function makeGamesHtml(matches) {
	const tournGames = document.querySelector("#TournamentGames");

	for (let match of matches) {
		const wrapperDiv = dom.constructElement("div.border.border-white.border-4.rounded.p-3");
		const matchDiv = dom.constructElement("div.text-center");
		const players = dom.constructElement("p.h4")

		if (match.game && match.game.winner) {
			const won = dom.constructElement("p.h3")
			dom.addClassesToElement(wrapperDiv, ["bg-success"]);
			players.innerHTML = match.game.winner
			won.innerHTML = "Won"
			dom.appendManyElements(matchDiv, [players, won])
		} else {
			const gameBtn = dom.constructElement("a.btn.btn-primary[href=/game/Tournament]");
	
			gameBtn.innerHTML = "Game";
			gameBtn.addEventListener("click", (e) => {
				e.preventDefault();
				localStorage.setItem("Player1", match.player1)
				localStorage.setItem("Player2", match.player2)
				router(e.target.pathname, {MatchId: match.id});
			})
			players.innerHTML = match.player1 + " Vs " + match.player2;
			dom.appendManyElements(matchDiv, [players, gameBtn]);
		}
		wrapperDiv.append(matchDiv);
		tournGames.append(wrapperDiv);
	}
}

function tournWinner(tournInfoDiv, winner) {
	const winnerDiv = dom.constructElement("div.text-center")
	const winnerMsg = dom.constructElement("h1");
	winnerMsg.innerHTML = "Tournament Winner";
	const winnerPlayer = dom.constructElement("h3");
	winnerPlayer.innerHTML = winner
	
	dom.appendManyElements(winnerDiv, [winnerMsg, winnerPlayer])
	tournInfoDiv.append(winnerDiv)
}
/* End of Branckets Functions */
