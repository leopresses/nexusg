export type AlertType = "performance_drop" | "overdue_tasks" | "stale_data";
export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertItem {
  id: string;
  clientId: string;
  clientName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  value?: number;
  createdAt: string;
}

interface MetricRow {
  client_id: string;
  date: string;
  views: number | null;
  calls: number | null;
  directions: number | null;
  website_clicks: number | null;
  messages: number | null;
}

interface TaskRow {
  client_id: string;
  status: string;
  week_start: string;
  frequency: string | null;
}

interface ClientRow {
  id: string;
  name: string;
}

const DROP_THRESHOLD = 0.3; // 30%
const CRITICAL_THRESHOLD = 0.5; // 50%
const STALE_DAYS = 5;

function getSeverityFromDrop(drop: number): AlertSeverity {
  return drop >= CRITICAL_THRESHOLD ? "critical" : "warning";
}

function sumMetric(rows: MetricRow[], key: keyof Pick<MetricRow, "views" | "calls" | "directions">): number | null {
  let sum = 0;
  let hasAny = false;
  for (const r of rows) {
    const v = r[key];
    if (v != null) { sum += v; hasAny = true; }
  }
  return hasAny ? sum : null;
}

const metricLabels: Record<string, string> = {
  views: "visualizações",
  calls: "ligações",
  directions: "direções",
};

export function computeAlerts({
  clients,
  metrics,
  tasks,
}: {
  clients: ClientRow[];
  metrics: MetricRow[];
  tasks: TaskRow[];
}): AlertItem[] {
  const alerts: AlertItem[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  for (const client of clients) {
    const clientMetrics = metrics.filter((m) => m.client_id === client.id);
    const clientTasks = tasks.filter((t) => t.client_id === client.id);

    // --- A) Performance drop (last 7d vs previous 7d) ---
    const d7ago = new Date(today);
    d7ago.setDate(d7ago.getDate() - 7);
    const d14ago = new Date(today);
    d14ago.setDate(d14ago.getDate() - 14);

    const recent = clientMetrics.filter((m) => m.date >= d7ago.toISOString().split("T")[0] && m.date <= todayStr);
    const previous = clientMetrics.filter((m) => m.date >= d14ago.toISOString().split("T")[0] && m.date < d7ago.toISOString().split("T")[0]);

    for (const key of ["views", "calls", "directions"] as const) {
      const recentSum = sumMetric(recent, key);
      const prevSum = sumMetric(previous, key);
      if (recentSum != null && prevSum != null && prevSum > 0) {
        const drop = (prevSum - recentSum) / prevSum;
        if (drop >= DROP_THRESHOLD) {
          const pct = Math.round(drop * 100);
          alerts.push({
            id: `perf-${client.id}-${key}`,
            clientId: client.id,
            clientName: client.name,
            type: "performance_drop",
            severity: getSeverityFromDrop(drop),
            title: `Queda de ${pct}% em ${metricLabels[key]}`,
            description: `Últimos 7 dias vs 7 dias anteriores para ${client.name}.`,
            value: pct,
            createdAt: todayStr,
          });
        }
      }
    }

    // --- B) Overdue tasks ---
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + mondayOffset);
    const cwsStr = currentWeekStart.toISOString().split("T")[0];

    const overdue = clientTasks.filter(
      (t) => t.week_start <= cwsStr && t.status !== "completed"
    );
    if (overdue.length > 0) {
      alerts.push({
        id: `tasks-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        type: "overdue_tasks",
        severity: overdue.length >= 5 ? "critical" : "warning",
        title: `Tarefas pendentes: ${overdue.length}`,
        description: `${client.name} possui ${overdue.length} tarefa(s) não concluída(s).`,
        value: overdue.length,
        createdAt: todayStr,
      });
    }

    // --- C) Stale data ---
    if (clientMetrics.length === 0) {
      alerts.push({
        id: `stale-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        type: "stale_data",
        severity: "info",
        title: `Sem novas métricas há ${STALE_DAYS}+ dias`,
        description: `Nenhum dado recente de métricas para ${client.name}.`,
        createdAt: todayStr,
      });
    } else {
      const latestDate = clientMetrics.reduce((max, m) => (m.date > max ? m.date : max), "");
      const staleDate = new Date(today);
      staleDate.setDate(staleDate.getDate() - STALE_DAYS);
      if (latestDate < staleDate.toISOString().split("T")[0]) {
        alerts.push({
          id: `stale-${client.id}`,
          clientId: client.id,
          clientName: client.name,
          type: "stale_data",
          severity: "info",
          title: `Sem novas métricas há ${STALE_DAYS}+ dias`,
          description: `Última métrica registrada em ${latestDate} para ${client.name}.`,
          createdAt: todayStr,
        });
      }
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
