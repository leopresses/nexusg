import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ClientTaskProgressProps {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export function ClientTaskProgress({ 
  pending, 
  inProgress, 
  completed, 
  total 
}: ClientTaskProgressProps) {
  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Nenhuma tarefa esta semana
      </p>
    );
  }

  const progress = Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progresso da semana</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full gradient-neon transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-warning" />
          {pending}
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-primary" />
          {inProgress}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-success" />
          {completed}
        </span>
      </div>
    </div>
  );
}
