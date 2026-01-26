import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskWithClient, ChecklistItem } from "@/hooks/useTasks";

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

interface TaskCardProps {
  task: TaskWithClient;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
}

export function TaskCard({ 
  task, 
  isExpanded, 
  onToggleExpand, 
  onToggleChecklistItem 
}: TaskCardProps) {
  const StatusIcon = statusConfig[task.status].icon;
  
  const getProgress = () => {
    if (task.checklist.length === 0) return 0;
    const completed = task.checklist.filter(item => item.completed).length;
    return Math.round((completed / task.checklist.length) * 100);
  };

  const progress = getProgress();
  const clientName = task.client?.name || "Cliente removido";

  const formatWeekStart = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { 
      day: "2-digit", 
      month: "short" 
    });
  };

  return (
    <motion.div
      layout
      className="rounded-xl bg-card border border-border overflow-hidden"
    >
      <div 
        className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={onToggleExpand}
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
              <span>{clientName}</span>
              <span>•</span>
              <span>Semana de {formatWeekStart(task.week_start)}</span>
              <span>•</span>
              <span>
                {task.checklist.filter(i => i.completed).length}/{task.checklist.length} itens
              </span>
            </div>
          </div>

          <div className="w-24 hidden sm:block">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
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
            className="border-t border-border"
          >
            <div className="p-4 bg-secondary/30">
              {task.description && (
                <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
              )}
              
              {task.checklist.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Checklist</h4>
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => onToggleChecklistItem(task.id, item.id)}
                        />
                        <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum item no checklist
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
