import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeAlerts, AlertItem } from "@/lib/alerts";

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const today = new Date();
      const d28ago = new Date(today);
      d28ago.setDate(d28ago.getDate() - 28);
      const d20ago = new Date(today);
      d20ago.setDate(d20ago.getDate() - 20);

      const [clientsRes, tasksRes, metricsRes] = await Promise.all([
        supabase.from("clients").select("id, name").eq("is_active", true),
        supabase
          .from("tasks")
          .select("client_id, status, week_start, frequency")
          .gte("week_start", d28ago.toISOString().split("T")[0]),
        supabase
          .from("google_metrics_daily")
          .select("client_id, date, views, calls, directions, website_clicks, messages")
          .gte("date", d20ago.toISOString().split("T")[0]),
      ]);

      const clients = clientsRes.data || [];
      const tasks = tasksRes.data || [];
      const metrics = metricsRes.data || [];

      const computed = computeAlerts({ clients, metrics, tasks });
      setAlerts(computed);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { alerts, isLoading, refetch: fetchAlerts };
}
