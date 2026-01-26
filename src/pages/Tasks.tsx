import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Task {
  id: number;
  title: string;
  client: string;
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  checklist: ChecklistItem[];
}

const initialTasks: Task[] = [
  { 
    id: 1, 
    title: "Postar 3 fotos no Google Business", 
    client: "Pizzaria Roma", 
    status: "pending",
    dueDate: "Hoje",
    checklist: [
      { id: "1-1", text: "Tirar foto do prato principal", completed: false },
      { id: "1-2", text: "Editar e ajustar cores", completed: false },
      { id: "1-3", text: "Publicar no Google Business", completed: false },
    ]
  },
  { 
    id: 2, 
    title: "Responder avaliações da semana", 
    client: "Barbearia Vintage", 
    status: "in_progress",
    dueDate: "Amanhã",
    checklist: [
      { id: "2-1", text: "Ler todas as avaliações novas", completed: true },
      { id: "2-2", text: "Responder avaliações positivas", completed: true },
      { id: "2-3", text: "Responder avaliações negativas com cuidado", completed: false },
    ]
  },
  { 
    id: 3, 
    title: "Atualizar horário de funcionamento", 
    client: "Café Central", 
    status: "completed",
    dueDate: "Concluída",
    checklist: [
      { id: "3-1", text: "Confirmar novos horários com cliente", completed: true },
      { id: "3-2", text: "Atualizar no Google Business", completed: true },
    ]
  },
  { 
    id: 4, 
    title: "Criar post promocional de fim de semana", 
    client: "Pizzaria Roma", 
    status: "pending",
    dueDate: "Sexta",
    checklist: [
      { id: "4-1", text: "Definir promoção com cliente", completed: false },
      { id: "4-2", text: "Criar arte no Canva", completed: false },
      { id: "4-3", text: "Agendar publicação", completed: false },
    ]
  },
  { 
    id: 5, 
    title: "Adicionar fotos do cardápio", 
    client: "Café Central", 
    status: "pending",
    dueDate: "Esta semana",
    checklist: [
      { id: "5-1", text: "Fotografar 5 itens do cardápio", completed: false },
      { id: "5-2", text: "Editar fotos", completed: false },
      { id: "5-3", text: "Upload para Google Business", completed: false },
      { id: "5-4", text: "Adicionar descrições", completed: false },
    ]
  },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
  { icon: Users, label: "Clientes", href: "/clients", active: false },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks", active: true },
  { icon: FileText, label: "Relatórios", href: "/reports", active: false },
  { icon: Settings, label: "Configurações", href: "/settings", active: false },
];

const statusConfig = {
  pending: { 
    label: "Pendente", 
    color: "bg-warning/20 text-warning border-warning/30",
    icon: Clock 
  },
  in_progress: { 
    label: "Em progresso", 
    color: "bg-primary/20 text-primary border-primary/30",
    icon: AlertCircle 
  },
  completed: { 
    label: "Concluída", 
    color: "bg-success/20 text-success border-success/30",
    icon: CheckCircle2 
  },
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const clients = [...new Set(tasks.map(t => t.client))];

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterClient !== "all" && task.client !== filterClient) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleChecklistItem = (taskId: number, itemId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedChecklist = task.checklist.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const allCompleted = updatedChecklist.every(item => item.completed);
        const someCompleted = updatedChecklist.some(item => item.completed);
        
        return {
          ...task,
          checklist: updatedChecklist,
          status: allCompleted ? "completed" : someCompleted ? "in_progress" : "pending"
        };
      }
      return task;
    }));
  };

  const getProgress = (task: Task) => {
    const completed = task.checklist.filter(item => item.completed).length;
    return Math.round((completed / task.checklist.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <Logo size="sm" />
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
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tarefas</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie todas as tarefas dos seus clientes
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-[180px] bg-secondary border-border">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <div className="text-2xl font-bold text-warning">
                {tasks.filter(t => t.status === "pending").length}
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {tasks.filter(t => t.status === "in_progress").length}
              </div>
              <div className="text-sm text-muted-foreground">Em progresso</div>
            </div>
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="text-2xl font-bold text-success">
                {tasks.filter(t => t.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">Concluídas</div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const StatusIcon = statusConfig[task.status].icon;
              const isExpanded = expandedTask === task.id;
              const progress = getProgress(task);

              return (
                <motion.div
                  key={task.id}
                  layout
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="text-muted-foreground hover:text-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <Badge variant="outline" className={statusConfig[task.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[task.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{task.client}</span>
                          <span>•</span>
                          <span>{task.dueDate}</span>
                          <span>•</span>
                          <span>{task.checklist.filter(i => i.completed).length}/{task.checklist.length} itens</span>
                        </div>
                      </div>

                      <div className="w-24">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full gradient-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 bg-secondary/30">
                          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Checklist</h4>
                          <div className="space-y-2">
                            {task.checklist.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                              >
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => toggleChecklistItem(task.id, item.id)}
                                />
                                <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                                  {item.text}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground">Ajuste os filtros ou crie uma nova tarefa</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
