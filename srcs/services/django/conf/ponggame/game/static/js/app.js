import { updateNavbar , listeningNavbar, isalphanum} from "./EventUtils.js";
import { GETrequest } from "./Requests.js";
import {router, popstateRouter} from "./router.js";

// Initializes the navbar and events
document.addEventListener("DOMContentLoaded", async () => {
	console.log("DOM loaded.");
	const response = await GETrequest("/user/info")

	if (response && response.username) {
		sessionStorage.setItem("User", response.username)
	}
	router(location.pathname);
	updateNavbar(); // Checks for state change to update navbar
	listeningNavbar(); // Listens for events on the navbar
});

// Sets up navigation when the back button is clicked
window.addEventListener("popstate", () => {
	popstateRouter(location.pathname);
});
