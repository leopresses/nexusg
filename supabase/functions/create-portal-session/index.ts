import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
  };
}

const ALLOWED_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.lovable(project\.com|\.app)$/;

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    return (
      origin === "https://nexusg.lovable.app" ||
      ALLOWED_ORIGIN_PATTERN.test(origin)
    );
  } catch {
    return false;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Usuário não autenticado");

    const user = userData.user;

    const { data: customerData } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customerData) {
      throw new Error("Nenhuma conta Stripe encontrada. Assine um plano primeiro.");
    }

    const { returnUrl } = await req.json();
    const origin = req.headers.get("origin") || "https://nexusg.lovable.app";
    const defaultReturnUrl = `${origin}/pricing`;

    const finalReturnUrl = returnUrl && isAllowedRedirectUrl(returnUrl) ? returnUrl : defaultReturnUrl;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerData.stripe_customer_id,
      return_url: finalReturnUrl,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[create-portal-session] ERROR:", msg);
    return new Response(
      JSON.stringify({ error: "Ocorreu um erro ao acessar o portal de cobrança. Tente novamente ou contacte o suporte." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
