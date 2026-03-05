import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
  Loader2,
  Copy,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { getBusinessTypeLabel } from "@/config/plans";
import {
  computeClientAudit,
  getClassificationColor,
  getScoreColor,
  getProgressColor,
  type AuditItem,
} from "@/lib/auditScore";
import { toast } from "sonner";

type Client = Database["public"]["Tables"]["clients"]["Row"];

// ✅ mesmo padrão do app (evita bug no domingo e evita timezone zoado)
function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday (domingo volta 6 dias)
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

function safeUUID() {
  // crypto.randomUUID é suportado na maioria dos browsers modernos
  // fallback simples pra não quebrar
  // @ts-ignore
  if (typeof crypto !== "undefined" && crypto?.randomUUID) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function StatusIcon({ status }: { status: AuditItem["status"] }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
  if (status === "missing") return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
  return <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />;
}

function StatusLabel({ status }: { status: AuditItem["status"] }) {
  if (status === "ok")
    return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">OK</span>;
  if (status === "missing")
    return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Falta</span>;
  return <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">N/D</span>;
}

export default function AuditClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();

      if (error) throw error;
      if (isMountedRef.current) setClient(data);
    } catch (err) {
      console.error("Error fetching client:", err);
      if (isMountedRef.current) setClient(null);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!user) return;
    fetchClient();
  }, [user, fetchClient]);

  if (isLoading) {
    return (
      <AppLayout title="Auditoria" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando auditoria…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Auditoria" subtitle="Cliente não encontrado">
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Cliente não encontrado ou sem permissão.</p>
          <Button variant="outline" onClick={() => navigate("/audit")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const audit = computeClientAudit({
    place_id: (client as any).place_id,
    name: client.name,
    address: client.address,
    place_snapshot: (client as any).place_snapshot,
  });

  const missingActions = audit.items.filter((i) => i.status === "missing").map((i) => i.label);

  const handleCopyRecommendations = () => {
    const text = audit.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Recomendações copiadas!");
  };

  const handleGenerateTasks = async () => {
    try {
      setIsGenerating(true);

      // ✅ checklist no formato certo usado no app
      const checklist = audit.items
        .filter((i) => i.status === "missing")
        .map((i) => ({
          id: safeUUID(),
          text: i.tip || i.label,
          completed: false,
        }));

      if (checklist.length === 0) {
        toast.info("Nenhuma pendência encontrada para gerar tarefas.");
        return;
      }

      const weekStartStr = getWeekStartISO();

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          client_id: client.id,
          title: `Auditoria: Melhorar perfil Google (Score ${audit.score}/100)`,
          description: `Plano de ação gerado pela auditoria do perfil. ${checklist.length} itens a resolver.`,
          checklist: checklist as any,
          week_start: weekStartStr,
          status: "pending",
          frequency: "weekly",
          is_custom: true,
          task_date: null, // weekly
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;

      toast.success("Tarefa criada! Abrindo Tarefas…");

      // ✅ já abre a página de tarefas filtrada por esse cliente
      navigate(`/tasks?client=${client.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ? `Erro: ${err.message}` : "Erro ao criar tarefa.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout
      title={`Auditoria — ${client.name}`}
      subtitle="Análise do perfil Google Business"
      headerActions={
        <Button variant="outline" onClick={() => navigate("/audit")} className="rounded-xl border-slate-200">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      }
    >
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                    <ClientAvatar avatarUrl={(client as any).avatar_url} clientName={client.name} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{client.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs capitalize bg-slate-100 text-slate-600 border-slate-200"
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        {getBusinessTypeLabel(client.business_type)}
                      </Badge>
                      {(client as any).place_id && (
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Google vinculado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="flex items-baseline gap-1 justify-center md:justify-end">
                    <span className={`text-5xl font-black ${getScoreColor(audit.score)}`}>{audit.score}</span>
                    <span className="text-lg text-slate-400 font-semibold">/100</span>
                  </div>
                  <span
                    className={`inline-block mt-1 text-sm font-bold px-3 py-1 rounded-lg border ${getClassificationColor(
                      audit.classification,
                    )}`}
                  >
                    {audit.classification}
                  </span>
                  <div className="w-48 h-2.5 rounded-full bg-slate-100 overflow-hidden mt-3 mx-auto md:ml-auto md:mr-0">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(audit.score)}`}
                      style={{ width: `${audit.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        {audit.recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Principais Recomendações
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyRecommendations}
                    className="rounded-xl text-xs text-slate-500 hover:text-blue-600"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {audit.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-700 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100"
                    >
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Checklist */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Checklist da Auditoria</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-slate-100">
                {audit.items.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <StatusIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      {item.status === "missing" && <p className="text-xs text-slate-500 mt-0.5">{item.tip}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">peso {item.weight}</span>
                    <StatusLabel status={item.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick suggestions */}
        {missingActions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Sugestões Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {missingActions.map((action, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full"
                    >
                      <XCircle className="h-3 w-3" />
                      {action}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={handleGenerateTasks} className="rounded-xl shadow-md font-bold" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Gerar plano de ação
          </Button>
          <Button variant="outline" onClick={() => navigate("/audit")} className="rounded-xl border-slate-200">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
