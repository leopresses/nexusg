import { useState } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskStats } from "@/components/tasks/TaskStats";
import { TaskFilters } from "@/components/tasks/TaskFilters";

export default function Tasks() {
  const { tasks, clients, isLoading, stats, toggleChecklistItem } = useTasks();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterClient !== "all" && task.client_id !== filterClient) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <AppLayout title="Tarefas" subtitle="Gerencie todas as tarefas dos seus clientes">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Tarefas" 
      subtitle="Gerencie todas as tarefas dos seus clientes"
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
