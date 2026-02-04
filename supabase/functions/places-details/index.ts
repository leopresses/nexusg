import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    return new Response("ok", { headers: corsHeaders });
  }

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

    // Parse request body
    const { place_id, client_id } = await req.json();

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
        JSON.stringify({ error: "CONFIG_ERROR", message: "API do Google Places não configurada." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[places-details] Fetching details for place_id: ${place_id}, user: ${user.id}`);

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
          error: "GOOGLE_API_ERROR", 
          message: `Erro na API do Google: ${data.error_message || data.status}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data.result;
    const placeDetails: PlaceDetails = {
      place_id: result.place_id,
      name: result.name,
      formatted_address: result.formatted_address,
      formatted_phone_number: result.formatted_phone_number,
      international_phone_number: result.international_phone_number,
      website: result.website,
      url: result.url,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      types: result.types || [],
      opening_hours: result.opening_hours,
      photos: result.photos?.slice(0, 3).map((p: any) => ({ photo_reference: p.photo_reference })),
      business_status: result.business_status,
    };

    // If client_id provided, update the client with place data
    if (client_id) {
      console.log(`[places-details] Updating client ${client_id} with place data`);
      
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      
      // Verify client belongs to user
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, user_id")
        .eq("id", client_id)
        .single();

      if (clientError || !clientData) {
        return new Response(
          JSON.stringify({ error: "CLIENT_NOT_FOUND", message: "Cliente não encontrado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (clientData.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "UNAUTHORIZED", message: "Sem permissão para atualizar este cliente." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
