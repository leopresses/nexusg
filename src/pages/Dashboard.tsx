import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  TrendingUp,
  Eye,
  Phone,
  MoreVertical,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string } | null;
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: Users, label: "Clientes", href: "/clients", active: false },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks", active: false },
  { icon: FileText, label: "Relatórios", href: "/reports", active: false },
  { icon: Settings, label: "Configurações", href: "/settings", active: false },
];

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

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, tasksRes] = await Promise.all([
        supabase.from("clients").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("tasks").select("*, clients(name)").order("created_at", { ascending: false }).limit(5),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const stats = [
    { label: "Clientes Ativos", value: clients.length.toString(), icon: Users, change: `Limite: ${profile?.clients_limit || 1}` },
    { label: "Tarefas Pendentes", value: pendingTasks.toString(), icon: CheckSquare, change: `${completedTasks} concluídas` },
    { label: "Seu Plano", value: profile?.plan?.toUpperCase() || "STARTER", icon: Eye, change: "Plano atual" },
    { label: "Taxa de Conclusão", value: tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}%` : "0%", icon: Phone, change: "Esta semana" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-sidebar-border">
          <Logo size="sm" showText={sidebarOpen} />
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    item.active 
                      ? 'bg-sidebar-accent text-sidebar-primary' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Olá, {profile?.full_name?.split(" ")[0] || "Usuário"}! 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Semana de {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - Visão geral
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button onClick={() => navigate("/onboarding")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
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
                          <div className="h-12 w-12 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
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
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
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
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tarefa ainda
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
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
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
