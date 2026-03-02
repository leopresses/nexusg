import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1T6Y7V1wSF4SiKrjrvUG1SF6": "tatico",
  "price_1T6Y7n1wSF4SiKrjrLI3SoRS": "pro",
  "price_1T6Y831wSF4SiKrjGT9VHvgF": "elite",
  "price_1T6Y8H1wSF4SiKrjVYk1kAao": "agency",
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  tatico: 3,
  pro: 6,
  elite: 10,
  agency: 999999,
};

const log = (step: string, details?: unknown) => {
  console.log(`[stripe-webhook] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  // Webhooks are POST only
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("No stripe-signature header");

    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    log("Event received", { type: event.type, id: event.id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const userId = session.metadata?.supabase_user_id;
          const customerId = session.customer as string;
          if (userId) {
            // Ensure stripe_customers record
            await supabase.from("stripe_customers").upsert({
              user_id: userId,
              stripe_customer_id: customerId,
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || "starter";
        const status = subscription.status;

        log("Subscription update", { customerId, priceId, plan, status });

        // Find user_id from stripe_customers
        const { data: customerRow } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!customerRow) {
          log("Customer not found in DB, skipping", { customerId });
          break;
        }

        const userId = customerRow.user_id;

        // Upsert subscription record
        await supabase.from("stripe_subscriptions").upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );

        // Sync profile plan based on status
        const isActive = ["active", "trialing"].includes(status);
        const effectivePlan = isActive ? plan : "starter";
        const effectiveLimit = PLAN_LIMITS[effectivePlan] ?? 1;

        // Use admin_update_user_plan RPC to bypass the self-update trigger
        await supabase.rpc("admin_update_user_plan", {
          _user_id: userId,
          _plan: effectivePlan,
          _clients_limit: effectiveLimit,
        });

        log("Profile updated", { userId, effectivePlan, effectiveLimit });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: customerRow } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (customerRow) {
          // Update subscription status
          await supabase
            .from("stripe_subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscription.id);

          // Downgrade to starter
          await supabase.rpc("admin_update_user_plan", {
            _user_id: customerRow.user_id,
            _plan: "starter",
            _clients_limit: 1,
          });

          log("Subscription canceled, downgraded to starter", { userId: customerRow.user_id });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        log("Payment failed", { customerId, invoiceId: invoice.id });
        // Stripe will handle retry logic; on final failure subscription goes past_due/canceled
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[stripe-webhook] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
