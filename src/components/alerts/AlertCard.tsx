import { AlertTriangle, Clock, TrendingDown, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AlertItem, AlertSeverity, AlertType } from "@/lib/alerts";

const severityStyles: Record<AlertSeverity, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

const severityLabels: Record<AlertSeverity, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Info",
};

const typeIcons: Record<AlertType, React.ElementType> = {
  performance_drop: TrendingDown,
  overdue_tasks: Clock,
  stale_data: Database,
};

interface AlertCardProps {
  alert: AlertItem;
  compact?: boolean;
}

export function AlertCard({ alert, compact = false }: AlertCardProps) {
  const Icon = typeIcons[alert.type];

  if (compact) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
        <div className={`mt-0.5 p-1.5 rounded-lg ${severityStyles[alert.severity]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <p className="text-xs text-slate-500 truncate">{alert.clientName}</p>
        </div>
        <Badge className={`text-[10px] border rounded-full shrink-0 ${severityStyles[alert.severity]}`}>
          {severityLabels[alert.severity]}
        </Badge>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${severityStyles[alert.severity]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <Badge className={`text-[10px] border rounded-full ${severityStyles[alert.severity]}`}>
              {severityLabels[alert.severity]}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{alert.description}</p>
          <p className="text-xs text-slate-400 mt-1">{alert.clientName}</p>
        </div>
      </div>
    </div>
  );
}
