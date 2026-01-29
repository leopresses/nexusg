import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GoogleMetric {
  id: string;
  user_id: string;
  client_id: string;
  date: string;
  views: number;
  calls: number;
  directions: number;
  website_clicks: number;
  messages: number;
  created_at: string;
}

export interface AggregatedMetrics {
  views: number;
  calls: number;
  directions: number;
  websiteClicks: number;
  messages: number;
}

export function useGoogleMetrics(clientId?: string) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<GoogleMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = useCallback(
    async (startDate?: Date, endDate?: Date) => {
      if (!user) return [];

      setIsLoading(true);
      try {
        let query = supabase
          .from("google_metrics_daily")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (clientId) {
          query = query.eq("client_id", clientId);
        }

        if (startDate) {
          query = query.gte("date", startDate.toISOString().split("T")[0]);
        }

        if (endDate) {
          query = query.lte("date", endDate.toISOString().split("T")[0]);
        }

        const { data, error } = await query;

        if (error) throw error;

        setMetrics((data as GoogleMetric[]) || []);
        return (data as GoogleMetric[]) || [];
      } catch (error) {
        console.error("Error fetching metrics:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [user, clientId]
  );

  useEffect(() => {
    if (clientId) {
      fetchMetrics();
    }
  }, [clientId, fetchMetrics]);

  const getAggregatedMetrics = useCallback(
    (startDate?: Date, endDate?: Date): AggregatedMetrics => {
      let filteredMetrics = metrics;

      if (startDate) {
        filteredMetrics = filteredMetrics.filter(
          (m) => new Date(m.date) >= startDate
        );
      }

      if (endDate) {
        filteredMetrics = filteredMetrics.filter(
          (m) => new Date(m.date) <= endDate
        );
      }

      return filteredMetrics.reduce(
        (acc, m) => ({
          views: acc.views + m.views,
          calls: acc.calls + m.calls,
          directions: acc.directions + m.directions,
          websiteClicks: acc.websiteClicks + m.website_clicks,
          messages: acc.messages + m.messages,
        }),
        { views: 0, calls: 0, directions: 0, websiteClicks: 0, messages: 0 }
      );
    },
    [metrics]
  );

  const getMetricsByClientForPeriod = useCallback(
    async (
      clientIds: string[],
      startDate: Date,
      endDate: Date
    ): Promise<Map<string, AggregatedMetrics>> => {
      if (!user || clientIds.length === 0) return new Map();

      try {
        const { data, error } = await supabase
          .from("google_metrics_daily")
          .select("*")
          .eq("user_id", user.id)
          .in("client_id", clientIds)
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);

        if (error) throw error;

        const metricsMap = new Map<string, AggregatedMetrics>();

        for (const clientId of clientIds) {
          const clientMetrics = (data as GoogleMetric[]).filter(
            (m) => m.client_id === clientId
          );

          metricsMap.set(
            clientId,
            clientMetrics.reduce(
              (acc, m) => ({
                views: acc.views + m.views,
                calls: acc.calls + m.calls,
                directions: acc.directions + m.directions,
                websiteClicks: acc.websiteClicks + m.website_clicks,
                messages: acc.messages + m.messages,
              }),
              { views: 0, calls: 0, directions: 0, websiteClicks: 0, messages: 0 }
            )
          );
        }

        return metricsMap;
      } catch (error) {
        console.error("Error fetching metrics by client:", error);
        return new Map();
      }
    },
    [user]
  );

  return {
    metrics,
    isLoading,
    fetchMetrics,
    getAggregatedMetrics,
    getMetricsByClientForPeriod,
  };
}
