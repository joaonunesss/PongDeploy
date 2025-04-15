import {router} from "./router.js"

export function prepareEvents(collection, eventType, listener) {
    for (let element of collection) {
        element.addEventListener(eventType, listener);
    }
}

export function updateNavbar() {
    console.log("Updating Navbar");

    const registerBtn = document.getElementById("register-btn");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (sessionStorage.getItem("User")) { // If user is logged in
        registerBtn.style.display = "none";
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline";
    } else {
        registerBtn.style.display = "inline";
        loginBtn.style.display = "inline";
        logoutBtn.style.display = "none";
    }
}

export function listeningNavbar() {
    const navbar = document.querySelector(".Navbar");

	navbar.addEventListener("click", async (e) => {
		e.preventDefault();
		const id = e.target.id;
		if (id == "login-btn" || id == "register-btn" || id == "home-btn") {
			router(e.target.pathname)
		} else if (id == "logout-btn") {
			const response = await fetch("/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": getCSRFToken()
				}
			})
			console.log(await response.json())
			sessionStorage.removeItem("User")
			updateNavbar()
		}
	})
}

export async function fetchCSRFToken() {
    try {
        const response = await fetch("/get_csrf_token/", {
            method: "GET",
            credentials: "same-origin", // Garante que os cookies sejam enviados
        });

        if (!response.ok) {
            throw new Error("Failed to fetch CSRF token");
        }

        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
        return "";
    }
}

export function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="))
        ?.split("=")[1];

    return cookieValue || "";
}

export function isalphanum(str) {
	if (str.match(/^[a-zA-Z0-9_]*$/)) {
		return true
	}
	return false
}