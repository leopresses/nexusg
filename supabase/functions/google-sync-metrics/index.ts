import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RefreshResult {
  accessToken: string;
  expiresAt: string;
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshResult | null> {
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

async function fetchMetricsForLocation(
  accessToken: string,
  locationName: string,
  startDate: string,
  endDate: string
): Promise<{ views: number; calls: number; directions: number; websiteClicks: number } | null> {
  try {
    // Use the Performance API for metrics
    const response = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:getDailyMetricsTimeSeries?dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_MAPS&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetric=CALL_CLICKS&dailyMetric=WEBSITE_CLICKS&dailyMetric=BUSINESS_DIRECTION_REQUESTS&dailyRange.start_date.year=${startDate.split("-")[0]}&dailyRange.start_date.month=${startDate.split("-")[1]}&dailyRange.start_date.day=${startDate.split("-")[2]}&dailyRange.end_date.year=${endDate.split("-")[0]}&dailyRange.end_date.month=${endDate.split("-")[1]}&dailyRange.end_date.day=${endDate.split("-")[2]}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      console.error(`Metrics fetch failed for ${locationName}:`, await response.text());
      return null;
    }

    const data = await response.json();
    const timeSeries = data.timeSeries || [];

    let views = 0;
    let calls = 0;
    let directions = 0;
    let websiteClicks = 0;

    for (const series of timeSeries) {
      const metric = series.dailyMetric;
      const values = series.timeSeries?.datedValues || [];
      
      for (const dv of values) {
        const value = parseInt(dv.value || "0", 10);
        
        if (metric === "BUSINESS_IMPRESSIONS_DESKTOP_MAPS" || metric === "BUSINESS_IMPRESSIONS_MOBILE_MAPS") {
          views += value;
        } else if (metric === "CALL_CLICKS") {
          calls += value;
        } else if (metric === "BUSINESS_DIRECTION_REQUESTS") {
          directions += value;
        } else if (metric === "WEBSITE_CLICKS") {
          websiteClicks += value;
        }
      }
    }

    return { views, calls, directions, websiteClicks };
  } catch (error) {
    console.error(`Error fetching metrics for ${locationName}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check for auth header (optional for cron, required for manual trigger)
    const authHeader = req.headers.get("Authorization");
    let specificUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      
      if (claimsData?.claims?.sub) {
        specificUserId = claimsData.claims.sub;
      }
    }

    // Get yesterday's date for metrics
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    const [year, month, day] = dateStr.split("-");

    console.log(`Syncing metrics for date: ${dateStr}`);

    // Get all connected users (or specific user)
    let connectionQuery = supabaseAdmin
      .from("google_user_connections")
      .select("*")
      .eq("status", "connected");

    if (specificUserId) {
      connectionQuery = connectionQuery.eq("user_id", specificUserId);
    }

    const { data: connections, error: connError } = await connectionQuery;

    if (connError) {
      console.error("Error fetching connections:", connError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ message: "No connected users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSynced = 0;
    let totalErrors = 0;

    for (const connection of connections) {
      try {
        let accessToken = connection.access_token;

        // Check if token needs refresh
        const tokenExpires = new Date(connection.token_expires_at);
        if (tokenExpires <= new Date()) {
          if (!connection.refresh_token) {
            await supabaseAdmin
              .from("google_user_connections")
              .update({ status: "error", error_message: "Refresh token missing" })
              .eq("user_id", connection.user_id);
            continue;
          }

          const refreshResult = await refreshAccessToken(connection.refresh_token);
          
          if (!refreshResult) {
            await supabaseAdmin
              .from("google_user_connections")
              .update({ status: "error", error_message: "Token refresh failed" })
              .eq("user_id", connection.user_id);
            continue;
          }

          await supabaseAdmin
            .from("google_user_connections")
            .update({
              access_token: refreshResult.accessToken,
              token_expires_at: refreshResult.expiresAt,
              error_message: null,
            })
            .eq("user_id", connection.user_id);

          accessToken = refreshResult.accessToken;
        }

        // Get all active locations for this user
        const { data: locations } = await supabaseAdmin
          .from("client_google_locations")
          .select("*")
          .eq("user_id", connection.user_id)
          .eq("is_active", true);

        if (!locations || locations.length === 0) {
          continue;
        }

        for (const location of locations) {
          const metrics = await fetchMetricsForLocation(
            accessToken!,
            location.location_name,
            dateStr,
            dateStr
          );

          if (metrics) {
            // Upsert metrics
            const { error: upsertError } = await supabaseAdmin
              .from("google_metrics_daily")
              .upsert({
                user_id: connection.user_id,
                client_id: location.client_id,
                date: dateStr,
                views: metrics.views,
                calls: metrics.calls,
                directions: metrics.directions,
                website_clicks: metrics.websiteClicks,
                messages: 0,
              }, {
                onConflict: "user_id,client_id,date",
              });

            if (upsertError) {
              console.error(`Error saving metrics for ${location.client_id}:`, upsertError);
              totalErrors++;
            } else {
              totalSynced++;
            }
          } else {
            totalErrors++;
          }
        }

        // Update last sync time
        await supabaseAdmin
          .from("google_user_connections")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("user_id", connection.user_id);

      } catch (userError) {
        console.error(`Error processing user ${connection.user_id}:`, userError);
        totalErrors++;
      }
    }

    console.log(`Sync complete: ${totalSynced} synced, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: totalSynced, 
        errors: totalErrors,
        date: dateStr,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in google-sync-metrics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
