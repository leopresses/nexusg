import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Dynamic CORS: allow any Lovable preview origin + production
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  
  const isAllowed = 
    origin.endsWith(".lovableproject.com") ||
    origin.endsWith(".lovable.app") ||
    origin === "https://nexusg.lovable.app";
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://nexusg.lovable.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

// AES-GCM decryption for tokens
async function decryptToken(ciphertext: string, key: string): Promise<string> {
  const decoder = new TextDecoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const combined = new Uint8Array(decodeBase64(ciphertext));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    encrypted
  );
  
  return decoder.decode(plaintext);
}

// AES-GCM encryption for tokens (for re-encrypting refreshed tokens)
async function encryptToken(plaintext: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const { encode: encodeBase64 } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
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

interface RefreshResult {
  accessToken: string;
  encryptedAccessToken: string;
  expiresAt: string;
}

async function refreshAccessToken(encryptedRefreshToken: string, encryptionKey: string): Promise<RefreshResult | null> {
  const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  let refreshToken: string;
  try {
    refreshToken = await decryptToken(encryptedRefreshToken, encryptionKey);
  } catch (error) {
    console.error("Failed to decrypt refresh token:", error);
    return null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Token refresh failed:", await response.text());
    return null;
  }

  const tokens = await response.json();
  const encryptedAccessToken = await encryptToken(tokens.access_token, encryptionKey);
  
  return {
    accessToken: tokens.access_token,
    encryptedAccessToken,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get user from JWT - REQUIRED for privacy
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[google-list-locations] Missing authorization header");
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        code: "NO_AUTH",
        message: "Sessão expirada. Faça login novamente."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    
    if (!encryptionKey) {
      console.error("[google-list-locations] TOKEN_ENCRYPTION_KEY not configured");
      return new Response(JSON.stringify({ 
        error: "Configuration error",
        code: "CONFIG_ERROR",
        message: "Configuração do servidor incompleta. Contate o suporte."
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Validate JWT and get user ID
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error("[google-list-locations] Invalid token:", userError?.message);
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        code: "INVALID_TOKEN",
        message: "Token inválido. Faça login novamente."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log(`[google-list-locations] Fetching locations for user: ${userId}`);

    // Get user's own Google connection ONLY (privacy enforcement)
    const { data: connection, error: connError } = await supabase
      .from("google_user_connections")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      console.log("[google-list-locations] No Google connection found for user");
      return new Response(JSON.stringify({ 
        error: "Google account not connected",
        code: "NOT_CONNECTED",
        message: "Você precisa conectar sua conta Google primeiro.",
        locations: []
      }), {
        status: 200, // Return 200 with empty array, not an error
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (connection.status !== "connected") {
      console.log("[google-list-locations] Connection status is not connected:", connection.status);
      return new Response(JSON.stringify({ 
        error: "Google connection is not active",
        code: "NOT_ACTIVE",
        message: "Sua conexão Google precisa ser reconectada.",
        locations: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!connection.access_token) {
      console.error("[google-list-locations] No access token in connection");
      return new Response(JSON.stringify({ 
        error: "No access token",
        code: "NO_TOKEN",
        message: "Token não encontrado. Reconecte sua conta Google.",
        locations: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt the access token
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token, encryptionKey);
    } catch (decryptError) {
      console.error("[google-list-locations] Failed to decrypt access token:", decryptError);
      await supabaseAdmin
        .from("google_user_connections")
        .update({ status: "error", error_message: "Token decryption failed" })
        .eq("user_id", userId);
      
      return new Response(JSON.stringify({ 
        error: "Token error",
        code: "DECRYPT_ERROR",
        message: "Erro no token. Reconecte sua conta Google.",
        locations: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token needs refresh
    const tokenExpires = new Date(connection.token_expires_at);
    if (tokenExpires <= new Date()) {
      console.log("[google-list-locations] Token expired, refreshing...");
      
      if (!connection.refresh_token) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Refresh token missing" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ 
          error: "Session expired",
          code: "NO_REFRESH_TOKEN",
          message: "Sessão expirada. Reconecte sua conta Google.",
          locations: []
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshResult = await refreshAccessToken(connection.refresh_token, encryptionKey);
      
      if (!refreshResult) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Token refresh failed" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ 
          error: "Token refresh failed",
          code: "REFRESH_FAILED",
          message: "Não foi possível atualizar o token. Reconecte sua conta Google.",
          locations: []
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update tokens in database
      await supabaseAdmin
        .from("google_user_connections")
        .update({
          access_token: refreshResult.encryptedAccessToken,
          token_expires_at: refreshResult.expiresAt,
          error_message: null,
        })
        .eq("user_id", userId);

      accessToken = refreshResult.accessToken;
      console.log("[google-list-locations] Token refreshed successfully");
    }

    // Fetch GBP accounts
    console.log("[google-list-locations] Fetching GBP accounts...");
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("[google-list-locations] Failed to fetch accounts:", accountsResponse.status, errorText);
      
      if (accountsResponse.status === 401 || accountsResponse.status === 403) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Access denied by Google" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ 
          error: "Access denied",
          code: "GOOGLE_ACCESS_DENIED",
          message: "Acesso negado pelo Google. Verifique suas permissões ou reconecte.",
          locations: []
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "Failed to fetch accounts",
        code: "ACCOUNTS_FETCH_FAILED",
        message: "Erro ao buscar contas do Google Business.",
        locations: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    console.log(`[google-list-locations] Found ${accounts.length} GBP accounts`);
    
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ 
        locations: [],
        message: "Nenhuma conta Google Business encontrada. Verifique se você tem acesso a algum Perfil de Empresa."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch locations for each account
    const allLocations: Array<{
      name: string;
      title: string;
      address: string;
      accountId: string;
      accountName: string;
    }> = [];

    for (const account of accounts) {
      console.log(`[google-list-locations] Fetching locations for account: ${account.name}`);
      
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];
        console.log(`[google-list-locations] Found ${locations.length} locations for ${account.name}`);
        
        for (const loc of locations) {
          const address = loc.storefrontAddress;
          const addressLines = [
            address?.addressLines?.join(", "),
            address?.locality,
            address?.administrativeArea,
            address?.postalCode,
          ].filter(Boolean).join(", ");

          // Extract account ID from account.name (e.g., "accounts/123456789" -> "123456789")
          const accountIdMatch = account.name.match(/accounts\/(\d+)/);
          const accountId = accountIdMatch ? accountIdMatch[1] : account.name;

          allLocations.push({
            name: loc.name, // Full location name for API calls (e.g., locations/12345)
            title: loc.title || "Sem nome",
            address: addressLines || "Endereço não disponível",
            accountId: accountId,
            accountName: account.accountName || account.name,
          });
        }
      } else {
        const errorText = await locationsResponse.text();
        console.warn(`[google-list-locations] Failed to fetch locations for ${account.name}:`, locationsResponse.status, errorText);
      }
    }

    console.log(`[google-list-locations] Total locations found: ${allLocations.length}`);

    return new Response(
      JSON.stringify({ 
        locations: allLocations,
        accountsCount: accounts.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[google-list-locations] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Operation failed",
        code: "INTERNAL_ERROR",
        message: "Erro interno. Tente novamente.",
        locations: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
