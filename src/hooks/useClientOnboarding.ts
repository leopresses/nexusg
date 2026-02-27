import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export interface OnboardingSteps {
  google_connected: boolean;
  client_info_completed: boolean;
  audit_ready: boolean;
  audit_done: boolean;
  plan_generated: boolean;
  alerts_enabled: boolean;
  review_started: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingSteps;
  completed: number;
  total: number;
  percent: number;
}

const STEP_KEYS: (keyof OnboardingSteps)[] = [
  "google_connected",
  "client_info_completed",
  "audit_ready",
  "audit_done",
  "plan_generated",
  "alerts_enabled",
  "review_started",
];

export function useClientOnboarding(clientId: string | undefined) {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [savedSteps, setSavedSteps] = useState<Partial<OnboardingSteps>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!clientId || !user) return;
    setIsLoading(true);
    try {
      const [clientRes, onboardingRes, reviewsRes, tasksRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
        supabase.from("client_onboarding" as any).select("steps").eq("client_id", clientId).maybeSingle(),
        supabase.from("client_reviews").select("id", { count: "exact", head: true }).eq("client_id", clientId),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("is_custom", true),
      ]);

      setClient(clientRes.data);
      setSavedSteps((onboardingRes.data as any)?.steps || {});
      setReviewCount(reviewsRes.count || 0);
      setTaskCount(tasksRes.count || 0);
    } catch (err) {
      console.error("Error fetching onboarding data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const computeProgress = useCallback((): OnboardingProgress => {
    if (!client) {
      const emptySteps: OnboardingSteps = {
        google_connected: false,
        client_info_completed: false,
        audit_ready: false,
        audit_done: false,
        plan_generated: false,
        alerts_enabled: false,
        review_started: false,
      };
      return { steps: emptySteps, completed: 0, total: 7, percent: 0 };
    }

    const hasPlaceId = !!(client as any).place_id;
    const hasSnapshot = !!(client as any).place_snapshot && Object.keys((client as any).place_snapshot || {}).length > 0;

    // Auto-detect fields filled (address counts as info)
    const infoFields = [client.address, (client as any).google_maps_url].filter(Boolean).length;
    const clientInfoCompleted = !!client.name && infoFields >= 1;

    const steps: OnboardingSteps = {
      google_connected: hasPlaceId,
      client_info_completed: clientInfoCompleted,
      audit_ready: hasSnapshot || clientInfoCompleted,
      audit_done: !!savedSteps.audit_done,
      plan_generated: !!savedSteps.plan_generated || taskCount > 0,
      alerts_enabled: !!savedSteps.alerts_enabled,
      review_started: !!savedSteps.review_started || reviewCount > 0,
    };

    const completed = STEP_KEYS.filter((k) => steps[k]).length;
    return { steps, completed, total: 7, percent: Math.round((completed / 7) * 100) };
  }, [client, savedSteps, reviewCount, taskCount]);

  const updateSteps = useCallback(
    async (partialSteps: Partial<OnboardingSteps>) => {
      if (!clientId || !user) return;
      const newSteps = { ...savedSteps, ...partialSteps };

      const { data: existing } = await supabase
        .from("client_onboarding" as any)
        .select("id")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("client_onboarding" as any)
          .update({ steps: newSteps, updated_at: new Date().toISOString() } as any)
          .eq("client_id", clientId);
      } else {
        await supabase.from("client_onboarding" as any).insert({
          user_id: user.id,
          client_id: clientId,
          steps: newSteps,
        } as any);
      }

      setSavedSteps(newSteps);
    },
    [clientId, user, savedSteps],
  );

  return {
    client,
    isLoading,
    computeProgress,
    updateSteps,
    refetch: fetchData,
  };
}
