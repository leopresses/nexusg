import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// AES-GCM encryption for tokens
async function encryptToken(plaintext: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    encoder.encode(plaintext)
  );
  
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return encodeBase64(combined.buffer);
}

// Helper to create error redirect URL with meaningful codes
function errorRedirect(frontendUrl: string, code: string, details?: string): Response {
  const params = new URLSearchParams({
    google_auth: "error",
    code,
    ...(details ? { details } : {}),
  });
  return Response.redirect(`${frontendUrl}/settings?${params.toString()}`);
}

serve(async (req) => {
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://nexusg.lovable.app";
  
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    console.log("Callback received - code:", !!code, "state:", !!state, "error:", error);

    // Handle errors from Google
    if (error) {
      console.error("OAuth error from Google:", error, errorDescription);
      // Map known Google errors to user-friendly codes
      let errorCode = "google_error";
      if (error === "access_denied") {
        errorCode = "access_denied";
      } else if (error === "redirect_uri_mismatch") {
        errorCode = "redirect_uri_mismatch";
      } else if (error === "invalid_client") {
        errorCode = "invalid_client";
      }
      return errorRedirect(frontendUrl, errorCode, error);
    }

    if (!code || !state) {
      console.error("Missing code or state in callback");
      return errorRedirect(frontendUrl, "missing_params");
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
      
      const { userId, timestamp } = stateData;
      
      if (!userId || !timestamp) {
        throw new Error("Missing required state fields");
      }
      
      // Check state age (10 minutes max)
      const stateAge = Date.now() - timestamp;
      if (stateAge > 10 * 60 * 1000) {
        console.error("State expired, age:", stateAge / 1000, "seconds");
        return errorRedirect(frontendUrl, "state_expired");
      }
    } catch (stateError) {
      console.error("State validation failed:", stateError);
      return errorRedirect(frontendUrl, "invalid_state");
    }

    const { userId } = stateData;
    console.log("Processing OAuth for user:", userId);

    // Get environment variables
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Validate configuration
    if (!googleClientId || !googleClientSecret) {
      console.error("Missing Google OAuth credentials");
      return errorRedirect(frontendUrl, "config_error", "google_credentials");
    }
    if (!encryptionKey) {
      console.error("Missing TOKEN_ENCRYPTION_KEY");
      return errorRedirect(frontendUrl, "config_error", "encryption_key");
    }
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase credentials");
      return errorRedirect(frontendUrl, "config_error", "supabase");
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/google-auth-callback`;

    // Exchange code for tokens
    console.log("Exchanging code for tokens...");
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
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("Token exchange failed:", tokenResponse.status, errorData);
      
      // Map specific token errors
      const tokenError = errorData.error || "unknown";
      if (tokenError === "redirect_uri_mismatch") {
        return errorRedirect(frontendUrl, "redirect_uri_mismatch");
      } else if (tokenError === "invalid_grant") {
        return errorRedirect(frontendUrl, "invalid_grant");
      } else if (tokenError === "invalid_client") {
        return errorRedirect(frontendUrl, "invalid_client");
      }
      return errorRedirect(frontendUrl, "token_exchange_failed", tokenError);
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received successfully, expires_in:", tokens.expires_in);

    if (!tokens.access_token) {
      console.error("No access token in response");
      return errorRedirect(frontendUrl, "no_access_token");
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token, encryptionKey);
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encryptToken(tokens.refresh_token, encryptionKey)
      : null;

    console.log("Tokens encrypted successfully");

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let googleEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      googleEmail = userInfo.email;
      console.log("Google user email:", googleEmail);
    } else {
      console.warn("Could not fetch Google user info, continuing without email");
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save encrypted tokens to database using service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Upsert the connection with encrypted tokens
    const { error: dbError } = await supabaseAdmin
      .from("google_user_connections")
      .upsert({
        user_id: userId,
        google_email: googleEmail,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        status: "connected",
        error_message: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (dbError) {
      console.error("Database error:", dbError.message, dbError.code);
      return errorRedirect(frontendUrl, "database_error", dbError.code);
    }

    console.log("Google connection saved successfully for user:", userId);
    
    // Redirect back to settings with success
    return Response.redirect(`${frontendUrl}/settings?google_auth=success`);
  } catch (error) {
    console.error("Unexpected error in google-auth-callback:", error);
    return errorRedirect(frontendUrl, "internal_error");
  }
});
