import * as dom from "./domApi.js"
import { updateNavbar } from './EventUtils.js';

const profileHtml = /* html */ `
	<div class="ProfileMenu">
		<h1 class="text-white m-0">Player3</h1>
		<div class="d-flex gap-5 my-3">
			<img src="../static/images/Player/avatar2.png" alt="Avatar" id="ProfileAvatar">
			<div class="d-flex bg-white border border-dark">
				<div class="">
					<div id="PlayerStatus" class="m-4">
						<p>Games Played: 100</p>
						<p>Wins: 20</p>
						<p>Tournaments Played: 10</p>
						<p>Tournaments Won: 10</p>
					</div>
				</div>
				<div class="flex-grow-1">
					<div class="d-flex align-items-center m-4">
						<div class="me-4">
							<h2>20G</h2>
							<h2>15W</h2>
							<h2>5L</h2>
						</div>
						<div class="PieChart"><strong id="WinRate">100%</strong></div>
					</div>
				</div>
				<div class=""></div>
			</div>
		</div>
		<table class="text-white w-100 MatchHistory">
			<thead>
				<tr>
					<th></th>
					<th>Match Type</th>
					<th>Vs</th>
					<th>Score</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody id="PlayerMatchHistory">
			</tbody>
		</table>
	</div>
`;

export function profilePage(app) {
    console.log("This is Profile Page");

	//Bloqueio de acesso a pagina se o user nao tiver autenticado
    const token = localStorage.getItem("token");

    if (!token) {
        console.log("Usuário não autenticado! Redirecionando...");
        return;
    }

	app.innerHTML = profileHtml;

	updateNavbar();

	playerMatchHistory(app);
}

function fillRow(tr) {
	const tdContent = ["Defeat", "Local", "Player89", "0-5", "21/05/24"];

	if (tdContent[0] == "Defeat") {
		dom.addClassesToElement(tr, ["bg-danger"])
	} else {
		dom.addClassesToElement(tr, ["bg-success"])
	}
	for (let i = 0; i < 5; i++) {
		const td = dom.constructElement("td");
		td.innerHTML = tdContent[i];
		tr.append(td);
	}
}

function playerMatchHistory(app) {
	let matchHistory = app.querySelector("#PlayerMatchHistory");

	for (let i = 0; i < 10; i++) {
		const tr = dom.constructElement("tr");
		fillRow(tr);
		matchHistory.append(tr);
	}
}
