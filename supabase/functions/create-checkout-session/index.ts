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
    "Access-Control-Allow-Credentials": "true",
  };
}

const PRICE_MAP: Record<string, string> = {
  tatico: "price_1T6Y7V1wSF4SiKrjrvUG1SF6",
  pro: "price_1T6Y7n1wSF4SiKrjrLI3SoRS",
  elite: "price_1T6Y831wSF4SiKrjGT9VHvgF",
  agency: "price_1T6Y8H1wSF4SiKrjVYk1kAao",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
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
    if (userError || !userData.user?.email) throw new Error("Usuário não autenticado");

    const user = userData.user;
    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan || !PRICE_MAP[plan]) {
      throw new Error(`Plano inválido: ${plan}`);
    }

    // Validate redirect URLs against allowed origins
    const ALLOWED_ORIGINS = ["https://nexusg.lovable.app"];
    function isAllowedUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        return ALLOWED_ORIGINS.some((o) => url.startsWith(o)) ||
          parsed.hostname.endsWith(".lovableproject.com") ||
          parsed.hostname.endsWith(".lovable.app");
      } catch {
        return false;
      }
    }
    if (successUrl && !isAllowedUrl(successUrl)) {
      throw new Error("Invalid redirect URL");
    }
    if (cancelUrl && !isAllowedUrl(cancelUrl)) {
      throw new Error("Invalid redirect URL");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    let customerId: string | undefined;

    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
      }

      // Save to stripe_customers table
      await supabase.from("stripe_customers").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    const origin = req.headers.get("origin") || "https://nexusg.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: PRICE_MAP[plan], quantity: 1 }],
      mode: "subscription",
      success_url: successUrl || `${origin}/pricing?success=true`,
      cancel_url: cancelUrl || `${origin}/pricing?canceled=true`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-checkout-session] ERROR:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Operação falhou. Tente novamente." }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
