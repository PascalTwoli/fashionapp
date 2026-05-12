// Supabase Edge Function to handle Google OAuth token exchange
// This must be run via: supabase functions deploy exchange-google-token

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { code, redirectUri } = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Authorization code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Get secrets from environment
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")

    console.log("[exchange-google-token] Client ID exists:", !!clientId)
    console.log("[exchange-google-token] Client Secret exists:", !!clientSecret)
    console.log("[exchange-google-token] Auth code:", code.substring(0, 10) + "...")
    console.log("[exchange-google-token] Redirect URI:", redirectUri)

    if (!clientId || !clientSecret) {
      console.error("[exchange-google-token] Missing credentials:")
      console.error("  - GOOGLE_CLIENT_ID:", clientId ? "set" : "NOT SET")
      console.error("  - GOOGLE_CLIENT_SECRET:", clientSecret ? "set" : "NOT SET")
      return new Response(
        JSON.stringify({
          error: "Server configuration error - missing Google credentials",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    })

    console.log("[exchange-google-token] Google response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("[exchange-google-token] Token exchange error:", errorData)
      return new Response(
        JSON.stringify({
          error: errorData.error_description || `Token exchange failed: ${errorData.error}`,
        }),
        {
          status: tokenResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("[exchange-google-token] Token exchange successful")

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
