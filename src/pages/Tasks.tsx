import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckSquare, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskStats } from "@/components/tasks/TaskStats";
import { TaskFilters } from "@/components/tasks/TaskFilters";

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const clientFromUrl = searchParams.get("client");
  
  const { tasks, clients, isLoading, toggleChecklistItem, updateTaskStatus } = useTasks();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>(clientFromUrl || "all");
  const [searchQuery, setSearchQuery] = useState("");

  // Update filter when URL changes
  useEffect(() => {
    if (clientFromUrl) {
      setFilterClient(clientFromUrl);
    }
  }, [clientFromUrl]);

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
      
      // Filter by search query
      if (searchQuery) {
        if (!task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      return true;
    });
  }, [tasks, filterClient, filterStatus, searchQuery]);

  // Calculate stats based on filtered tasks (when client is selected) or all tasks
  const stats = useMemo(() => {
    const tasksToCount = filterClient !== "all" 
      ? tasks.filter(t => t.client_id === filterClient)
      : tasks;
    
    return {
      pending: tasksToCount.filter(t => t.status === "pending").length,
      in_progress: tasksToCount.filter(t => t.status === "in_progress").length,
      completed: tasksToCount.filter(t => t.status === "completed").length,
    };
  }, [tasks, filterClient]);

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
    >
      <div className="space-y-6">
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
              onToggleChecklistItem={toggleChecklistItem}
              onStatusChange={updateTaskStatus}
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
    </AppLayout>
  );
}
