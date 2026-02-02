import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64, decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Dynamic CORS
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

async function fetchMetricsForLocation(
  accessToken: string,
  locationName: string,
  startDate: string,
  endDate: string
): Promise<{ views: number; calls: number; directions: number; websiteClicks: number } | null> {
  try {
    const [startYear, startMonth, startDay] = startDate.split("-");
    const [endYear, endMonth, endDay] = endDate.split("-");
    
    const response = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:getDailyMetricsTimeSeries?dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_MAPS&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetric=CALL_CLICKS&dailyMetric=WEBSITE_CLICKS&dailyMetric=BUSINESS_DIRECTION_REQUESTS&dailyRange.start_date.year=${startYear}&dailyRange.start_date.month=${parseInt(startMonth)}&dailyRange.start_date.day=${parseInt(startDay)}&dailyRange.end_date.year=${endYear}&dailyRange.end_date.month=${parseInt(endMonth)}&dailyRange.end_date.day=${parseInt(endDay)}`,
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
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (!encryptionKey) {
      console.error("[google-sync-metrics] TOKEN_ENCRYPTION_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authentication handling
    const authHeader = req.headers.get("Authorization");
    let specificUserId: string | null = null;
    let isServiceRoleAuth = false;
    let specificClientId: string | null = null;

    // Parse request body for optional client_id
    try {
      const body = await req.json();
      specificClientId = body.client_id || null;
    } catch {
      // No body or invalid JSON, proceed without client_id filter
    }

    if (!authHeader) {
      console.error("[google-sync-metrics] Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for service role key (cron jobs)
    if (authHeader === `Bearer ${serviceRoleKey}`) {
      console.log("[google-sync-metrics] Authenticated via service role key (cron job)");
      isServiceRoleAuth = true;
    } else if (authHeader.startsWith("Bearer ")) {
      // Validate user JWT
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !userData?.user) {
        console.error("[google-sync-metrics] Invalid token:", userError?.message);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      specificUserId = userData.user.id;
      console.log("[google-sync-metrics] Authenticated user:", specificUserId);
    } else {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get yesterday's date for metrics
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    console.log(`[google-sync-metrics] Syncing metrics for date: ${dateStr}`);

    // Get connected users (respecting privacy: only user's own data unless service role)
    let connectionQuery = supabaseAdmin
      .from("google_user_connections")
      .select("*")
      .eq("status", "connected");

    if (specificUserId && !isServiceRoleAuth) {
      connectionQuery = connectionQuery.eq("user_id", specificUserId);
    }

    const { data: connections, error: connError } = await connectionQuery;

    if (connError) {
      console.error("[google-sync-metrics] Error fetching connections:", connError);
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No connected users",
        synced: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSynced = 0;
    let totalErrors = 0;
    const syncResults: Array<{ clientId: string; status: string; error?: string }> = [];

    for (const connection of connections) {
      try {
        let accessToken: string;

        // Decrypt access token
        try {
          accessToken = await decryptToken(connection.access_token, encryptionKey);
        } catch (decryptError) {
          console.error(`[google-sync-metrics] Failed to decrypt access token for user ${connection.user_id}`);
          await supabaseAdmin
            .from("google_user_connections")
            .update({ status: "error", error_message: "Token decryption failed" })
            .eq("user_id", connection.user_id);
          totalErrors++;
          continue;
        }

        // Check if token needs refresh
        const tokenExpires = new Date(connection.token_expires_at);
        if (tokenExpires <= new Date()) {
          console.log(`[google-sync-metrics] Token expired for user ${connection.user_id}, refreshing...`);
          
          if (!connection.refresh_token) {
            await supabaseAdmin
              .from("google_user_connections")
              .update({ status: "error", error_message: "Refresh token missing" })
              .eq("user_id", connection.user_id);
            totalErrors++;
            continue;
          }

          const refreshResult = await refreshAccessToken(connection.refresh_token, encryptionKey);
          
          if (!refreshResult) {
            await supabaseAdmin
              .from("google_user_connections")
              .update({ status: "error", error_message: "Token refresh failed" })
              .eq("user_id", connection.user_id);
            totalErrors++;
            continue;
          }

          await supabaseAdmin
            .from("google_user_connections")
            .update({
              access_token: refreshResult.encryptedAccessToken,
              token_expires_at: refreshResult.expiresAt,
              error_message: null,
            })
            .eq("user_id", connection.user_id);

          accessToken = refreshResult.accessToken;
        }

        // Get all clients with google_connected=true for this user (new architecture)
        let clientsQuery = supabaseAdmin
          .from("clients")
          .select("id, gbp_location_name, gbp_account_id, gbp_location_id")
          .eq("user_id", connection.user_id)
          .eq("google_connected", true)
          .not("gbp_location_name", "is", null);

        // If specific client requested, filter to just that one
        if (specificClientId) {
          clientsQuery = clientsQuery.eq("id", specificClientId);
        }

        const { data: clients, error: clientsError } = await clientsQuery;

        if (clientsError) {
          console.error(`[google-sync-metrics] Error fetching clients for user ${connection.user_id}:`, clientsError);
          continue;
        }

        if (!clients || clients.length === 0) {
          console.log(`[google-sync-metrics] No connected clients for user ${connection.user_id}`);
          continue;
        }

        console.log(`[google-sync-metrics] Found ${clients.length} connected clients for user ${connection.user_id}`);

        for (const client of clients) {
          // Update sync status to "syncing"
          await supabaseAdmin
            .from("clients")
            .update({ gbp_sync_status: "syncing" })
            .eq("id", client.id);

          const metrics = await fetchMetricsForLocation(
            accessToken,
            client.gbp_location_name,
            dateStr,
            dateStr
          );

          if (metrics) {
            // Upsert metrics to google_metrics_daily
            const { error: upsertError } = await supabaseAdmin
              .from("google_metrics_daily")
              .upsert({
                user_id: connection.user_id,
                client_id: client.id,
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
              console.error(`[google-sync-metrics] Error saving metrics for client ${client.id}:`, upsertError);
              await supabaseAdmin
                .from("clients")
                .update({ 
                  gbp_sync_status: "error",
                  gbp_sync_error: "Failed to save metrics"
                })
                .eq("id", client.id);
              totalErrors++;
              syncResults.push({ clientId: client.id, status: "error", error: "Save failed" });
            } else {
              // Update client with success status
              await supabaseAdmin
                .from("clients")
                .update({ 
                  last_gbp_sync_at: new Date().toISOString(),
                  gbp_sync_status: "success",
                  gbp_sync_error: null
                })
                .eq("id", client.id);
              totalSynced++;
              syncResults.push({ clientId: client.id, status: "success" });
            }
          } else {
            await supabaseAdmin
              .from("clients")
              .update({ 
                gbp_sync_status: "error",
                gbp_sync_error: "Failed to fetch metrics from Google"
              })
              .eq("id", client.id);
            totalErrors++;
            syncResults.push({ clientId: client.id, status: "error", error: "Fetch failed" });
          }
        }

        // Update connection last sync time
        await supabaseAdmin
          .from("google_user_connections")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("user_id", connection.user_id);

      } catch (userError) {
        console.error(`[google-sync-metrics] Error processing user ${connection.user_id}:`, userError);
        totalErrors++;
      }
    }

    console.log(`[google-sync-metrics] Sync complete: ${totalSynced} synced, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: totalSynced, 
        errors: totalErrors,
        date: dateStr,
        results: syncResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[google-sync-metrics] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
