import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Plus,
  TrendingUp,
  ChevronRight,
  Loader2,
  Calendar,
  CalendarDays,
  HelpCircle,
  X,
  ArrowRight,
  AlertCircle,
  MapPin,
  FileText,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
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

interface ActionItem {
  id: string;
  icon: any;
  text: string;
  cta: string;
  href: string;
  color: string;
}

interface RiskClient {
  client: Client;
  score: number;
  reasons: string[];
  status: "danger" | "warning" | "ok";
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [dayStats, setDayStats] = useState<DayStats>({
    daily: { pending: 0, in_progress: 0, completed: 0, total: 0 },
    weekly: { pending: 0, in_progress: 0, completed: 0, total: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { isOpen: showTutorial, open: openTutorial, close: closeTutorial } = useHelpTutorial("/dashboard");
  const { alerts: allAlerts, isLoading: alertsLoading } = useAlerts();
  const topAlerts = allAlerts.slice(0, 5);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);

      const [clientsRes, recentTasksRes, weeklyTasksRes, dailyTasksRes, reportsRes, allRecentTasksRes] =
        await Promise.all([
          supabase.from("clients").select("*").eq("is_active", true).order("created_at", { ascending: false }),
          supabase.from("tasks").select("*, clients(name)").order("created_at", { ascending: false }).limit(5),
          supabase.from("tasks").select("status, frequency, client_id").eq("week_start", weekStartStr),
          supabase
            .from("tasks")
            .select("status, frequency, client_id")
            .eq("task_date", todayStr)
            .eq("frequency", "daily"),
          supabase.from("reports").select("client_id, created_at").gte("created_at", thirtyDaysAgo.toISOString()),
          supabase.from("tasks").select("client_id, created_at").gte("created_at", fourteenDaysAgo.toISOString()),
        ]);

      isMountedRef.current && setClients(clientsRes.data || []);
      isMountedRef.current && setRecentTasks((recentTasksRes.data as any) || []);
      isMountedRef.current && setReports(reportsRes.data || []);
      isMountedRef.current && setAllTasks(allRecentTasksRes.data || []);

      const weeklyTasks = weeklyTasksRes.data || [];
      const dailyTasks = dailyTasksRes.data || [];
      const allCurrentTasks = [...weeklyTasks, ...dailyTasks];

      const overall: TaskStats = {
        pending: allCurrentTasks.filter((t: any) => t.status === "pending").length,
        in_progress: allCurrentTasks.filter((t: any) => t.status === "in_progress").length,
        completed: allCurrentTasks.filter((t: any) => t.status === "completed").length,
        total: allCurrentTasks.length,
      };
      isMountedRef.current && setTaskStats(overall);

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

      isMountedRef.current && setDayStats({ daily, weekly });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      isMountedRef.current && setIsLoading(false);
    }
  }, [user]);

  const planLabel = getPlanLabel((profile as any)?.plan);
  const clientLimit = formatClientLimit((profile as any)?.clients_limit);

  // ── Computed: clients without Places
  const clientsWithoutPlaces = useMemo(() => clients.filter((c) => !c.place_id), [clients]);

  // ── Computed: clients without report in last 30 days
  const clientsWithoutReport = useMemo(() => {
    const clientIdsWithReport = new Set((reports || []).map((r: any) => r.client_id));
    return clients.filter((c) => !clientIdsWithReport.has(c.id));
  }, [clients, reports]);

  // ── Computed: clients without tasks in last 14 days
  const clientsWithoutRecentTasks = useMemo(() => {
    const clientIdsWithTasks = new Set((allTasks || []).map((t: any) => t.client_id));
    return clients.filter((c) => !clientIdsWithTasks.has(c.id));
  }, [clients, allTasks]);

  // ── TOP 5 ACTIONS ──
  const topActions = useMemo((): ActionItem[] => {
    const actions: ActionItem[] = [];

    // 1. Clients without Places
    const noPlaces = clientsWithoutPlaces;
    if (noPlaces.length > 0) {
      actions.push({
        id: "no-places",
        icon: MapPin,
        text: `Conectar Google Places de ${noPlaces.length > 1 ? noPlaces.length + " clientes" : noPlaces[0].name}`,
        cta: "Conectar",
        href: "/clients",
        color: "text-red-600 bg-red-50",
      });
    }

    // 2. Today's pending tasks
    if (dayStats.daily.pending > 0) {
      actions.push({
        id: "daily-pending",
        icon: Calendar,
        text: `Concluir tarefas de hoje (${dayStats.daily.pending} pendente${dayStats.daily.pending > 1 ? "s" : ""})`,
        cta: "Ver tarefas",
        href: "/tasks",
        color: "text-amber-600 bg-amber-50",
      });
    }

    // 3. Weekly pending tasks
    if (dayStats.weekly.pending > 0) {
      actions.push({
        id: "weekly-pending",
        icon: CalendarDays,
        text: `Tarefas da semana pendentes (${dayStats.weekly.pending})`,
        cta: "Ver tarefas",
        href: "/tasks",
        color: "text-blue-600 bg-blue-50",
      });
    }

    // 4. Clients without recent tasks
    if (clientsWithoutRecentTasks.length > 0) {
      actions.push({
        id: "no-recent-tasks",
        icon: CheckSquare,
        text: `${clientsWithoutRecentTasks.length} cliente${clientsWithoutRecentTasks.length > 1 ? "s" : ""} sem tarefas recentes`,
        cta: "Ver tarefas",
        href: "/tasks",
        color: "text-orange-600 bg-orange-50",
      });
    }

    // 5. Reports not generated this month
    if (clientsWithoutReport.length > 0) {
      actions.push({
        id: "no-reports",
        icon: FileText,
        text: `${clientsWithoutReport.length} cliente${clientsWithoutReport.length > 1 ? "s" : ""} sem relatório no mês`,
        cta: "Gerar relatório",
        href: "/reports",
        color: "text-purple-600 bg-purple-50",
      });
    }

    return actions.slice(0, 5);
  }, [clientsWithoutPlaces, dayStats, clientsWithoutRecentTasks, clientsWithoutReport]);

  // ── CLIENTS AT RISK ──
  const riskClients = useMemo((): RiskClient[] => {
    const clientIdsWithReport = new Set((reports || []).map((r: any) => r.client_id));
    const clientIdsWithTasks = new Set((allTasks || []).map((t: any) => t.client_id));

    const now = new Date();
    const weekStartStr = (() => {
      const d = new Date(now);
      const day = d.getDay();
      const offset = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    })();
    const todayStr = now.toISOString().split("T")[0];

    return clients
      .map((client) => {
        let score = 0;
        const reasons: string[] = [];

        if (!client.place_id) {
          score += 3;
          reasons.push("Sem Google Places");
        }

        // Check weekly pending (approximate from allTasks data)
        if (!clientIdsWithTasks.has(client.id)) {
          score += 1;
          reasons.push("Sem tarefas recentes");
        }

        if (!clientIdsWithReport.has(client.id)) {
          score += 1;
          reasons.push("Sem relatório no mês");
        }

        // Use taskStats data for pending tasks per client (approximation)
        if (dayStats.daily.pending > 0 || dayStats.weekly.pending > 0) {
          // We don't have per-client breakdown here, skip per-client task scoring
        }

        const status: RiskClient["status"] = score >= 4 ? "danger" : score >= 2 ? "warning" : "ok";

        return { client, score, reasons, status };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [clients, reports, allTasks, dayStats]);

  // ── KPI Stats (replacing Views/Calls with useful cards) ──
  const stats = [
    {
      label: "Clientes Ativos",
      value: String(clients.length),
      icon: Users,
      change: "Ativos no momento",
      color: "text-blue-600",
    },
    {
      label: "Tarefas Pendentes",
      value: String(taskStats.pending),
      icon: CheckSquare,
      change: "Precisam de atenção",
      color: "text-amber-600",
    },
    {
      label: "Sem Google Places",
      value: String(clientsWithoutPlaces.length),
      icon: MapPin,
      change: clientsWithoutPlaces.length === 0 ? "Tudo certo ✅" : "Conecte para liberar auditoria",
      color: "text-red-600",
      cta: clientsWithoutPlaces.length > 0 ? { label: "Conectar", href: "/clients" } : null,
    },
    {
      label: "Relatórios Pendentes",
      value: String(clientsWithoutReport.length),
      icon: FileText,
      change: clientsWithoutReport.length === 0 ? "Tudo certo ✅" : "Gere relatórios para enviar",
      color: "text-purple-600",
      cta: clientsWithoutReport.length > 0 ? { label: "Ir para relatórios", href: "/reports" } : null,
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
                <p>Seu painel de ação centralizado:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">1</span>
                    <span>Top 5 ações prioritárias do dia.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">2</span>
                    <span>Clientes em risco que precisam de atenção.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span>
                    <span>Atalhos rápidos para ações frequentes.</span>
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
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-slate-50">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1 text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
              <div className="text-xs text-slate-400 mt-2">{stat.change}</div>
              {(stat as any).cta && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                  onClick={() => navigate((stat as any).cta.href)}
                >
                  {(stat as any).cta.label} <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* (A) Top 5 Actions */}
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-lg text-slate-900">Top 5 ações de hoje</h2>
          </div>
          <div className="p-4">
            {topActions.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-slate-900">Tudo em dia ✅</p>
                <p className="text-sm text-slate-500 mt-1">Nenhuma ação prioritária no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{action.text}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => navigate(action.href)}
                    >
                      {action.cta} <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

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

        {/* (B) Clients at Risk + (C) Quick Shortcuts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Clients at Risk */}
          <motion.div
            className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-lg text-slate-900">Clientes em risco</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {riskClients.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">Nenhum cliente em risco ✅</p>
                  <p className="text-sm text-slate-500 mt-1">Todos os clientes estão em boas condições.</p>
                </div>
              ) : (
                riskClients.map((rc) => (
                  <div key={rc.client.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          <ClientAvatar avatarUrl={rc.client.avatar_url} clientName={rc.client.name} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm text-slate-900 truncate">{rc.client.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{(rc.reasons ?? []).join(" • ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`border rounded-full text-[10px] ${
                            rc.status === "danger"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : rc.status === "warning"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {rc.status === "danger" ? "🔴 Em risco" : rc.status === "warning" ? "🟡 Atenção" : "🟢 OK"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-blue-600 hover:bg-blue-50"
                          onClick={() => navigate(`/clients/${rc.client.id}`)}
                        >
                          Abrir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* (C) Quick Shortcuts */}
          <motion.div
            className="rounded-2xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-lg text-slate-900">Atalhos Rápidos</h2>
            </div>
            <div className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => navigate("/onboarding")}
              >
                <Plus className="h-4 w-4 text-blue-600" /> Novo Cliente
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => navigate("/clients")}
              >
                <MapPin className="h-4 w-4 text-emerald-600" /> Conectar Google Places
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => navigate("/tasks")}
              >
                <Calendar className="h-4 w-4 text-amber-600" /> Ver tarefas de hoje
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => navigate("/reports")}
              >
                <FileText className="h-4 w-4 text-purple-600" /> Gerar relatório
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Clients List + Recent Tasks */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
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
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Cliente
                  </Button>
                </div>
              ) : (
                clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-lg overflow-hidden">
                          <ClientAvatar avatarUrl={client.avatar_url} clientName={client.name} />
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
                          <div className="text-sm font-medium">
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

          <motion.div
            className="rounded-2xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
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

        {/* Alerts */}
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
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
              topAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} compact />)
            )}
          </div>
        </motion.div>

        {/* Plan Card */}
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
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
