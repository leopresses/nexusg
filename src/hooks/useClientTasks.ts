import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface ClientTaskStats {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
}

export function useClientTasks(clientIds: string[] = []) {
  const [taskStats, setTaskStats] = useState<Record<string, ClientTaskStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientIds.length > 0) {
      fetchTaskStats();
    } else {
      setIsLoading(false);
      setTaskStats({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientIds.join(",")]);

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split("T")[0];
  };

  const fetchTaskStats = async () => {
    try {
      setIsLoading(true);
      const weekStart = getWeekStart();

      const { data, error } = await supabase
        .from("tasks")
        .select("client_id, status")
        .in("client_id", clientIds)
        .eq("week_start", weekStart);

      if (error) throw error;

      const stats: Record<string, ClientTaskStats> = {};

      clientIds.forEach((id) => {
        stats[id] = { pending: 0, in_progress: 0, completed: 0, total: 0 };
      });

      (data || []).forEach((task) => {
        if (stats[task.client_id]) {
          stats[task.client_id][task.status as TaskStatus]++;
          stats[task.client_id].total++;
        }
      });

      setTaskStats(stats);
    } catch (error) {
      console.error("Error fetching client task stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatsForClient = (clientId: string): ClientTaskStats => {
    return taskStats[clientId] || { pending: 0, in_progress: 0, completed: 0, total: 0 };
  };

  return {
    taskStats,
    getStatsForClient,
    isLoading,
    refetch: fetchTaskStats,
  };
}
