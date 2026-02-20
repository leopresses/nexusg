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

  // CORREÇÃO: Gerenciamento manual do estado do tutorial para persistência
  const [showTutorial, setShowTutorial] = useState(false);

  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    // CORREÇÃO: Verifica no localStorage se o usuário já viu o tutorial
    const tutorialSeen = localStorage.getItem("dashboard_tutorial_seen");
    if (!tutorialSeen) {
      // Pequeno delay para uma entrada mais suave
      const timer = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // CORREÇÃO: Função para fechar e salvar permanentemente no navegador
  const handleCloseTutorial = () => {
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
    { label: "Clientes Ativos", value: clients.length, icon: Users, change: "Ativos no momento" },
    { label: "Tarefas Pendentes", value: taskStats.pending, icon: CheckSquare, change: "Precisam de atenção" },
    { label: "Visualizações (mock)", value: "—", icon: Eye, change: "Placeholder" },
    { label: "Chamadas (mock)", value: "—", icon: Phone, change: "Placeholder" },
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
          {/* Botão de ajuda para reabrir o tutorial se necessário */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTutorial(true)}
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
                  onClick={handleCloseTutorial}
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
                    <span>Veja estatísticas rápidas dos seus clientes.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span>
                    <span>Adicione novos clientes rapidamente no botão acima.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCloseTutorial}
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
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
              <div className="text-xs text-emerald-600 mt-2">{stat.change}</div>
            </motion.div>
          ))}
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
              <h3 className="font-semibold">Tarefas de Hoje</h3>
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
              <h3 className="font-semibold">Tarefas da Semana</h3>
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
              <h2 className="font-semibold text-lg">Clientes</h2>
              <Link to="/clients" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {clients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Nenhum cliente ainda</h3>
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
                          <h3 className="font-medium">{client.name}</h3>
                          <p className="text-sm text-slate-500 capitalize">
                            {getBusinessTypeLabel(client.business_type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-medium">{client.address ? "✓" : "—"}</div>
                          <div className="text-xs text-slate-500">Endereço</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium flex items-center gap-1">
                            {client.google_business_id ? "✓" : "—"}
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
              <h2 className="font-semibold text-lg">Tarefas Recentes</h2>
              <Link to="/tasks" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-10 w-10 text-slate-500 mx-auto mb-3" />
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
                        <div className="font-medium text-sm">{task.title}</div>
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

        {/* Plan Card */}
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Seu plano</h3>
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
