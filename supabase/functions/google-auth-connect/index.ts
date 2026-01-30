import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        code: "NO_AUTH_HEADER",
        message: "Sessão expirada. Faça login novamente."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Token validation failed:", claimsError?.message);
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        code: "INVALID_TOKEN",
        message: "Token inválido ou expirado. Faça login novamente."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      console.error("No user ID in token claims");
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        code: "NO_USER_ID",
        message: "Usuário não identificado. Faça login novamente."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    let redirectUrl;
    try {
      const body = await req.json();
      redirectUrl = body.redirectUrl;
    } catch {
      redirectUrl = "https://nexusg.lovable.app";
    }
    
    // Build Google OAuth URL
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
    if (!googleClientId) {
      console.error("GOOGLE_CLIENT_ID not configured");
      return new Response(JSON.stringify({ 
        error: "Configuration error",
        code: "MISSING_CLIENT_ID",
        message: "Configuração do Google não encontrada. Contate o suporte."
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate state with user ID for security
    const state = btoa(JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    }));

    // Callback URL points to our edge function
    const callbackUrl = `${supabaseUrl}/functions/v1/google-auth-callback`;

    // Required scopes for Business Profile API
    const scopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/business.manage",
    ].join(" ");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", googleClientId);
    googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", scopes);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    console.log("Generated OAuth URL for user:", userId, "callback:", callbackUrl);

    return new Response(
      JSON.stringify({ 
        authUrl: googleAuthUrl.toString(),
        state,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in google-auth-connect:", error);
    return new Response(
      JSON.stringify({ 
        error: "Operation failed",
        code: "INTERNAL_ERROR",
        message: "Erro interno. Tente novamente ou contate o suporte."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
