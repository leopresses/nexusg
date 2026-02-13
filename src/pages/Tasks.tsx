import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckSquare, Loader2, Plus, Calendar, CalendarDays } from "lucide-react";
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

  // Update filter when URL changes
  useEffect(() => {
    if (clientFromUrl) {
      setFilterClient(clientFromUrl);
    }
  }, [clientFromUrl]);

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
    return tasks.filter(task => {
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
      tasksToCount = tasks.filter(t => t.client_id === filterClient);
    }
    
    if (frequencyTab !== "all") {
      tasksToCount = tasksToCount.filter(t => ((t as any).frequency || "weekly") === frequencyTab);
    }
    
    return {
      pending: tasksToCount.filter(t => t.status === "pending").length,
      in_progress: tasksToCount.filter(t => t.status === "in_progress").length,
      completed: tasksToCount.filter(t => t.status === "completed").length,
    };
  }, [tasks, filterClient, frequencyTab]);

  if (isLoading) {
    return (
      <AppLayout title="Tarefas" subtitle="Gerencie todas as tarefas dos seus clientes">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Get selected client name for subtitle
  const selectedClient = clients.find(c => c.id === filterClient);
  const subtitle = selectedClient 
    ? `Tarefas de ${selectedClient.name}`
    : "Gerencie todas as tarefas dos seus clientes";

  return (
    <AppLayout 
      title="Tarefas" 
      subtitle={subtitle}
      headerActions={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Frequency Tabs */}
        <Tabs value={frequencyTab} onValueChange={(v) => setFrequencyTab(v as any)}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="all" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Todas
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="h-4 w-4" />
              Diárias
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Semanais
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterClient={filterClient}
          onClientChange={setFilterClient}
          clients={clients}
        />

        <TaskStats
          pending={stats.pending}
          inProgress={stats.in_progress}
          completed={stats.completed}
        />

        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTask === task.id}
              onToggleExpand={() => setExpandedTask(
                expandedTask === task.id ? null : task.id
              )}
              onToggleChecklistItem={handleChecklistToggle}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-muted-foreground">
              {tasks.length === 0 
                ? "As tarefas serão geradas automaticamente toda semana"
                : "Ajuste os filtros para ver outras tarefas"
              }
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
