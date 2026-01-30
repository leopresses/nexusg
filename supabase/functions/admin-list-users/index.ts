import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS: allow any Lovable preview origin + production
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  
  // Allow lovableproject.com previews, lovable.app previews, and production domain
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

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client with the user's token to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseWithAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin
    const { data: isAdmin, error: roleError } = await supabaseWithAuth.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to fetch all profiles and roles
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error("Database operation failed");
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabaseAdmin.from("user_roles").select("*");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      throw new Error("Database operation failed");
    }

    // Fetch all auth users to get emails
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      // Continue without emails if this fails
    }

    // Create email lookup map
    const emailMap = new Map<string, string>();
    if (authData?.users) {
      for (const authUser of authData.users) {
        emailMap.set(authUser.id, authUser.email || "");
      }
    }

    // Combine profiles with roles and emails
    const usersWithRoles = (profiles || []).map((profile) => ({
      ...profile,
      email: emailMap.get(profile.user_id) || null,
      roles: (roles || []).filter((r) => r.user_id === profile.user_id).map((r) => r.role),
    }));

    return new Response(JSON.stringify({ users: usersWithRoles }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in admin-list-users:", error);
    return new Response(JSON.stringify({ error: "Operation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
