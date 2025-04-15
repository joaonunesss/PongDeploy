import { fetchCSRFToken, getCSRFToken, updateNavbar } from './EventUtils.js';
import {router} from "./router.js";

const otpHtml = /* html */`
	<div class="box text-white">
		<h1 class="p-5 text-center">Two-Factor Authentication</h1>
		<form id="otpForm">
			<div class="w-25 mx-auto">
				<div class="form-group pb-2">
					<label for="otpCode">Enter OTP</label>
					<input
						name="otp"
						type="text"
						class="form-control"
						id="otpCode"
						placeholder="Enter OTP"
						autocomplete="one-time-code"
					/>
				</div>
				<button id="verifyOtpBtn" type="submit" class="btn btn-info">Verify OTP</button>
				<div id="message" class="w-25 mx-auto mt-4"></div>
			</div>
		</form>
	</div>
`;

async function request_jwt(otpData) {
	const response = await fetch("/game/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCSRFToken(),
		},
		body: JSON.stringify(otpData)
	})
	if (!response.ok) {
		console.log("Login Failed!")
		throw `<div class="alert alert-danger">Login failed!.</div>`
	}
	const data = await response.json()
	console.log(data.data)
}

async function request_verify2Fa(otpData) {
	const otpVerifyResponse = await fetch("/verify2FaCode/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCSRFToken(),
		},
		credentials: "same-origin",
		body: JSON.stringify(otpData)
	})
	if (!otpVerifyResponse.ok) {
		console.log("2Fa Failed!")
		throw `<div class="alert alert-danger">Invalid 2FA code. Please try again.</div>`
	}
	console.log("2FA verification successful");
}

export function showOTPForm(app, username, password) {
	console.log("This is OTPcode Page");
	app.innerHTML = otpHtml;

	const otpForm = document.getElementById("otpForm");
	const messageDiv = document.getElementById("message");

	otpForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		await fetchCSRFToken(); // Ensure the CSRF cookie is set

		const otpCode = document.getElementById("otpCode").value.trim();
		if (!otpCode) {
			console.error("OTP code required");
			messageDiv.innerHTML = `<div class="alert alert-danger">OTP code required.</div>`;
			return;
		}
	
		const otpData = {
			username,
			otpCode: otpCode
		};
		const loginData = {
			username: username,
			password: password
		}

		console.log("Sending OTP verification request");
		try {
			await request_verify2Fa(otpData)
			await request_jwt(loginData)
			sessionStorage.setItem("User", username)
			updateNavbar();
			router("/")
		} catch (error) {
			messageDiv.innerHTML = error
		}
			
	});
}
    