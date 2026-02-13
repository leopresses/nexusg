import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { TaskWithClient } from "@/hooks/useTasks";

type TaskStatus = "pending" | "in_progress" | "completed";

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-warning/20 text-warning border-warning/30",
    icon: Clock,
  },
  in_progress: {
    label: "Em progresso",
    color: "bg-primary/20 text-primary border-primary/30",
    icon: AlertCircle,
  },
  completed: {
    label: "Concluída",
    color: "bg-success/20 text-success border-success/30",
    icon: CheckCircle2,
  },
};

interface TaskCardProps {
  task: TaskWithClient;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

export function TaskCard({ task, isExpanded, onToggleExpand, onToggleChecklistItem, onStatusChange }: TaskCardProps) {
  const StatusIcon = statusConfig[task.status].icon;

  const getProgress = () => {
    if (task.checklist.length === 0) return 0;
    const completed = task.checklist.filter((item) => item.completed).length;
    return Math.round((completed / task.checklist.length) * 100);
  };

  const progress = getProgress();
  const clientName = task.client?.name || "Cliente removido";

  const formatWeekStart = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <motion.div layout className="rounded-2xl !bg-white border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 cursor-pointer hover:!bg-slate-50 transition-colors" onClick={onToggleExpand}>
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-slate-900">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-medium truncate text-slate-900">{task.title}</h3>
              <Badge variant="outline" className={statusConfig[task.status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[task.status].label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>{clientName}</span>
              <span>•</span>
              <span>Semana de {formatWeekStart(task.week_start)}</span>
              <span>•</span>
              <span>
                {task.checklist.filter((i) => i.completed).length}/{task.checklist.length} itens
              </span>
            </div>
          </div>

          <div className="w-24 hidden sm:block">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-500">Progresso</span>
              <span className="font-medium text-slate-900">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-neon"
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
            className="border-t border-slate-200"
          >
            <div className="p-4 !bg-slate-50">
              {/* Status Control */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 flex-wrap">
                <span className="text-sm font-medium text-slate-900">Alterar Status:</span>

                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant={task.status === "pending" ? "default" : "outline"}
                    className={
                      task.status === "pending"
                        ? "gap-1 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
                        : "gap-1 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
                    }
                    onClick={() => handleStatusChange("pending")}
                  >
                    <Clock className="h-3 w-3" />
                    Pendente
                  </Button>

                  <Button
                    size="sm"
                    variant={task.status === "in_progress" ? "default" : "outline"}
                    className={
                      task.status === "in_progress"
                        ? "gap-1 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
                        : "gap-1 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
                    }
                    onClick={() => handleStatusChange("in_progress")}
                  >
                    <AlertCircle className="h-3 w-3" />
                    Em Progresso
                  </Button>

                  <Button
                    size="sm"
                    variant={task.status === "completed" ? "default" : "outline"}
                    className={
                      task.status === "completed"
                        ? "gap-1 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
                        : "gap-1 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
                    }
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Concluída
                  </Button>
                </div>
              </div>

              {task.description && <p className="text-sm text-slate-600 mb-4">{task.description}</p>}

              {task.checklist.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium mb-3 text-slate-600">Checklist</h4>

                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:!bg-slate-100 cursor-pointer transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => onToggleChecklistItem(task.id, item.id)}
                        />
                        <span className={item.completed ? "line-through text-slate-500" : "text-slate-900"}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-600 italic">Nenhum item no checklist</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
