export function blockchainResults(results) {
	// Create or select an element to show the results.
	console.log(results)
	let resultsContainer = document.getElementById("results-container");

	// If the container doesn't exist, create one.
	if (!resultsContainer) {
	  resultsContainer = document.createElement("div");
	  resultsContainer.id = "results-container";

	  // For example, you might want to insert it after the messageDiv
	  const messageDiv = document.getElementById("message");
	  messageDiv.parentNode.insertBefore(resultsContainer, messageDiv.nextSibling);
	}
  
	// Create an HTML string to display the results nicely.
	// This is a basic example. Adjust according to the structure of your `results` data.
	let html = `<div class="blockchain-results">
				  <h2 class="text-center text-white">Blockchain Tournament Results</h2>
				  <ul class="list-group">`;
  
	// Assuming results is an array of tournament objects
	results.forEach((result) => {
	  html += `<li class="list-group-item">
				<strong>${result.tournamentName}</strong> - ${result.winner}
			   </li>`;
	});
  
	html += `</ul></div>`;
  
	// Insert the generated HTML into the container
	resultsContainer.innerHTML = html;
  }