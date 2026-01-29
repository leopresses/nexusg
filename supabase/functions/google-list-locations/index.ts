import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string } | null> {
  const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

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
  return {
    accessToken: tokens.access_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  };
}

serve(async (req) => {
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
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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

    let accessToken = connection.access_token;

    // Check if token needs refresh
    const tokenExpires = new Date(connection.token_expires_at);
    if (tokenExpires <= new Date()) {
      console.log("Token expired, refreshing...");
      
      if (!connection.refresh_token) {
        // Mark as error if no refresh token
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Refresh token missing" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ error: "Refresh token missing, please reconnect" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshResult = await refreshAccessToken(connection.refresh_token);
      
      if (!refreshResult) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Token refresh failed" })
          .eq("user_id", userId);
        
        return new Response(JSON.stringify({ error: "Token refresh failed, please reconnect" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update tokens in database
      await supabaseAdmin
        .from("google_user_connections")
        .update({
          access_token: refreshResult.accessToken,
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
      const errorText = await accountsResponse.text();
      console.error("Failed to fetch accounts:", errorText);
      
      if (accountsResponse.status === 401 || accountsResponse.status === 403) {
        await supabaseAdmin
          .from("google_user_connections")
          .update({ status: "error", error_message: "Access denied by Google" })
          .eq("user_id", userId);
      }
      
      return new Response(JSON.stringify({ error: "Failed to fetch Google Business accounts" }), {
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
