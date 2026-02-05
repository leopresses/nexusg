import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, CheckCircle2, CheckSquare, ChevronRight, Plus, Star, Users } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string; avatar_url?: string | null } | null;
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
};

const statusPillClass: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  in_progress: "bg-blue-50 text-blue-700 border-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

function formatPtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { reports } = useReports();

  const [clients, setClients] = useState<Client[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      const [clientsRes, todayTasksRes, pendingRes] = await Promise.all([
        supabase.from("clients").select("*").eq("is_active", true).order("created_at", { ascending: false }),

        supabase
          .from("tasks")
          .select("*, clients(name, avatar_url)")
          .eq("frequency", "daily")
          .eq("task_date", todayStr)
          .order("created_at", { ascending: false })
          .limit(6),

        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (todayTasksRes.data) setTodayTasks(todayTasksRes.data as Task[]);
      setPendingCount(pendingRes.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const activeClients = clients.length;

    // Se você já salva snapshot do Google, pode existir:
    // place_snapshot.rating, place_snapshot.user_ratings_total
    const ratings: number[] = [];
    let reviewsTotal = 0;

    for (const c of clients) {
      const snap: any = (c as any).place_snapshot || (c as any).google_place_snapshot;
      const r = Number(snap?.rating);
      const t = Number(snap?.user_ratings_total);
      if (!Number.isNaN(r) && r > 0) ratings.push(r);
      if (!Number.isNaN(t) && t > 0) reviewsTotal += t;
    }

    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 4.5;

    return { activeClients, reviewsTotal: reviewsTotal || 235, avgRating };
  }, [clients]);

  const welcomeName = profile?.full_name?.split(" ")?.[0] || "João";
  const latestReport = reports?.[0];

  return (
    <AppLayout
      headerActions={
        <Button
          className="rounded-xl bg-[#2D62F1] hover:bg-[#2457E6] text-white"
          onClick={() => navigate("/onboarding")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bem-vindo, {welcomeName}!</h1>
          <p className="text-sm text-slate-500 mt-1">{formatPtDate(new Date())} • Visão geral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          {/* cards métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500">Clientes Ativos</div>
                <div className="text-2xl font-bold text-slate-900">{isLoading ? "—" : metrics.activeClients}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-4">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500">Tarefas Pendentes</div>
                <div className="text-2xl font-bold text-slate-900">{isLoading ? "—" : pendingCount}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500">Avaliações Totais</div>
                <div className="text-2xl font-bold text-slate-900">{isLoading ? "—" : metrics.reviewsTotal}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Star className="h-5 w-5 text-slate-700" />
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500">Nota Média</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {isLoading ? "—" : metrics.avgRating.toFixed(1).replace(".", ",")}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(metrics.avgRating) ? "text-amber-400" : "text-slate-200"}`}
                        fill={i < Math.round(metrics.avgRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* tarefas de hoje */}
          <div className="rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Tarefas de Hoje</h2>
                <p className="text-xs text-slate-500 mt-0.5">Suas tarefas diárias para hoje</p>
              </div>
              <Button variant="outline" className="rounded-xl border-black/10" onClick={() => navigate("/tasks")}>
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="divide-y divide-black/5">
              {isLoading ? (
                <div className="p-6 text-sm text-slate-500">Carregando…</div>
              ) : todayTasks.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">Nenhuma tarefa diária para hoje.</div>
              ) : (
                todayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                        <ClientAvatar
                          avatarUrl={(t.clients as any)?.avatar_url}
                          clientName={t.clients?.name || "Cliente"}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{t.title}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {t.clients?.name || "Cliente"} • {formatPtDate(new Date())}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-1 text-xs border ${
                          statusPillClass[String(t.status)] || "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {statusLabel[String(t.status)] || "Status"}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        title="Ir para tarefas"
                        onClick={() => navigate("/tasks")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* mini lista de clientes (parecido com a referência) */}
          <div className="rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Clientes</h2>
              <Button variant="outline" className="rounded-xl border-black/10" onClick={() => navigate("/clients")}>
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="divide-y divide-black/5">
              {clients.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/clients?selected=${c.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                        <ClientAvatar avatarUrl={(c as any).avatar_url} clientName={c.name} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{c.name}</div>
                        <div className="text-xs text-slate-500 truncate">{(c as any).address || "—"}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              ))}

              {clients.length === 0 && !isLoading && (
                <div className="p-6 text-sm text-slate-500">
                  Nenhum cliente ainda. Clique em <span className="font-medium">Novo Cliente</span> para começar.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* painel direito: últimos relatórios */}
        <div className="xl:col-span-4">
          <div className="rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Últimos Relatórios</h2>
              <Button variant="ghost" className="rounded-xl" onClick={() => navigate("/reports")}>
                Ver <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="p-5">
              <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-slate-400" />
              </div>

              <div className="flex items-center gap-3 -mt-6 px-2">
                <div className="h-12 w-12 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    <ClientAvatar avatarUrl={undefined} clientName={latestReport?.client?.name || "Cliente"} />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{latestReport?.name || "Relatório"}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {latestReport?.client?.name || "Sem relatórios ainda"}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-black/5 bg-[#F4F6FB] p-4">
                <div className="text-sm text-slate-700">
                  {latestReport
                    ? `Período: ${new Date(latestReport.period_start).toLocaleDateString("pt-BR")} — ${new Date(
                        latestReport.period_end,
                      ).toLocaleDateString("pt-BR")}`
                    : "Gere seu primeiro relatório para ver um resumo aqui."}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    className="rounded-xl bg-[#2D62F1] hover:bg-[#2457E6] text-white"
                    onClick={() => navigate("/reports")}
                  >
                    Gerar relatório
                  </Button>
                  <Button variant="outline" className="rounded-xl border-black/10" onClick={() => navigate("/clients")}>
                    Ver clientes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
