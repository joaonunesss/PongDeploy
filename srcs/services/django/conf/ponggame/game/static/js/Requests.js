import { getCSRFToken } from "./EventUtils.js"

export function POSTrequest(url, body) {
	return new Promise(async (resolve, reject) => {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": getCSRFToken()
			},
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			resolve()
		}
		const payload = await response.json()
		resolve(payload)
	})
}

export function GETrequest(url) {
	return new Promise(async (resolve, reject) => {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": getCSRFToken()
			},
		})
		const payload = await response.json()
		if (!response.ok) {
			console.log(payload)
			resolve()
		}
		resolve(payload)
	})
}

export async function request_api(url) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": getCSRFToken()
		}
	})
	if (response.status === 401) {
		const response = await fetch("/game/token/refresh", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": getCSRFToken()
			}
		})
		if (response.status === 401 || response.status === 500) {
			const l = await response.json()
			console.log(l)
			return "ERROR"
		}
		request_api(url)
	}
	return await response.json()
}
