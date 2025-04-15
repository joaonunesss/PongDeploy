import { constructElement } from "./domApi.js";
import {router} from "./router.js";

const homehtml = /* html */ `
	<style>
        #HomeTitleUnderConstruction {
            font-size: 2.5rem; /* Larger font size */
            font-weight: bold; /* Make the text bold */
            color: #ff6347; /* Use a bright color like tomato */
            text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5); /* Add a subtle shadow for better contrast */
            animation: fadeIn 3s ease-in-out; /* Add a fade-in animation */
            margin-top: 20px; /* Space it a bit from the title */
            text-align: center;
          
        }

        @keyframes fadeIn {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }
    </style>

	<p id="HomeTitle" class="PongTitle mx-auto">Ping Pong Panic</p>
	<p id="HomeTitleUnderConstruction" class="developing mx-auto">Still Under Construction</p>
	<div class="Ball"></div>
	<div class="d-flex flex-row justify-content-center">
		<!---div class="Paddle ms-5"></div --->
		<div id="HomeButtons" class="d-flex flex-column align-items-center">
			<a hidden id="Multiplayer" href="/game/Multiplayer" class="btn btn-lg homeButton">🆚 Multiplayer</a>
			<a id="Local" href="/game/Local" class="btn btn-lg homeButton">🖥️ Local</a>
			<a id="AI" href="/game/AI" class="btn btn-lg homeButton">🤖 Play vs AI</a>
			<a id="Tournament" href="/tournament" class="btn btn-lg homeButton">🏆 Tournament</a>
		</div>
		<!--- div class="Paddle me-5"></div --->
		</div>
		<div class="text-center">
			<button id="mageButton" class="btn Glitch"><img src="../static/images/wizard.png" width="50px" height="50px" ></button>
			<button id="CrabButton" class="btn Glitch"><img src="../static/images/Crab.png" width="50px"></button>
		</div>
`;


export function homePage(app) {
	console.log("This is Home Page");
    app.innerHTML = homehtml;

	if (sessionStorage.getItem("User")) {
		document.getElementById("Multiplayer").hidden = false
	}
    loadEvents(app);
}

// Global audio instance for crab
let crabMusic = new Audio("../static/Audio/crabRaveMusic.mp3");
crabMusic.loop = true; // Ensure looping

// Global audio instance for mage
let mageMusic = new Audio("../static/Audio/epicSaxGuy.mp3");
mageMusic.loop = true; // Ensure looping

function crabFest() {
	let bgImg = document.getElementById("BackgroundImage");

	bgImg.style.opacity = 0.1
	bgImg.style.backgroundImage = "url(https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnc4Yzk0azR1NHk4aHJqdDBwcTVhdTZpcndnejV4dWhvaXJzcWY2dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8nLYTOjYtRVBqIMK68/giphy.gif)";
	bgImg.style.backgroundSize = "cover";

	/* Secret arts of the Crab */
	if (crabMusic.paused)
	{
        crabMusic.currentTime = 0; // Reset position
		if (mageMusic.play())
			mageMusic.pause();
        crabMusic.play();
    }
	else
        crabMusic.pause();
}

function mageDance() {
	let bgImg = document.getElementById("BackgroundImage");

	bgImg.style.backgroundImage = "url(https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmYxc2hxM3hteHczenFneWozMDl3N2pwaW5idTZveG1teHU5Z3F4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TcdpZwYDPlWXC/giphy.gif)";
	bgImg.style.opacity = 0.3
	bgImg.style.backgroundSize = "cover";

	/* Secret arts of the Mage */
	if (mageMusic.paused)
	{
		mageMusic.currentTime = 0; // Reset position
		if (crabMusic.play())
			crabMusic.pause();
		mageMusic.play();
	}
	else
		mageMusic.pause();

}

function loadEvents(app) {
    let homeButtonsDiv = app.querySelector("#HomeButtons");
	let anchors = homeButtonsDiv.querySelectorAll(".btn");
	let crabButton = app.querySelector("#CrabButton");

    for (let a of anchors) {
        a.addEventListener("click", (e) => {
			e.preventDefault();
			console.log(e.target.id)
            router(e.target.pathname);
        });
    }
	mageButton.addEventListener("click", () => {
		//mageButton.hidden = true;
		mageDance();
	});
	crabButton.addEventListener("click", () => {
		//crabButton.hidden = true;
		crabFest();
	});
}
