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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AppLayout } from "@/components/AppLayout";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string } | null;
};

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
};

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em progresso",
  completed: "Concluída",
};

// Task stats for the total count across all tasks
interface TaskStats {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all clients
      const clientsRes = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Get recent tasks for display (limited)
      const recentTasksRes = await supabase
        .from("tasks")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(10);

      // Get total task counts by status (no limit)
      const [pendingCount, inProgressCount, completedCount] = await Promise.all([
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

  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  const stats = [
    { label: "Clientes Ativos", value: clients.length.toString(), icon: Users, change: `Limite: ${profile?.clients_limit || 1}` },
    { label: "Tarefas Pendentes", value: taskStats.pending.toString(), icon: CheckSquare, change: `${taskStats.completed} concluídas` },
    { label: "Seu Plano", value: profile?.plan?.toUpperCase() || "STARTER", icon: Eye, change: "Plano atual" },
    { label: "Taxa de Conclusão", value: `${completionRate}%`, icon: Phone, change: "Total geral" },
  ];

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
      title={`Olá, ${profile?.full_name || "Usuário"}! 👋`}
      subtitle={`Semana de ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - Visão geral`}
      headerActions={
        <Button onClick={() => navigate("/onboarding")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      }
    >
      <div className="space-y-6">
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
              className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className="text-xs text-success mt-2">{stat.change}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <motion.div 
            className="lg:col-span-2 rounded-xl bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-lg">Clientes</h2>
              <Link to="/clients" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {clients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Nenhum cliente ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione seu primeiro cliente para começar
                  </p>
                  <Button onClick={() => navigate("/onboarding")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cliente
                  </Button>
                </div>
              ) : (
                clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl gradient-neon flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{client.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{client.business_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-medium">{client.address ? "✓" : "—"}</div>
                          <div className="text-xs text-muted-foreground">Endereço</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium flex items-center gap-1">
                            {client.google_business_id ? "✓" : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">Google</div>
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
            className="rounded-xl bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-lg">Tarefas Recentes</h2>
              <Link to="/tasks" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todas <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa ainda
                  </p>
                </div>
              ) : (
                <>
                  {recentTasks.slice(0, 5).map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => navigate("/tasks")}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {task.clients?.name || "Cliente"}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${statusColors[task.status as keyof typeof statusColors]}`}
                        >
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {taskStats.total > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => navigate("/tasks")}
                    >
                      Ver todas ({taskStats.total} tarefas)
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
