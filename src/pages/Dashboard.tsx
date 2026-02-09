import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AppLayout } from "@/components/AppLayout";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { TodayTasksCard } from "@/components/dashboard/TodayTasksCard";
import { LatestReportsPanel } from "@/components/dashboard/LatestReportsPanel";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string; avatar_url?: string | null } | null;
};

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, recentTasksRes, pendingCount, inProgressCount, completedCount] = await Promise.all([
        supabase.from("clients").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("tasks").select("*, clients(name, avatar_url)").order("created_at", { ascending: false }).limit(10),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (recentTasksRes.data) setRecentTasks(recentTasksRes.data as Task[]);

      const pending = pendingCount.count || 0;
      const inProgress = inProgressCount.count || 0;
      const completed = completedCount.count || 0;

      setTaskStats({
        pending,
        in_progress: inProgress,
        completed,
        total: pending + inProgress + completed,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute average rating from clients with place_snapshot
  const ratingsData = clients
    .map((c) => (c.place_snapshot as Record<string, any> | null)?.rating)
    .filter((r): r is number => typeof r === "number");
  const averageRating = ratingsData.length > 0 ? ratingsData.reduce((a, b) => a + b, 0) / ratingsData.length : 0;
  const totalReviews = clients
    .map((c) => (c.place_snapshot as Record<string, any> | null)?.user_ratings_total)
    .filter((r): r is number => typeof r === "number")
    .reduce((a, b) => a + b, 0);

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  if (isLoading) {
    return (
      <AppLayout title="Carregando..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Bem-vindo, ${firstName}! 👋`}
      subtitle={`Semana de ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — Visão geral`}
      headerActions={
        <Button onClick={() => navigate("/onboarding")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <DashboardStatsCards
          clientsCount={clients.length}
          pendingTasks={taskStats.pending}
          totalReviews={totalReviews}
          averageRating={averageRating}
        />

        {/* Main content: Tasks + Reports panel */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodayTasksCard tasks={recentTasks} totalTasks={taskStats.total} />
          </div>
          <div>
            <LatestReportsPanel clients={clients} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
