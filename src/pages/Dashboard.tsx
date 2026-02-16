import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Clock,
  ArrowUpRight,
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

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [dayStats, setDayStats] = useState<DayStats>({
    daily: { pending: 0, in_progress: 0, completed: 0, total: 0 },
    weekly: { pending: 0, in_progress: 0, completed: 0, total: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

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

      const allTasksRes = await supabase.from("tasks").select("status, frequency");
      if (allTasksRes.error) throw allTasksRes.error;

      const allTasks = allTasksRes.data || [];

      const overall: TaskStats = {
        pending: allTasks.filter((t: any) => t.status === "pending").length,
        in_progress: allTasks.filter((t: any) => t.status === "in_progress").length,
        completed: allTasks.filter((t: any) => t.status === "completed").length,
        total: allTasks.length,
      };
      setTaskStats(overall);

      const dailyTasks = allTasks.filter((t: any) => (t.frequency || "weekly") === "daily");
      const weeklyTasks = allTasks.filter((t: any) => (t.frequency || "weekly") === "weekly");

      const daily: TaskStats = {
        pending: dailyTasks.filter((t: any) => t.status === "pending").length,
        in_progress: dailyTasks.filter((t: any) => t.status === "in_progress").length,
        completed: dailyTasks.filter((t: any) => t.status === "completed").length,
        total: dailyTasks.length,
      };

      const weekly: TaskStats = {
        pending: weeklyTasks.filter((t: any) => t.status === "pending").length,
        in_progress: weeklyTasks.filter((t: any) => t.status === "in_progress").length,
        completed: weeklyTasks.filter((t: any) => t.status === "completed").length,
        total: weeklyTasks.length,
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

  const stats = [
    {
      label: "Clientes Ativos",
      value: clients.length,
      icon: Users,
      change: "Total na carteira",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Tarefas Pendentes",
      value: taskStats.pending,
      icon: CheckSquare,
      change: "Aguardando ação",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Visualizações",
      value: "—",
      icon: Eye,
      change: "Métrica Google",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Chamadas",
      value: "—",
      icon: Phone,
      change: "Métrica Google",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
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
      title={`Olá, ${profile?.full_name?.split(" ")[0] || "Usuário"}! 👋`}
      subtitle={`Visão geral • ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`}
      headerActions={
        <Button
          onClick={() => navigate("/onboarding")}
          className="h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 font-bold px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Stats Grid - Visualmente Melhorado */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative p-6 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-blue-100 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {index < 2 && (
                  <span className="flex items-center text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> +0%
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                </div>
                <div className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-50 mt-3">
                  {stat.change}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Bars Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="rounded-[24px] bg-white border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Metas Diárias</h3>
                  <p className="text-xs text-slate-500">Progresso de hoje</p>
                </div>
              </div>
            </div>
            <ProgressBar
              pending={dayStats.daily.pending}
              inProgress={dayStats.daily.in_progress}
              completed={dayStats.daily.completed}
              total={dayStats.daily.total}
              label="Tarefas"
            />
          </div>

          <div className="rounded-[24px] bg-white border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Metas Semanais</h3>
                  <p className="text-xs text-slate-500">Visão geral da semana</p>
                </div>
              </div>
            </div>
            <ProgressBar
              pending={dayStats.weekly.pending}
              inProgress={dayStats.weekly.in_progress}
              completed={dayStats.weekly.completed}
              total={dayStats.weekly.total}
              label="Tarefas"
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Clients List - Redesenhado */}
          <motion.div
            className="lg:col-span-2 rounded-[24px] bg-white border border-slate-100 shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                <h2 className="font-bold text-lg text-slate-900">Meus Clientes</h2>
              </div>
              <Link to="/clients">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                >
                  Ver todos <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {clients.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">Comece sua jornada</h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                    Adicione seu primeiro cliente para desbloquear o poder do Gestão Nexus.
                  </p>
                  <Button
                    onClick={() => navigate("/onboarding")}
                    className="h-10 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-100"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Cadastrar Cliente
                  </Button>
                </div>
              ) : (
                clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="p-4 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all overflow-hidden">
                          <ClientAvatar avatarUrl={(client as any).avatar_url} clientName={client.name} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              {getBusinessTypeLabel(client.business_type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {client.google_business_id && (
                          <div
                            className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center"
                            title="Google Conectado"
                          >
                            <span className="text-blue-600 font-bold text-xs">G</span>
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Tasks - Redesenhado */}
          <motion.div
            className="rounded-[24px] bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                <h2 className="font-bold text-lg text-slate-900">Atividades</h2>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wide"
              >
                Ver Fila
              </Link>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
              {recentTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Tudo limpo por aqui!</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Status Indicator Line */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        task.status === "completed"
                          ? "bg-emerald-500"
                          : task.status === "in_progress"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      }`}
                    />

                    <div className="flex justify-between items-start pl-3">
                      <div>
                        <div className="font-bold text-sm text-slate-800 line-clamp-1">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" /> {task.clients?.name || "Cliente"}
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] px-2 h-5 border-0 ${
                          task.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mini Plan Card at bottom of sidebar */}
            <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100 m-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seu Plano</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-center min-w-[60px]">
                  {planLabel}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Você pode gerenciar até <strong className="text-slate-900">{clientLimit}</strong>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
