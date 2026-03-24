import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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

    let returnUrl: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.returnUrl === "string") {
        returnUrl = body.returnUrl;
      }
    } catch {
      // Body is optional
    }

    const origin = req.headers.get("origin") || "https://nexusg.lovable.app";

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const persistCustomerId = async (customerId: string) => {
      const { data: updatedRows, error: updateError } = await supabase
        .from("stripe_customers")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id)
        .select("user_id");

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from("stripe_customers").insert({
          user_id: user.id,
          stripe_customer_id: customerId,
        });

        if (insertError) throw insertError;
      }
    };

    let stripeCustomerId = customerData?.stripe_customer_id ?? null;

    // Validate existing customer id; if stale, recover by email or create a new customer.
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        const isMissingCustomer =
          error instanceof Error && /No such customer/i.test(error.message);
        if (!isMissingCustomer) throw error;
        stripeCustomerId = null;
      }
    }

    if (!stripeCustomerId && user.email) {
      const byEmail = await stripe.customers.list({ email: user.email, limit: 1 });
      if (byEmail.data.length > 0) {
        stripeCustomerId = byEmail.data[0].id;
      }
    }

    if (!stripeCustomerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      stripeCustomerId = newCustomer.id;
    }

    await persistCustomerId(stripeCustomerId);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${origin}/pricing`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const internalMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[create-portal-session] ERROR:", internalMsg);
    return new Response(JSON.stringify({ error: "Ocorreu um erro ao acessar o portal de cobrança. Tente novamente ou contacte o suporte." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
