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

// Helper to create error redirect using HTML page for better UX
function errorRedirect(frontendUrl: string, code: string, details?: string): Response {
  const params = new URLSearchParams({
    google_auth: "error",
    code,
    ...(details ? { details } : {}),
  });
  const redirectUrl = `${frontendUrl}/settings?${params.toString()}`;
  
  // User-friendly error messages
  const errorMessages: Record<string, string> = {
    "access_denied": "Você negou o acesso. É necessário permitir as permissões para conectar.",
    "redirect_uri_mismatch": "Erro de configuração OAuth. Contate o suporte técnico.",
    "invalid_client": "Credenciais do Google inválidas. Contate o suporte técnico.",
    "invalid_grant": "O código de autorização expirou. Tente novamente.",
    "state_expired": "A sessão de autenticação expirou. Tente novamente.",
    "invalid_state": "Erro de segurança na validação. Tente novamente.",
    "missing_params": "Resposta incompleta do Google. Tente novamente.",
    "token_exchange_failed": "Falha ao obter tokens. Tente novamente.",
    "no_access_token": "Google não retornou token de acesso. Tente novamente.",
    "database_error": "Erro ao salvar a conexão. Tente novamente.",
    "config_error": "Erro de configuração do servidor. Contate o suporte.",
    "internal_error": "Erro interno. Tente novamente ou contate o suporte.",
    "google_error": "Erro do Google. Tente novamente.",
  };
  
  const message = errorMessages[code] || "Ocorreu um erro. Tente novamente.";
  
  const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Erro na conexão</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin-bottom: 24px;
    }
    h1 { 
      font-size: 24px; 
      margin-bottom: 12px;
      color: #ef4444;
    }
    p { 
      color: #94a3b8; 
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .error-code {
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
      background: rgba(255,255,255,0.1);
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .redirect-notice {
      font-size: 14px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <h1>Erro na Conexão</h1>
    <p>${message}</p>
    <div class="error-code">Código: ${code}${details ? ` (${details})` : ''}</div>
    <p class="redirect-notice">Redirecionando...</p>
  </div>
  <script>
    setTimeout(function() {
      window.location.replace('${redirectUrl}');
    }, 3000);
  </script>
</body>
</html>`;

  return new Response(errorHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Parse query parameters from URL string - handles edge function URL formats
function parseQueryParams(urlString: string): URLSearchParams {
  // Try to find query string in various formats
  const questionMarkIndex = urlString.indexOf("?");
  if (questionMarkIndex !== -1) {
    return new URLSearchParams(urlString.substring(questionMarkIndex + 1));
  }
  return new URLSearchParams();
}

serve(async (req) => {
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://nexusg.lovable.app";
  
  try {
    // Log raw request info for debugging
    console.log("=== Google OAuth Callback ===");
    console.log("Raw URL:", req.url);
    console.log("Method:", req.method);
    
    // Parse URL - handle both standard URLs and edge function invocations
    let params: URLSearchParams;
    
    try {
      // First try standard URL parsing
      const url = new URL(req.url);
      params = url.searchParams;
      console.log("Standard URL parsing - search:", url.search);
    } catch {
      // Fallback to manual parsing
      console.log("Standard URL parsing failed, trying manual parse");
      params = parseQueryParams(req.url);
    }
    
    // If still no params, try parsing from the raw URL string directly
    if (!params.has("code") && !params.has("state") && !params.has("error")) {
      console.log("No params found via standard parsing, trying direct string parse");
      params = parseQueryParams(req.url);
    }
    
    let code = params.get("code");
    let state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    console.log("Parsed params - code:", !!code, "state:", !!state, "error:", error);
    
    // Handle errors from Google
    if (error) {
      console.error("OAuth error from Google:", error, errorDescription);
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
      // Log all available headers for debugging
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.error("Missing code or state in callback");
      console.error("Raw URL:", req.url);
      console.error("Headers:", JSON.stringify(headers));
      return errorRedirect(frontendUrl, "missing_params");
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number; nonce: string };
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
    console.log("Using callback URL for token exchange:", callbackUrl);

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
      console.error("Token exchange failed:", tokenResponse.status, JSON.stringify(errorData));
      
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
    console.log("Tokens received successfully, expires_in:", tokens.expires_in, "has_refresh_token:", !!tokens.refresh_token);

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
    
// Redirect back to settings with success using HTML page
    // This ensures proper browser navigation and preserves existing session
    const successHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Google conectado</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin-bottom: 24px;
    }
    h1 { 
      font-size: 24px; 
      margin-bottom: 12px;
      color: #22c55e;
    }
    p { 
      color: #94a3b8; 
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .redirect-notice {
      font-size: 14px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <h1>Google Business Conectado!</h1>
    <p>Sua conta foi vinculada com sucesso. Você será redirecionado automaticamente.</p>
    <p class="redirect-notice">Redirecionando...</p>
  </div>
  <script>
    // Use replace to avoid back-button issues
    setTimeout(function() {
      window.location.replace('${frontendUrl}/settings?google_auth=success');
    }, 1500);
  </script>
</body>
</html>`;

    return new Response(successHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Unexpected error in google-auth-callback:", error);
    return errorRedirect(frontendUrl, "internal_error");
  }
});
