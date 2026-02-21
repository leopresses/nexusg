import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed =
    origin.endsWith(".lovableproject.com") ||
    origin.endsWith(".lovable.app") ||
    origin === "https://nexusg.lovable.app";
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://nexusg.lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url: string; // Google Maps URL
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  opening_hours?: {
    weekday_text: string[];
    open_now?: boolean;
  };
  photos?: { photo_reference: string }[];
  business_status?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Validate auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "NO_AUTH_HEADER", message: "Autenticação necessária." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "INVALID_TOKEN", message: "Token inválido. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const place_id = typeof body.place_id === "string" ? body.place_id.slice(0, 255).replace(/[<>"'&;]/g, '') : "";
    const client_id = typeof body.client_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.client_id) ? body.client_id : undefined;

    if (!place_id) {
      return new Response(
        JSON.stringify({ error: "MISSING_PLACE_ID", message: "Place ID é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Google Places API key
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("[places-details] GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "SERVICE_UNAVAILABLE", message: "Serviço temporariamente indisponível. Tente novamente mais tarde." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[places-details] Fetching details for user: ${user.id}`);

    // Call Google Places Details API
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", place_id);
    detailsUrl.searchParams.set("key", apiKey);
    detailsUrl.searchParams.set("language", "pt-BR");
    detailsUrl.searchParams.set(
      "fields",
      "place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,url,rating,user_ratings_total,types,opening_hours,photos,business_status"
    );

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("[places-details] Google API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: "PLACE_NOT_FOUND", 
          message: "Não foi possível obter os detalhes do lugar. Verifique o Place ID e tente novamente." 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize URLs to prevent javascript: and data: URI injection
    const sanitizeUrl = (url: string | undefined): string | undefined => {
      if (!url) return undefined;
      const lower = url.toLowerCase().trim();
      if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
        console.warn("[places-details] Rejected unsafe URL scheme");
        return undefined;
      }
      return url;
    };

    // Sanitize and validate string fields
    const sanitizeStr = (val: unknown, maxLen = 1000): string | undefined => {
      if (typeof val !== "string") return undefined;
      return val.slice(0, maxLen);
    };

    const result = data.result;
    const placeDetails: PlaceDetails = {
      place_id: sanitizeStr(result.place_id, 255) ?? "",
      name: sanitizeStr(result.name, 500) ?? "",
      formatted_address: sanitizeStr(result.formatted_address, 1000) ?? "",
      formatted_phone_number: sanitizeStr(result.formatted_phone_number, 50),
      international_phone_number: sanitizeStr(result.international_phone_number, 50),
      website: sanitizeUrl(result.website),
      url: sanitizeUrl(result.url) ?? "",
      rating: typeof result.rating === "number" ? Math.max(0, Math.min(5, result.rating)) : undefined,
      user_ratings_total: typeof result.user_ratings_total === "number" ? Math.max(0, result.user_ratings_total) : undefined,
      types: Array.isArray(result.types) ? result.types.filter((t: unknown) => typeof t === "string").slice(0, 20) : [],
      opening_hours: result.opening_hours && Array.isArray(result.opening_hours.weekday_text)
        ? { weekday_text: result.opening_hours.weekday_text.slice(0, 7), open_now: result.opening_hours.open_now }
        : undefined,
      photos: result.photos?.slice(0, 3).map((p: any) => ({ photo_reference: p.photo_reference })),
      business_status: sanitizeStr(result.business_status, 50),
    };

    // If client_id provided, update the client with place data
    if (client_id) {
      console.log(`[places-details] Updating client ${client_id} with place data`);
      
      // Verify client belongs to user via RLS (only owner can read)
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", client_id)
        .single();

      if (clientError || !clientData) {
        return new Response(
          JSON.stringify({ error: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update client with place data
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          place_id: placeDetails.place_id,
          google_maps_url: placeDetails.url,
          place_snapshot: placeDetails,
          place_last_sync_at: new Date().toISOString(),
        })
        .eq("id", client_id);

      if (updateError) {
        console.error("[places-details] Error updating client:", updateError);
        return new Response(
          JSON.stringify({ error: "UPDATE_ERROR", message: "Erro ao salvar dados do Place no cliente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[places-details] Client ${client_id} updated successfully`);
    }

    return new Response(
      JSON.stringify({ details: placeDetails }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[places-details] Error:", error);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
