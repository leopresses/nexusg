import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StripeSubscription {
  id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_end: string | null;
  plan: string;
}

export function useBilling() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("stripe_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data as StripeSubscription | null);
    } catch (err) {
      console.error("Erro ao buscar assinatura:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createCheckout = async (plan: string) => {
    setIsCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Erro ao criar checkout:", err);
      throw err;
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const openPortal = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { returnUrl: `${window.location.origin}/pricing` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Erro ao abrir portal:", err);
      throw err;
    } finally {
      setIsPortalLoading(false);
    }
  };

  const isSubscriptionActive =
    subscription?.status === "active" || subscription?.status === "trialing";

  const currentPlan = profile?.plan || "starter";

  return {
    subscription,
    isLoading,
    isCheckoutLoading,
    isPortalLoading,
    isSubscriptionActive,
    currentPlan,
    createCheckout,
    openPortal,
    refreshSubscription: fetchSubscription,
  };
}
