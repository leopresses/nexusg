import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, PlayCircle } from "lucide-react";

interface ProgressBarProps {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
  label?: string;
}

export function ProgressBar({ pending, inProgress, completed, total, label = "Progresso" }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {/* Ajustado: Texto slate-900 para destaque no tema claro */}
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <span className="text-sm text-slate-500 font-semibold">
          {completed}/{total} ({percentage}%)
        </span>
      </div>

      {/* Ajustado: Fundo da barra em cinza bem claro e barra de progresso azul forte */}
      <Progress value={percentage} className="h-3 bg-slate-100 border border-slate-200" />

      <div className="flex items-center justify-between text-[11px] font-medium">
        <div className="flex items-center gap-1 text-slate-600">
          {/* Ajustado: Cores específicas para os ícones no tema claro */}
          <Clock className="h-3 w-3 text-amber-500" />
          <span>{pending} pendentes</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <PlayCircle className="h-3 w-3 text-blue-500" />
          <span>{inProgress} em progresso</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          <span>{completed} concluídas</span>
        </div>
      </div>
    </div>
  );
}
