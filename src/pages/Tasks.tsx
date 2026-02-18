import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Loader2,
  Plus,
  Calendar,
  CalendarDays,
  HelpCircle,
  X,
  ArrowRight,
  ListTodo,
  Filter,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useTasks } from "@/hooks/useTasks";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskStats } from "@/components/tasks/TaskStats";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateCustomTaskDialog } from "@/components/tasks/CreateCustomTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const clientFromUrl = searchParams.get("client");

  const { tasks, clients, isLoading, toggleChecklistItem, updateTaskStatus, refetch } = useTasks();
  const { playStatusChangeSound } = useUserPreferences();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>(clientFromUrl || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [frequencyTab, setFrequencyTab] = useState<"all" | "daily" | "weekly">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Estado para o tutorial
  const [showTutorial, setShowTutorial] = useState(false);

  // Update filter when URL changes
  useEffect(() => {
    if (clientFromUrl) {
      setFilterClient(clientFromUrl);
    }
  }, [clientFromUrl]);

  // Check tutorial on load
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("tasks_tutorial_seen");
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("tasks_tutorial_seen", "true");
  };

  // Handle status change with sound
  const handleStatusChange = async (taskId: string, status: "pending" | "in_progress" | "completed") => {
    await updateTaskStatus(taskId, status);
    playStatusChangeSound();
  };

  // Handle checklist toggle with sound
  const handleChecklistToggle = async (taskId: string, itemId: string) => {
    await toggleChecklistItem(taskId, itemId);
    playStatusChangeSound();
  };

  // Memoize filtered tasks for performance and consistency
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter by client - must match exactly if not "all"
      if (filterClient !== "all") {
        if (task.client_id !== filterClient) return false;
      }

      // Filter by status - must match exactly if not "all"
      if (filterStatus !== "all") {
        if (task.status !== filterStatus) return false;
      }

      // Filter by frequency
      if (frequencyTab !== "all") {
        const taskFrequency = (task as any).frequency || "weekly";
        if (taskFrequency !== frequencyTab) return false;
      }

      // Filter by search query
      if (searchQuery) {
        if (!task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }

      return true;
    });
  }, [tasks, filterClient, filterStatus, frequencyTab, searchQuery]);

  // Calculate stats based on filtered tasks (when client is selected) or all tasks
  const stats = useMemo(() => {
    let tasksToCount = tasks;

    if (filterClient !== "all") {
      tasksToCount = tasks.filter((t) => t.client_id === filterClient);
    }

    if (frequencyTab !== "all") {
      tasksToCount = tasksToCount.filter((t) => ((t as any).frequency || "weekly") === frequencyTab);
    }

    return {
      pending: tasksToCount.filter((t) => t.status === "pending").length,
      in_progress: tasksToCount.filter((t) => t.status === "in_progress").length,
      completed: tasksToCount.filter((t) => t.status === "completed").length,
    };
  }, [tasks, filterClient, frequencyTab]);

  if (isLoading) {
    return (
      <AppLayout title="Tarefas" subtitle="Gerencie todas as tarefas dos seus clientes">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 !bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando tarefas…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Get selected client name for subtitle
  const selectedClient = clients.find((c) => c.id === filterClient);
  const subtitle = selectedClient ? `Tarefas de ${selectedClient.name}` : "Gerencie todas as tarefas dos seus clientes";

  return (
    <AppLayout
      title="Tarefas"
      subtitle={subtitle}
      headerActions={
        <div className="flex items-center gap-2 relative">
          {/* Botão de Ajuda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTutorial(true)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
            title="Como funciona?"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Botão Nova Tarefa */}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-md font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>

          {/* Tutorial Bubble */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-14 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <ListTodo className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm">Gerencie suas Demandas</h3>
                  </div>
                  <button
                    onClick={closeTutorial}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-sm text-blue-50">
                  <ul className="space-y-2 list-none">
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        1
                      </span>
                      <span>Use os filtros acima para focar em um cliente específico ou frequência.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        2
                      </span>
                      <span>Clique na tarefa para ver e marcar os itens do checklist.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        3
                      </span>
                      <span>Crie tarefas avulsas personalizadas no botão "Nova Tarefa".</span>
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

                {/* Seta do balão */}
                <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Frequency Tabs */}
        <Tabs value={frequencyTab} onValueChange={(v) => setFrequencyTab(v as any)}>
          <div className="rounded-2xl border border-slate-200 !bg-white p-2 shadow-sm">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="gap-2 rounded-xl data-[state=active]:!bg-blue-600 data-[state=active]:!text-white font-medium"
              >
                <CheckSquare className="h-4 w-4" />
                Todas
              </TabsTrigger>
              <TabsTrigger
                value="daily"
                className="gap-2 rounded-xl data-[state=active]:!bg-blue-600 data-[state=active]:!text-white font-medium"
              >
                <Calendar className="h-4 w-4" />
                Diárias
              </TabsTrigger>
              <TabsTrigger
                value="weekly"
                className="gap-2 rounded-xl data-[state=active]:!bg-blue-600 data-[state=active]:!text-white font-medium"
              >
                <CalendarDays className="h-4 w-4" />
                Semanais
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            filterClient={filterClient}
            onClientChange={setFilterClient}
            clients={clients}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 !bg-white p-5 shadow-sm">
          <TaskStats pending={stats.pending} inProgress={stats.in_progress} completed={stats.completed} />
        </div>

        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTask === task.id}
              onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              onToggleChecklistItem={handleChecklistToggle}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-slate-200 !bg-white py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl !bg-slate-50 border border-slate-200">
              <Filter className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Nenhuma tarefa encontrada</h3>
            <p className="mx-auto max-w-md text-sm text-slate-600">
              {tasks.length === 0
                ? "As tarefas serão geradas automaticamente toda semana"
                : "Ajuste os filtros de status ou cliente para ver outras tarefas"}
            </p>
          </div>
        )}
      </div>

      <CreateCustomTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        clients={clients}
        selectedClientId={filterClient !== "all" ? filterClient : undefined}
        onSuccess={refetch}
      />
    </AppLayout>
  );
}
