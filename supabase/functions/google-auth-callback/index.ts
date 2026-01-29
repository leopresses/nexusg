import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get frontend URL for redirects
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://nexusg.lovable.app";
    
    // Handle errors from Google
    if (error) {
      console.error("OAuth error from Google:", error);
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=missing_params`);
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      console.error("Invalid state encoding");
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=invalid_state`);
    }

    const { userId, timestamp } = stateData;
    
    // Check state age (10 minutes max)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      console.error("State expired");
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=expired`);
    }

    // Exchange code for tokens
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/google-auth-callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received, expires_in:", tokens.expires_in);

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let googleEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      googleEmail = userInfo.email;
      console.log("Google user email:", googleEmail);
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save tokens to database using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Upsert the connection
    const { error: dbError } = await supabaseAdmin
      .from("google_user_connections")
      .upsert({
        user_id: userId,
        google_email: googleEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        status: "connected",
        error_message: null,
      }, {
        onConflict: "user_id",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=db_error`);
    }

    console.log("Google connection saved for user:", userId);
    
    // Redirect back to settings with success
    return Response.redirect(`${frontendUrl}/settings?google_auth=success`);
  } catch (error) {
    console.error("Error in google-auth-callback:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://nexusg.lovable.app";
    return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=internal_error`);
  }
});
