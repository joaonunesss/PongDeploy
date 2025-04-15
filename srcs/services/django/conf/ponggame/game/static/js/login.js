import { showOTPForm } from './verify2fa.js';
import { fetchCSRFToken, getCSRFToken } from './EventUtils.js';
import {router} from "./router.js";

const loginHtml = /* html */`
	<div class="box text-white">
		<h1 class="p-5 text-center">Log-In</h1>
		<form id="loginForm">
			<div class="w-25 mx-auto">
				<div class="form-group pb-2">
					<label for="userName">Username</label>
					<input
						name="username"
						type="text"
						class="form-control"
						autocomplete="username"
						id="userName"
						placeholder="Username"
					/>
				</div>
				<div class="form-group pb-2">
					<label for="password">Password</label>
					<input
						name="password"
						type="password"
						class="form-control"
						autocomplete="current-password"
						id="password"
						placeholder="Password"
					/>
				</div>
				<button id="loginBtn" type="submit" class="btn btn-info">Log-In</button>
			</div>
		</form>
		<!--
		<div class="w-25 mx-auto mt-4">
			<button id="schoolLoginButton" class="btn btn-secondary">Login with 42 API</button>
		</div>
		-->
		<div id="message" class="w-25 mx-auto mt-4"></div>
	</div>
`;

  export async function loginPage(app) {
    console.log("This is Login Page");
    app.innerHTML = loginHtml;

	const loginForm = document.getElementById("loginForm");
	const messageDiv = document.getElementById("message");

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		await fetchCSRFToken(); // Ensure the CSRF cookie is set

		const username = document.getElementById("userName").value.trim();
		const password = document.getElementById("password").value.trim();

		if (!username || !password) {
			messageDiv.innerHTML = `<div class="alert alert-danger">Username and password are required.</div>`;
			return;
		}

		const data = { username, password };

		try {
			const response2FA = await fetch("/send2FaEmail/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": getCSRFToken(),
				},
				credentials: "same-origin",
				body: JSON.stringify(data)
			});

			if (response2FA.ok) {
				console.log("Sending 2FA");
				showOTPForm(app, username, password); // Render OTP form dynamically
			} else {
				const errorResult = await response2FA.json();
				messageDiv.innerHTML = `<div class="alert alert-danger">${response2FA.status === 401 ? "Invalid credentials. Please try again." : "Error sending 2FA. Please try again later."}</div>`;
				console.error("Error:", errorResult);
			}
		} catch (error) {
			console.error("Error sending 2FA request:", error);
			messageDiv.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again later.</div>`;
		}
	});
}
