import { motion } from "framer-motion";
import { CheckSquare, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string; avatar_url?: string | null } | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em progresso",
  completed: "Concluído",
};

interface TodayTasksCardProps {
  tasks: Task[];
  totalTasks: number;
}

export function TodayTasksCard({ tasks, totalTasks }: TodayTasksCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg font-display">Tarefas de Hoje</h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/tasks")}>
          Ver todas
        </Button>
      </div>

      {/* Task list */}
      <div className="divide-y divide-border">
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Sem tarefas para hoje</p>
            <p className="text-xs text-muted-foreground">Suas tarefas aparecerão aqui</p>
          </div>
        ) : (
          tasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => navigate("/tasks")}
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                <ClientAvatar
                  avatarUrl={(task.clients as any)?.avatar_url ?? null}
                  clientName={task.clients?.name || "C"}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.clients?.name || "Cliente"}
                </p>
              </div>

              {/* Date */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Calendar className="h-3 w-3" />
                {task.task_date
                  ? new Date(task.task_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : "—"}
              </div>

              {/* Status */}
              <Badge
                variant="outline"
                className={`text-xs flex-shrink-0 ${statusColors[task.status] || ""}`}
              >
                {statusLabels[task.status] || task.status}
              </Badge>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {totalTasks > 6 && (
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => navigate("/tasks")}>
            Ver todas ({totalTasks} tarefas)
          </Button>
        </div>
      )}
    </motion.div>
  );
}
