import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64, decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Allowed origins for CORS
const allowedOrigins = [
  "https://nexusg.lovable.app",
  "https://id-preview--a37866c6-77e2-4449-8805-ec48acb8f5b5.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
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

  // Decrypt the refresh token
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
  
  // Encrypt the new access token
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
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (!encryptionKey) {
      console.error("TOKEN_ENCRYPTION_KEY not configured");
      return new Response(JSON.stringify({ error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get user's Google connection
    const { data: connection, error: connError } = await supabase
      .from("google_user_connections")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: "Google account not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (connection.status !== "connected") {
      return new Response(JSON.stringify({ error: "Google connection is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt the access token
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token, encryptionKey);
    } catch (decryptError) {
      console.error("Failed to decrypt access token:", decryptError);
      await supabaseAdmin
        .from("google_user_connections")
        .update({ status: "error", error_message: "Token error" })
        .eq("user_id", userId);
      
      return new Response(JSON.stringify({ error: "Please reconnect your Google account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token needs refresh
    const tokenExpires = new Date(connection.token_expires_at);
    if (tokenExpires <= new Date()) {
      console.log("Token expired, refreshing...");
      
      if (!connection.refresh_token) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Session expired" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ error: "Please reconnect your Google account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshResult = await refreshAccessToken(connection.refresh_token, encryptionKey);
      
      if (!refreshResult) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Authentication expired" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ error: "Please reconnect your Google account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update tokens in database (encrypted)
      await supabaseAdmin
        .from("google_user_connections")
        .update({
          access_token: refreshResult.encryptedAccessToken,
          token_expires_at: refreshResult.expiresAt,
          error_message: null,
        })
        .eq("user_id", userId);

      accessToken = refreshResult.accessToken;
    }

    // Get accounts first
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!accountsResponse.ok) {
      console.error("Failed to fetch accounts:", await accountsResponse.text());
      
      if (accountsResponse.status === 401 || accountsResponse.status === 403) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Access denied" })
          .eq("user_id", userId);
      }
      
      return new Response(JSON.stringify({ error: "Failed to fetch business accounts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ locations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch locations for each account
    const allLocations: Array<{
      name: string;
      title: string;
      address: string;
      accountName: string;
    }> = [];

    for (const account of accounts) {
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];
        
        for (const loc of locations) {
          const address = loc.storefrontAddress;
          const addressLines = [
            address?.addressLines?.join(", "),
            address?.locality,
            address?.administrativeArea,
            address?.postalCode,
          ].filter(Boolean).join(", ");

          allLocations.push({
            name: loc.name,
            title: loc.title || "Sem nome",
            address: addressLines || "Endereço não disponível",
            accountName: account.accountName || account.name,
          });
        }
      } else {
        console.warn(`Failed to fetch locations for ${account.name}`);
      }
    }

    console.log(`Found ${allLocations.length} locations for user ${userId}`);

    return new Response(
      JSON.stringify({ locations: allLocations }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in google-list-locations:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
