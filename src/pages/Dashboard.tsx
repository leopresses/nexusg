import { useState, useEffect } from "react";
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
  FileBarChart,
  RefreshCw,
  Clock,
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
  const [showTutorial, setShowTutorial] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const hasSeenTutorial = localStorage.getItem("dashboard_tutorial_seen");
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("dashboard_tutorial_seen", "true");
  };

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

      setDayStats({
        daily: {
          pending: dailyTasks.filter((t: any) => t.status === "pending").length,
          in_progress: dailyTasks.filter((t: any) => t.status === "in_progress").length,
          completed: dailyTasks.filter((t: any) => t.status === "completed").length,
          total: dailyTasks.length,
        },
        weekly: {
          pending: weeklyTasks.filter((t: any) => t.status === "pending").length,
          in_progress: weeklyTasks.filter((t: any) => t.status === "in_progress").length,
          completed: weeklyTasks.filter((t: any) => t.status === "completed").length,
          total: weeklyTasks.length,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const planLabel = getPlanLabel((profile as any)?.plan);
  const clientLimit = formatClientLimit((profile as any)?.clients_limit);

  const stats = [
    { label: "Clientes Ativos", value: clients.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    {
      label: "Tarefas Pendentes",
      value: taskStats.pending,
      icon: CheckSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    { label: "Visualizações", value: "—", icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Chamadas", value: "—", icon: Phone, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Carregando..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Olá, ${profile?.full_name?.split(" ")[0] || "Usuário"}! 👋`}
      subtitle="Veja o resumo da performance de seus clientes."
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTutorial(true)}
            className="text-slate-500 rounded-xl"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate("/onboarding")} className="h-10 rounded-xl bg-blue-600 text-white font-bold">
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      }
    >
      <div className="space-y-8 relative">
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-0 z-50 w-80 bg-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="font-bold text-sm">Resumo da Agência</h3>
                </div>
                <button onClick={closeTutorial} className="hover:bg-white/10 rounded-full p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-blue-50 leading-relaxed mb-4">
                Acompanhe métricas, gerencie tarefas diárias e gere relatórios profissionais para seus clientes do
                Google Business.
              </p>
              <Button
                onClick={closeTutorial}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold h-8 rounded-lg"
              >
                Entendi
              </Button>
              <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Ações Rápidas - Remodelado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/tasks")}
            className="h-16 rounded-2xl border-dashed border-slate-200 flex justify-start gap-4 px-6 hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Ver Checklist</div>
              <div className="text-[10px] text-slate-500 font-medium">Tarefas da semana</div>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-16 rounded-2xl border-dashed border-slate-200 flex justify-start gap-4 px-6 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Sincronizar Dados</div>
              <div className="text-[10px] text-slate-500 font-medium">Atualizar métricas Google</div>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/reports")}
            className="h-16 rounded-2xl border-dashed border-slate-200 flex justify-start gap-4 px-6 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Novo Relatório</div>
              <div className="text-[10px] text-slate-500 font-medium">Gerar PDF de performance</div>
            </div>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Progress Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Tarefas de Hoje</h3>
                </div>
                <ProgressBar
                  pending={dayStats.daily.pending}
                  inProgress={dayStats.daily.in_progress}
                  completed={dayStats.daily.completed}
                  total={dayStats.daily.total}
                  label="Diárias"
                />
              </div>
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Progresso Semanal</h3>
                </div>
                <ProgressBar
                  pending={dayStats.weekly.pending}
                  inProgress={dayStats.weekly.in_progress}
                  completed={dayStats.weekly.completed}
                  total={dayStats.weekly.total}
                  label="Semanais"
                />
              </div>
            </div>

            {/* Clientes Section */}
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900">Clientes Recentes</h2>
                <Link to="/clients" className="text-xs font-bold text-blue-600 hover:underline flex items-center">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {clients.slice(0, 4).map((client) => (
                  <div
                    key={client.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <ClientAvatar avatarUrl={(client as any).avatar_url} clientName={client.name} />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{client.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {getBusinessTypeLabel(client.business_type)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-slate-50 text-slate-500 border-0 text-[10px] font-bold px-2 py-0.5">
                      Ativo
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Atividades Recentes */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" /> Atividades
              </h2>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-2 w-2 rounded-full mt-1.5 ${task.status === "completed" ? "bg-emerald-500" : "bg-blue-600"}`}
                      />
                      <div className="w-px h-full bg-slate-100 group-last:hidden" />
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {task.clients?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card de Assinatura */}
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg relative overflow-hidden">
              <Star className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <Badge className="bg-white/20 text-white border-0 font-bold px-3 py-1 rounded-lg uppercase tracking-wider text-[10px]">
                  {planLabel}
                </Badge>
              </div>
              <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Capacidade Total</p>
              <h4 className="text-3xl font-black mb-4">
                {clients.length} / {clientLimit}
              </h4>
              <div className="w-full h-2 bg-white/20 rounded-full relative z-10">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${(clients.length / (parseInt(clientLimit) || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
