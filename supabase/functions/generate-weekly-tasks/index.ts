import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly task generation...");

    // Validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - missing authorization" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth to verify their identity
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error("Invalid token:", claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - invalid token" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const userId = claimsData.user.id;
    console.log("Authenticated user:", userId);

    // Verify the user has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseWithAuth
      .rpc("has_role", { _user_id: userId, _role: "admin" });

    if (roleError) {
      console.error("Error checking admin role:", roleError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Error verifying permissions" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!isAdmin) {
      console.error("User is not an admin:", userId);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - admin access required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Admin access verified for user:", userId);

    // Use the authenticated client to call the database function
    // This preserves auth.uid() context so the function operates on the admin's own clients
    // The function generate_weekly_tasks_for_all_clients is privacy-scoped to caller's clients
    const { error } = await supabaseWithAuth.rpc("generate_weekly_tasks_for_all_clients");

    if (error) {
      console.error("Error generating weekly tasks:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Weekly tasks generated successfully!");

    return new Response(
      JSON.stringify({ success: true, message: "Weekly tasks generated successfully" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
