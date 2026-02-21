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
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
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
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const userId = claimsData.user.id;
    console.log("[generate-weekly-tasks] User authenticated");

    // Verify the user has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseWithAuth
      .rpc("has_role", { _user_id: userId, _role: "admin" });

    if (roleError) {
      console.error("[generate-weekly-tasks] Role check failed");
      return new Response(
        JSON.stringify({ success: false, error: "Permission verification failed" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!isAdmin) {
      console.error("[generate-weekly-tasks] Non-admin access attempt");
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("[generate-weekly-tasks] Admin access verified");

    // Use the authenticated client to call the database function
    // This preserves auth.uid() context so the function operates on the admin's own clients
    // The function generate_weekly_tasks_for_all_clients is privacy-scoped to caller's clients
    const { error } = await supabaseWithAuth.rpc("generate_weekly_tasks_for_all_clients");

    if (error) {
      console.error("Error generating weekly tasks:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Task generation failed" }),
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
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Operation failed" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
