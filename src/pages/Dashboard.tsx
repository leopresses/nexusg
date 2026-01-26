import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationCenter";
// Mock data
const stats = [
  { label: "Clientes Ativos", value: "5", icon: Users, change: "+2 este mês" },
  { label: "Tarefas Pendentes", value: "12", icon: CheckSquare, change: "4 para hoje" },
  { label: "Visualizações", value: "2.4k", icon: Eye, change: "+18% vs semana passada" },
  { label: "Chamadas", value: "89", icon: Phone, change: "+12% vs semana passada" },
];

const clients = [
  { 
    id: 1, 
    name: "Pizzaria Roma", 
    type: "Restaurante", 
    tasks: { completed: 3, total: 5 },
    views: 456,
    calls: 23 
  },
  { 
    id: 2, 
    name: "Barbearia Vintage", 
    type: "Serviços", 
    tasks: { completed: 4, total: 5 },
    views: 234,
    calls: 15 
  },
  { 
    id: 3, 
    name: "Café Central", 
    type: "Café", 
    tasks: { completed: 2, total: 5 },
    views: 567,
    calls: 31 
  },
];

const recentTasks = [
  { id: 1, title: "Postar 3 fotos no Google Business", client: "Pizzaria Roma", status: "pending" },
  { id: 2, title: "Responder avaliações da semana", client: "Barbearia Vintage", status: "in_progress" },
  { id: 3, title: "Atualizar horário de funcionamento", client: "Café Central", status: "completed" },
  { id: 4, title: "Criar post promocional", client: "Pizzaria Roma", status: "pending" },
];

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
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground">
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
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Semana de {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - Visão geral
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button>
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
                {clients.map((client) => (
                  <div key={client.id} className="p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-medium">{client.tasks.completed}/{client.tasks.total}</div>
                          <div className="text-xs text-muted-foreground">Tarefas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {client.views}
                          </div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {client.calls}
                          </div>
                          <div className="text-xs text-muted-foreground">Calls</div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
                {recentTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{task.client}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${statusColors[task.status as keyof typeof statusColors]}`}
                      >
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
