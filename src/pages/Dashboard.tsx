import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Plus,
  TrendingUp,
  Eye,
  Phone,
  ChevronRight,
  Loader2,
  Calendar,
  CalendarDays,
  HelpCircle,
  X,
  ArrowRight,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AppLayout } from "@/components/AppLayout";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { getBusinessTypeLabel, formatClientLimit, getPlanLabel } from "@/config/plans";
import { useHelpTutorial } from "@/hooks/useHelpTutorial";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertCard } from "@/components/alerts/AlertCard";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string } | null;
};

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em progresso",
  completed: "Concluída",
};

interface TaskStats {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
}

interface DayStats {
  daily: TaskStats;
  weekly: TaskStats;
}

interface MetricsData {
  views: number;
  calls: number;
  viewsPrev: number;
  callsPrev: number;
  hasData: boolean;
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [dayStats, setDayStats] = useState<DayStats>({
    daily: { pending: 0, in_progress: 0, completed: 0, total: 0 },
    weekly: { pending: 0, in_progress: 0, completed: 0, total: 0 },
  });
  const [metricsData, setMetricsData] = useState<MetricsData>({ views: 0, calls: 0, viewsPrev: 0, callsPrev: 0, hasData: false });
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { isOpen: showTutorial, open: openTutorial, close: closeTutorial } = useHelpTutorial("/dashboard");
  const { alerts: allAlerts, isLoading: alertsLoading } = useAlerts();
  const topAlerts = allAlerts.slice(0, 5);

