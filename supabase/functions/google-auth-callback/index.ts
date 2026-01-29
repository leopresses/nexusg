import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// AES-GCM encryption for tokens
async function encryptToken(plaintext: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key.padEnd(32, "0").slice(0, 32)), // Ensure 256-bit key
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    encoder.encode(plaintext)
  );
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return encodeBase64(combined.buffer);
}

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
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=auth_failed`);
    }

    // Decode and validate state - use generic error message for all state validation failures
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
      
      const { userId, timestamp } = stateData;
      
      // Validate required fields and check state age (10 minutes max)
      if (!userId || !timestamp || Date.now() - timestamp > 10 * 60 * 1000) {
        throw new Error("Invalid state data");
      }
    } catch (stateError) {
      // Use generic error message to prevent timing attacks
      console.error("State validation failed:", stateError);
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=auth_failed`);
    }

    const { userId } = stateData;

    // Exchange code for tokens
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    const callbackUrl = `${supabaseUrl}/functions/v1/google-auth-callback`;

    if (!encryptionKey) {
      console.error("TOKEN_ENCRYPTION_KEY not configured");
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=auth_failed`);
    }

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
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=auth_failed`);
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received, expires_in:", tokens.expires_in);

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
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save encrypted tokens to database using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
      }, {
        onConflict: "user_id",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=auth_failed`);
    }

    console.log("Encrypted Google connection saved for user:", userId);
    
    // Redirect back to settings with success
    return Response.redirect(`${frontendUrl}/settings?google_auth=success`);
  } catch (error) {
    console.error("Error in google-auth-callback:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://nexusg.lovable.app";
    return Response.redirect(`${frontendUrl}/settings?google_auth=error&message=auth_failed`);
  }
});
