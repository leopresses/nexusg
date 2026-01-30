// supabase/functions/admin-list-users/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  plan: string | null;
  clients_limit: number | null;
  is_active: boolean | null;
};

type RoleRow = { user_id: string; role: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client do usuário (para validar se é admin)
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: roleCheck, error: roleErr } = await supabaseUser.rpc("has_role", { _role: "admin" });
    if (roleErr) throw roleErr;

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden (not admin)" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client service-role (bypass RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Lista usuários do Auth (para pegar email)
    // Paginação simples (geralmente você terá poucos no início)
    const users: Array<{ id: string; email: string | null; user_metadata?: any }> = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const batch = data?.users ?? [];
      for (const u of batch) users.push({ id: u.id, email: u.email ?? null, user_metadata: u.user_metadata });

      if (batch.length < perPage) break;
      page += 1;
    }

    const userIds = users.map((u) => u.id);

    // 2) Busca perfis
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, plan, clients_limit, is_active")
      .in("user_id", userIds);

    if (profErr) throw profErr;

    const profileMap = new Map<string, ProfileRow>();
    for (const p of (profiles ?? []) as ProfileRow[]) {
      profileMap.set(p.user_id, p);
    }

    // 3) Busca roles
    const { data: rolesData, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    if (rolesErr) throw rolesErr;

    const rolesMap = new Map<string, string[]>();
    for (const r of (rolesData ?? []) as RoleRow[]) {
      const arr = rolesMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesMap.set(r.user_id, arr);
    }

    // 4) Monta resposta no formato esperado pelo AdminUsersPlans.tsx
    const merged = users.map((u) => {
      const p = profileMap.get(u.id);

      const fallbackName =
        (u.user_metadata?.full_name as string | undefined) || (u.email ? u.email.split("@")[0] : "Usuário");

      return {
        user_id: u.id,
        email: u.email,
        full_name: p?.full_name ?? fallbackName,
        plan: p?.plan ?? "starter",
        clients_limit: p?.clients_limit ?? 1,
        status: (p?.is_active ?? true) ? "active" : "inactive",
        roles: rolesMap.get(u.id) ?? [],
      };
    });

    return new Response(JSON.stringify({ users: merged }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("admin-list-users error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
