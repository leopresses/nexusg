import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2, TrendingDown, Clock, Database, Filter } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useAlerts } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import type { AlertType } from "@/lib/alerts";

const filterOptions: { label: string; value: AlertType | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Queda", value: "performance_drop" },
  { label: "Tarefas", value: "overdue_tasks" },
  { label: "Sem dados", value: "stale_data" },
];

export default function Alerts() {
  const { alerts, isLoading } = useAlerts();
  const [filter, setFilter] = useState<AlertType | "all">("all");

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  // Group by client
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, alert) => {
    if (!acc[alert.clientId]) acc[alert.clientId] = [];
    acc[alert.clientId].push(alert);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <AppLayout title="Alertas Inteligentes" subtitle="Monitoramento automático">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando alertas…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Alertas Inteligentes" subtitle="Monitoramento automático dos seus clientes">
      <div className="space-y-6">
        {/* Filters */}
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "default" : "outline"}
              size="sm"
              className={`rounded-xl ${
                filter === opt.value
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </motion.div>

        {/* Content */}
        {filtered.length === 0 ? (
          <motion.div
            className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum alerta encontrado</h3>
            <p className="text-sm text-slate-500">Tudo parece estar bem com seus clientes.</p>
          </motion.div>
        ) : (
          Object.entries(grouped).map(([clientId, clientAlerts], idx) => (
            <motion.div
              key={clientId}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold">{clientAlerts[0].clientName}</h3>
                <span className="text-xs text-slate-400">({clientAlerts.length} alerta{clientAlerts.length > 1 ? "s" : ""})</span>
              </div>
              <div className="p-4 space-y-3">
                {clientAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
