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
      <p className="text-xs text-slate-400 italic">
        Nenhuma tarefa esta semana
      </p>
    );
  }

  const progress = Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        {/* Ajustado: texto slate-500 para melhor leitura no branco */}
        <span className="text-slate-500 font-medium">Progresso da semana</span>
        <span className="font-bold text-slate-900">{progress}%</span>
      </div>
      
      {/* Ajustado: Fundo slate-100 (cinza claro) em vez de secondary */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div 
          {/* Ajustado: Substituído gradient-neon por um azul sólido e profissional */}
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-4 text-[11px] font-medium mt-1">
        <span className="flex items-center gap-1 text-slate-600">
          {/* Ajustado: Cores de ícones específicas para contraste no claro */}
          <Clock className="h-3 w-3 text-amber-500" />
          {pending}
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <AlertCircle className="h-3 w-3 text-blue-500" />
          {inProgress}
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          {completed}
        </span>
      </div>
    </div>
  );
}