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
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current connection to revoke token
    const { data: connection } = await supabase
      .from("google_user_connections")
      .select("access_token")
      .eq("user_id", userId)
      .single();

    // Try to revoke the token at Google (decrypt first)
    if (connection?.access_token) {
      try {
        const decryptedToken = await decryptToken(connection.access_token, encryptionKey);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${decryptedToken}`, {
          method: "POST",
        });
        console.log("Token revoked at Google");
      } catch (e) {
        console.log("Token revocation failed (might be already expired or decryption error):", e);
      }
    }

    // Update connection status
    const { error: updateError } = await supabase
      .from("google_user_connections")
      .update({
        status: "disconnected",
        access_token: null,
        refresh_token: null,
        error_message: null,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating connection:", updateError);
      return new Response(JSON.stringify({ error: "Disconnect failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate all client locations
    const { error: locationsError } = await supabase
      .from("client_google_locations")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (locationsError) {
      console.warn("Error deactivating locations:", locationsError);
    }

    console.log("Google disconnected for user:", userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in google-auth-disconnect:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
