import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * OAuth Callback page for Google Drive authentication
 * Google redirects here after user authenticates
 * This page exchanges the auth code for tokens and sends them back to the opener
 */
const GoogleOAuthCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get auth code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
          console.error("[GoogleOAuthCallback] Error from Google:", error);
          window.opener.postMessage(
            {
              type: "GOOGLE_AUTH_ERROR",
              error: `Google OAuth Error: ${error}`,
            },
            window.location.origin
          );
          window.close();
          return;
        }

        if (!code) {
          console.error("[GoogleOAuthCallback] No auth code received");
          window.opener.postMessage(
            {
              type: "GOOGLE_AUTH_ERROR",
              error: "No authorization code received from Google",
            },
            window.location.origin
          );
          window.close();
          return;
        }

        console.log("[GoogleOAuthCallback] Received auth code, exchanging for tokens...");

        // Get Supabase session for auth header
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("No active session - please sign in first");
        }

        // Get your Supabase project URL from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/exchange-google-token`;

        // Call Supabase Edge Function to exchange code for tokens
        // Include Authorization header with session token
        const response = await fetch(edgeFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            code: code,
            redirectUri: `${window.location.origin}/auth/google-callback`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error_description || `Token exchange failed: ${response.status}`
          );
        }

        const tokenData = await response.json();
        console.log("[GoogleOAuthCallback] Token exchange successful");

        // Send token back to opener window
        window.opener.postMessage(
          {
            type: "GOOGLE_AUTH_SUCCESS",
            token: {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              expires_in: tokenData.expires_in,
              token_type: tokenData.token_type,
            },
          },
          window.location.origin
        );

        // Close popup
        window.close();
      } catch (error) {
        console.error("[GoogleOAuthCallback] Error:", error);
        window.opener.postMessage(
          {
            type: "GOOGLE_AUTH_ERROR",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          window.location.origin
        );
        window.close();
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Authenticating with Google...</h2>
      <p>Please wait while we complete your authentication.</p>
      <p style={{ color: "#999", fontSize: "12px" }}>
        If this doesn't close automatically, you can close this window.
      </p>
    </div>
  );
};

export default GoogleOAuthCallback;
