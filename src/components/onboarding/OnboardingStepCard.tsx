import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStepCardProps {
  index: number;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  onAction: () => void;
  showMarkDone?: boolean;
  onMarkDone?: () => void;
}

export function OnboardingStepCard({
  index,
  title,
  description,
  completed,
  actionLabel,
  onAction,
  showMarkDone,
  onMarkDone,
}: OnboardingStepCardProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        completed
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
      }`}
    >
      <div className="flex-shrink-0">
        {completed ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
            {index}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-bold ${completed ? "text-emerald-700" : "text-slate-900"}`}>{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {showMarkDone && !completed && onMarkDone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkDone}
            className="text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
          >
            Concluir
          </Button>
        )}
        {!completed && (
          <Button variant="outline" size="sm" onClick={onAction} className="rounded-xl border-slate-200 text-xs font-bold">
            {actionLabel} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
