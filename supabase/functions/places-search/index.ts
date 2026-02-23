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

interface PlaceCandidate {
  place_id: string;
  name: string;
  formatted_address: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
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
    const name = typeof body.name === "string" ? body.name.slice(0, 200).replace(/[<>"'&;]/g, '').trim() : "";
    const address = typeof body.address === "string" ? body.address.slice(0, 500).replace(/[<>"'&;]/g, '').trim() : "";

    if (!name && !address) {
      return new Response(
        JSON.stringify({ error: "MISSING_PARAMS", message: "Informe o nome ou endereço do negócio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Google Places API key
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("[places-search] GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "SERVICE_UNAVAILABLE", 
          message: "Serviço temporariamente indisponível. Tente novamente mais tarde.",
          candidates: []
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query
    const searchQuery = [name, address].filter(Boolean).join(" ");
    console.log('[places-search] Search request received');

    // Call Google Places Text Search API
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    searchUrl.searchParams.set("query", searchQuery);
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("type", "establishment");
    searchUrl.searchParams.set("language", "pt-BR");

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[places-search] Google API error:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: "SEARCH_ERROR", 
          message: "Erro ao buscar lugares. Tente novamente.",
          candidates: []
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map results to candidates (max 5)
    const candidates: PlaceCandidate[] = (data.results || [])
      .slice(0, 5)
      .map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        types: place.types || [],
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        business_status: place.business_status,
      }));

    console.log('[places-search]', { event: 'search_complete', count: candidates.length });

    return new Response(
      JSON.stringify({ candidates }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[places-search] Error:", error);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: "Erro interno. Tente novamente.", candidates: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
