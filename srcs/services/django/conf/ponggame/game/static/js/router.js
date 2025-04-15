import routes from "./routes.js"

function compareUrlLen(urls, potentialUrl) {
	let all = [];

	for (let it of urls) {
		if (it.path.split("/").splice(1).length === potentialUrl.length) {
			all.push(it);
		}
	}
	return (all);
}

function checkUrl(url, potentialUrlSegements) {
	const urlSegements = url.path.split("/").splice(1);
	let params = {};

	for (let i = 0; i < potentialUrlSegements.length; i++) {
		if (":" === urlSegements[i][0]) {
			params[urlSegements[i].replace(":", "")] = potentialUrlSegements[i];
		} else if (urlSegements[i] !== potentialUrlSegements[i]) {
			console.log("No params Link");
			return (null);
		}
	}
	return (params);
}

/**
 * Parses the desired url.
 * This functions confirms the validity of the url and,
 * 	if valid, parses the url for potential parameters.
 * Any url with ":", like this "/profile/:username", indicates that ":username"
 * 	is a parameter of the url, in this case the username of a player. (This only
 * 	applies for dynamic urls).
 * For dynamic urls this function returns the desired page and the parameters.
 * For normal urls this function only returns the desired page.
 * This function should not be exported, use the router function.
 *
 * @param {string} potentialUrl - Desired url from the client.
 * @returns {object} The corresponding object from routes array.
 *
 * @example
 * matchUrl("/profile/:ToniBiclas");
 * Result: Object {component: profilePage, params: "ToniBiclas"}
 */
function matchUrl(potentialUrl) {
	let matchedUrl = routes.find((route) => route.path === potentialUrl);

	if (matchedUrl) {
		return ({component: matchedUrl.component, params: null});
	}
	const potentialUrlSegements = potentialUrl.split("/").splice(1);
	const matchedUrls = compareUrlLen(routes, potentialUrlSegements);
	
	console.log(matchedUrls);
	for (let url of matchedUrls) {
		const params = checkUrl(url, potentialUrlSegements);
		if (params !== null) {
			return ({component: url.component, params: params});
		}
	}
}

/**
 * Routes the client to the desired url.
 * This function must be used to change the url.
 *
 * @param {string} potentialUrl - Desired url from the client.
 *
 * @example
 * router("/game");
 * Result: localhost -> localhost/game
 * User goes the game page.
 */
export function router(potentialUrl, state) {
	const matchedUrl = matchUrl(potentialUrl);

	if (!matchedUrl) {
		console.log("404 Error. This url \"" + potentialUrl + "\" is incorrect");
		return;
	}
	
	/* Logs the array: {component, params} */
/* 	console.log(matchedUrl); */
	
	/* Push Url to history */
	if (state) {
		history.pushState(state, "", potentialUrl);
	} else {
		history.pushState({}, "", potentialUrl);
	}

	/* Load the Component (Page) */
	renderComponent(matchedUrl);
}

/* 
* Same has router function, but doesn't put the url in history.
* This function is only used for the popstate event
* 	(back and foward browser buttons).
*/
export function popstateRouter(potentialUrl) {
	const matchedUrl = matchUrl(potentialUrl);

	if (!matchedUrl) {
		console.log("404 Error. This url \"" + potentialUrl + "\" is incorrect");
		return;
	}

	renderComponent(matchedUrl);
}

/* 
* Same has router function, but replaces the url in history.
* This function is mostly useful when we need to redirect a
* user from one url to the another without adding the first
* url into the history.
*/
export function replaceStateRouter(state, potentialUrl) {
	const matchedUrl = matchUrl(potentialUrl);
	
	if (!matchedUrl) {
		console.log("404 Error. This url \"" + potentialUrl + "\" is incorrect");
		return;
	}

	/* Replaces the currentUrl with the potentialUrl */
	if (state) {
		history.replaceState(state, "", potentialUrl);
	} else {
		history.replaceState({}, "", potentialUrl);
	}

	renderComponent(matchedUrl);
}

function renderComponent(url) {
	const app = document.getElementById("app");

	if (!url.params) {
		console.log("This url doesn't have params");
	} else {
		console.log("Params", url.params);
		url.component(app, url.params)
		return;
	}
	url.component(app);
}
