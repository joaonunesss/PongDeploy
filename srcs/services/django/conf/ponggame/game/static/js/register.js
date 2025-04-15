import { getCSRFToken } from "./EventUtils.js";
import { router } from "./router.js";
import { loginPage } from './login.js'; // Call loginPage function to redirect
import { fetchCSRFToken } from './EventUtils.js';

// Register Page HTML template
const registerHtml = /* html */ `
  <div class="box text-white">
    <h1 class="p-5 text-center">Register</h1>
    <form id="registerForm">
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
        <div class="form-group pb-3">
          <label for="email">Email</label>
          <input
            name="email"
            type="email"
            class="form-control"
            autocomplete="email"
            id="email"
            placeholder="Email"
          />
        </div>
        <div class="form-group pb-2">
          <label for="password">Password</label>
          <input
            name="password"
            type="password"
            class="form-control"
            autocomplete="new-password"
            id="password"
            placeholder="Password"
          />
        </div>
        <button id="pol" type="submit" class="btn btn-info">Register</button>
      </div>
    </form>
    <div id="message" class="w-25 mx-auto mt-4"></div>
  </div>
`;

export function registerPage(app) {
    console.log("This is Register Page");
    app.innerHTML = registerHtml;

    const registerForm = document.getElementById("registerForm");
    const messageDiv = document.getElementById("message");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    await fetchCSRFToken(); // Ensure the CSRF cookie is set

        const username = document.getElementById("userName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const data = { username, email, password };

    try {
      const response = await fetch("/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        credentials: "same-origin",
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log("Registration Successful");
        messageDiv.innerHTML = `<div class="alert alert-success">Registration successful! Redirecting...</div>`;

                setTimeout(() => {
                    router("/login"); // Redirect to login page after successful registration
                }, 1000);
            } else {
                const errorResult = await response.json();
                console.error("Registration Failed:", errorResult);
                messageDiv.innerHTML = `<div class="alert alert-danger">${
                    errorResult.message ||
                    "Registration failed. Please try again."
                }</div>`;
            }
        } catch (error) {
            console.error("Error sending registration request:", error);
            messageDiv.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again later.</div>`;
        }
    });
}
