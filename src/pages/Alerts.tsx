import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2, TrendingDown, Clock, Database, Filter, HelpCircle, X, TrendingUp, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useAlerts } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import type { AlertType } from "@/lib/alerts";
import { useHelpTutorial } from "@/hooks/useHelpTutorial";

const filterOptions: { label: string; value: AlertType | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Queda", value: "performance_drop" },
  { label: "Tarefas", value: "overdue_tasks" },
  { label: "Sem dados", value: "stale_data" },
];

export default function Alerts() {
  const { alerts, isLoading } = useAlerts();
  const [filter, setFilter] = useState<AlertType | "all">("all");
  const { isOpen: showTutorial, open: openTutorial, close: closeTutorial } = useHelpTutorial("/alerts");

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
    <AppLayout
      title="Alertas Inteligentes"
      subtitle="Monitoramento automático dos seus clientes"
      headerActions={
        <Button variant="ghost" size="icon" onClick={openTutorial} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50" title="Ver tutorial">
          <HelpCircle className="h-5 w-5" />
        </Button>
      }
    >
      <div className="space-y-6 relative">
        <AnimatePresence>
          {showTutorial && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-0 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2"><div className="bg-white/20 p-1.5 rounded-lg"><Bell className="h-4 w-4 text-white" /></div><h3 className="font-bold text-sm">Alertas Inteligentes</h3></div>
                <button onClick={closeTutorial} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3 text-sm text-blue-50">
                <p>Monitore automaticamente a saúde dos seus clientes:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2 items-start"><span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">1</span><span>Alertas de queda de performance detectados automaticamente.</span></li>
                  <li className="flex gap-2 items-start"><span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">2</span><span>Tarefas atrasadas que precisam de atenção.</span></li>
                  <li className="flex gap-2 items-start"><span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span><span>Use os filtros para focar no que importa.</span></li>
                </ul>
              </div>
              <div className="mt-4 flex justify-end"><button onClick={closeTutorial} className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">Entendi <ArrowRight className="h-3 w-3" /></button></div>
              <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
            </motion.div>
          )}
        </AnimatePresence>
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
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
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
