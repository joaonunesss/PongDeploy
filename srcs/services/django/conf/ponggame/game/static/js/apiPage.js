export async function handleOAuthCallback() {


    
    console.log("handleOAuthCallback invoked");  // Debug log
    // Delay redirect to inspect logs
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay


    // Parse query parameters from the URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // Verify this matches what you set earlier if needed
    
    if (!code) {
      console.error("No authorization code received.");
      return;
    }
  
    // Send the authorization code to your backend for exchange
    try {
      const response = await fetch("/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state })
      });
      if (response.ok) {
        const data = await response.json();
        console.log("User info received:", data);
        // Redirect the user to the dashboard
        window.location.href = "/profile";

      } else {
        console.error("Token exchange failed");
      }
    } catch (error) {
      console.error("Error during token exchange:", error);
    }
  }
  