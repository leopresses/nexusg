import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, PlayCircle } from "lucide-react";

interface ProgressBarProps {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
  label?: string;
}

export function ProgressBar({
  pending,
  inProgress,
  completed,
  total,
  label = "Progresso",
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {completed}/{total} ({percentage}%)
        </span>
      </div>
      
      <Progress value={percentage} className="h-3" />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-warning" />
          <span>{pending} pendentes</span>
        </div>
        <div className="flex items-center gap-1">
          <PlayCircle className="h-3 w-3 text-primary" />
          <span>{inProgress} em progresso</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-success" />
          <span>{completed} concluídas</span>
        </div>
      </div>
    </div>
  );
}
