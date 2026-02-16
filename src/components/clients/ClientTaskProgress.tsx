import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ClientTaskProgressProps {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export function ClientTaskProgress({ pending, inProgress, completed, total }: ClientTaskProgressProps) {
  if (total === 0) {
    return <p className="text-xs text-slate-400 italic">Nenhuma tarefa esta semana</p>;
  }

  const progress = Math.round((completed / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
        <span className="text-slate-500">Progresso Semanal</span>
        {/* Texto do percentual também em verde para combinar com a barra */}
        <span className="text-emerald-600">{progress}%</span>
      </div>

      {/* Barra de Progresso ajustada para VERDE */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className="h-full !bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Legenda de Status */}
      <div className="flex items-center gap-4 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-slate-600">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          {pending}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
          {inProgress}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {completed}
        </span>
      </div>
    </div>
  );
}