  const [metricsError, setMetricsError] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    setMetricsError(false);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);

      const { data: currentData, error: currentError } = await supabase
        .from("google_metrics_daily")
        .select("views, calls, date, client_id, user_id")
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .lte("date", now.toISOString().split("T")[0]);

      if (currentError) {
        console.error("Error fetching current metrics:", currentError);
        setMetricsError(true);
        return;
      }

      const { data: prevData, error: prevError } = await supabase
        .from("google_metrics_daily")
        .select("views, calls, date, client_id, user_id")
        .eq("user_id", user.id)
        .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
        .lt("date", sevenDaysAgo.toISOString().split("T")[0]);

      if (prevError) {
        console.error("Error fetching previous metrics:", prevError);
        setMetricsError(true);
        return;
      }

      const current = (currentData || []).reduce(
        (acc, m) => ({ views: acc.views + (m.views || 0), calls: acc.calls + (m.calls || 0) }),
        { views: 0, calls: 0 }
      );
      const prev = (prevData || []).reduce(
        (acc, m) => ({ views: acc.views + (m.views || 0), calls: acc.calls + (m.calls || 0) }),
        { views: 0, calls: 0 }
      );

      setMetricsData({
        views: current.views,
        calls: current.calls,
        viewsPrev: prev.views,
        callsPrev: prev.calls,
        hasData: (currentData || []).length > 0 || (prevData || []).length > 0,
      });
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setMetricsError(true);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchMetrics();
  }, [fetchMetrics]);

  const fetchData = async () => {
    try {
      const clientsRes = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (clientsRes.error) throw clientsRes.error;
      setClients(clientsRes.data || []);

      const tasksRes = await supabase
        .from("tasks")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (tasksRes.error) throw tasksRes.error;
      setRecentTasks((tasksRes.data as any) || []);

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      const weeklyTasksRes = await supabase
        .from("tasks")
        .select("status, frequency")
        .eq("week_start", weekStartStr);
      
      const dailyTasksRes = await supabase
        .from("tasks")
        .select("status, frequency")
        .eq("task_date", todayStr)
        .eq("frequency", "daily");

      const weeklyTasks = weeklyTasksRes.data || [];
      const dailyTasks = dailyTasksRes.data || [];
      const allCurrentTasks = [...weeklyTasks, ...dailyTasks];

      const overall: TaskStats = {
        pending: allCurrentTasks.filter((t: any) => t.status === "pending").length,
        in_progress: allCurrentTasks.filter((t: any) => t.status === "in_progress").length,
        completed: allCurrentTasks.filter((t: any) => t.status === "completed").length,
        total: allCurrentTasks.length,
      };
      setTaskStats(overall);

      const daily: TaskStats = {
        pending: dailyTasks.filter((t: any) => t.status === "pending").length,
        in_progress: dailyTasks.filter((t: any) => t.status === "in_progress").length,
        completed: dailyTasks.filter((t: any) => t.status === "completed").length,
        total: dailyTasks.length,
      };

      const weeklyOnly = weeklyTasks.filter((t: any) => (t.frequency || "weekly") === "weekly");
      const weekly: TaskStats = {
        pending: weeklyOnly.filter((t: any) => t.status === "pending").length,
        in_progress: weeklyOnly.filter((t: any) => t.status === "in_progress").length,
        completed: weeklyOnly.filter((t: any) => t.status === "completed").length,
        total: weeklyOnly.length,
      };

      setDayStats({ daily, weekly });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const planLabel = getPlanLabel((profile as any)?.plan);
  const clientLimit = formatClientLimit((profile as any)?.clients_limit);

  // Helper to compute change text
  const getChangeText = (current: number, previous: number): string => {
    if (previous === 0 && current === 0) return "Sem variação";
    if (previous === 0) return `+${current} vs semana anterior`;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct > 0) return `+${pct}% vs semana anterior`;
    if (pct < 0) return `${pct}% vs semana anterior`;
    return "Sem variação";
  };

  // Compute client health: how many clients have Google synced
  const clientsWithGoogle = clients.filter(c => c.place_id).length;
  const clientsWithoutGoogle = clients.length - clientsWithGoogle;

  const stats = [
    { label: "Clientes Ativos", value: String(clients.length), icon: Users, change: "Ativos no momento", color: "text-blue-600", isEmpty: false, isError: false },
    { label: "Tarefas Pendentes", value: String(taskStats.pending), icon: CheckSquare, change: "Precisam de atenção", color: "text-amber-600", isEmpty: false, isError: false },
    {
      label: "Visualizações",
      value: metricsError ? "Erro" : metricsData.hasData ? metricsData.views.toLocaleString("pt-BR") : "Sem dados",
      icon: Eye,
      change: metricsError ? "Erro ao carregar métricas" : metricsData.hasData ? getChangeText(metricsData.views, metricsData.viewsPrev) : "Conecte o Google para medir",
      color: "text-indigo-600",
      isEmpty: !metricsData.hasData && !metricsError,
      isError: metricsError,
    },
    {
      label: "Chamadas",
      value: metricsError ? "Erro" : metricsData.hasData ? metricsData.calls.toLocaleString("pt-BR") : "Sem dados",
      icon: Phone,
      change: metricsError ? "Erro ao carregar métricas" : metricsData.hasData ? getChangeText(metricsData.calls, metricsData.callsPrev) : "Conecte o Google para medir",
      color: "text-emerald-600",
      isEmpty: !metricsData.hasData && !metricsError,
      isError: metricsError,
    },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Carregando..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando painel…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Olá, ${profile?.full_name || "Usuário"}! 👋`}
      subtitle={`Semana de ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - Visão geral`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={openTutorial}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            title="Ver tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => navigate("/onboarding")}
            className="h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      }
    >
      <div className="space-y-6 relative">
        {/* Tutorial Bubble */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-0 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-sm">Bem-vindo ao Painel!</h3>
                </div>
                <button
                  onClick={closeTutorial}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-blue-50">
                <p>Aqui você tem uma visão geral do seu negócio:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">1</span>
                    <span>Acompanhe o progresso das suas tarefas diárias e semanais.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">2</span>
                    <span>Veja métricas reais do Google (visualizações e chamadas).</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span>
                    <span>Adicione novos clientes rapidamente no botão acima.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeTutorial}
                  className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  Entendi <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.isError ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <stat.icon className={`h-5 w-5 ${stat.isError ? 'text-red-500' : stat.color}`} />
                </div>
                {!stat.isEmpty && !stat.isError && <TrendingUp className="h-4 w-4 text-emerald-600" />}
              </div>
              <div className={`text-2xl font-bold mb-1 ${stat.isError ? 'text-red-500' : stat.isEmpty ? 'text-slate-400' : 'text-slate-900'}`}>{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
              <div className="text-xs text-slate-400 mt-2">{stat.change}</div>
              {(stat.isEmpty || stat.isError) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                  onClick={() => navigate(stat.isError ? "/dashboard" : "/clients")}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {stat.isError ? "Tentar novamente" : "Sincronizar Google"}
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Client Health Banner (if some clients lack Google) */}
        {clients.length > 0 && clientsWithoutGoogle > 0 && (
          <motion.div
            className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 text-sm text-amber-800">
              <strong>{clientsWithoutGoogle}</strong> cliente{clientsWithoutGoogle > 1 ? "s" : ""} sem Google sincronizado.{" "}
              <Link to="/clients" className="underline font-medium">
                Vincular Place ID →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Progress Bars */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Tarefas de Hoje</h3>
            </div>
            <ProgressBar
              pending={dayStats.daily.pending}
              inProgress={dayStats.daily.in_progress}
              completed={dayStats.daily.completed}
              total={dayStats.daily.total}
              label="Diárias"
            />
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Tarefas da Semana</h3>
            </div>
            <ProgressBar
              pending={dayStats.weekly.pending}
              inProgress={dayStats.weekly.in_progress}
              completed={dayStats.weekly.completed}
              total={dayStats.weekly.total}
              label="Semanais"
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <motion.div
            className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-slate-900">Clientes</h2>
              <Link to="/clients" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {clients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2 text-slate-900">Nenhum cliente ainda</h3>
                  <p className="text-sm text-slate-500 mb-4">Adicione seu primeiro cliente para começar</p>
                  <Button
                    onClick={() => navigate("/onboarding")}
                    className="h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cliente
                  </Button>
                </div>
              ) : (
                clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-lg overflow-hidden">
                          <ClientAvatar avatarUrl={(client as any).avatar_url} clientName={client.name} />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{client.name}</h3>
                          <p className="text-sm text-slate-500 capitalize">
                            {getBusinessTypeLabel(client.business_type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-medium text-slate-700">{client.address ? "✓" : "—"}</div>
                          <div className="text-xs text-slate-500">Endereço</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            {client.place_id ? (
                              <span className="text-emerald-600">✓</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">Google</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Tasks */}
          <motion.div
            className="rounded-2xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-slate-900">Tarefas Recentes</h2>
              <Link to="/tasks" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todas <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Nenhuma tarefa recente</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm text-slate-900">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{task.clients?.name || "Cliente"}</div>
                      </div>
                      <Badge
                        className={`border rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}
                      >
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Alerts Card */}
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-lg text-slate-900">Alertas</h2>
            <Link to="/alerts" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {alertsLoading ? (
              <div className="text-center py-4 text-sm text-slate-500">Carregando…</div>
            ) : topAlerts.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">Nenhum alerta no momento</div>
            ) : (
              topAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} compact />
              ))
            )}
          </div>
        </motion.div>

        {/* Plan Card */}
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-900">Seu plano</h3>
              <p className="text-sm text-slate-500">
                {planLabel} • Limite: {clientLimit}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
