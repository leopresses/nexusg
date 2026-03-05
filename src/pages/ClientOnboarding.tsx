import React, { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertTriangle, Rocket, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/AppLayout";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { useClientOnboarding } from "@/hooks/useClientOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

function safeUUID() {
  // Compatibilidade com browsers/ambientes que não suportam crypto.randomUUID
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ClientOnboarding() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const { client, isLoading, computeProgress, updateSteps, refetch } = useClientOnboarding(clientId);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const progress = useMemo(() => computeProgress(), [computeProgress]);

  const handleBack = useCallback(() => navigate("/clients"), [navigate]);

  const handleGeneratePlan = useCallback(async () => {
    if (!client) return;
    if (generatingPlan) return;

    setGeneratingPlan(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        client_id: client.id,
        title: "Onboarding: Plano inicial de otimização",
        description: "Tarefa criada pelo onboarding do cliente.",
        checklist: [
          { id: safeUUID(), text: "Verificar dados do perfil Google", completed: false },
          { id: safeUUID(), text: "Completar informações do cliente", completed: false },
          { id: safeUUID(), text: "Configurar alertas de monitoramento", completed: false },
        ] as any,
        week_start: getWeekStartISO(),
        status: "pending",
        frequency: "weekly",
        is_custom: true,
      });

      if (error) throw error;

      await updateSteps({ plan_generated: true });
      toast.success("Plano de ação criado!");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar plano.");
    } finally {
      setGeneratingPlan(false);
    }
  }, [client, generatingPlan, updateSteps, refetch]);

  const steps = useMemo(
    () => [
      {
        key: "google_connected" as const,
        title: "Conectar Google Business",
        description: "Vincule o Place ID do Google para sincronizar dados e avaliações.",
        actionLabel: "Conectar",
        onAction: () => navigate("/clients"),
        showMarkDone: false,
      },
      {
        key: "client_info_completed" as const,
        title: "Completar dados do cliente",
        description: "Preencha nome, endereço e informações adicionais do negócio.",
        actionLabel: "Editar cliente",
        onAction: () => navigate("/clients"),
        showMarkDone: false,
      },
      {
        key: "audit_ready" as const,
        title: "Preparar Auditoria",
        description: "Sincronize dados do Google ou complete as informações para auditar.",
        actionLabel: "Ver Auditoria",
        onAction: () => navigate(`/audit/${client?.id ?? ""}`),
        showMarkDone: false,
      },
      {
        key: "audit_done" as const,
        title: "Rodar Auditoria",
        description: "Analise o perfil do cliente e identifique melhorias.",
        actionLabel: "Auditar",
        onAction: () => navigate(`/audit/${client?.id ?? ""}`),
        showMarkDone: true,
      },
      {
        key: "plan_generated" as const,
        title: "Gerar Plano de Ação",
        description: "Crie tarefas semanais baseadas na auditoria para otimizar o perfil.",
        actionLabel: "Gerar plano",
        onAction: handleGeneratePlan,
        showMarkDone: false,
        isLoading: generatingPlan,
      },
      {
        key: "alerts_enabled" as const,
        title: "Ativar Alertas",
        description: "Monitore quedas de performance e tarefas atrasadas automaticamente.",
        actionLabel: "Ver Alertas",
        onAction: () => navigate("/alerts"),
        showMarkDone: true,
      },
      {
        key: "review_started" as const,
        title: "Gerenciar Avaliações",
        description: "Acompanhe as avaliações e reputação do cliente.",
        actionLabel: "Ver Cliente",
        onAction: () => navigate(`/clients/${clientId}`),
        showMarkDone: true,
      },
    ],
    [navigate, client?.id, clientId, handleGeneratePlan, generatingPlan],
  );

  if (isLoading) {
    return (
      <AppLayout title="Onboarding" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando onboarding…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Onboarding" subtitle="Cliente não encontrado">
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Cliente não encontrado.</p>
          <Button variant="outline" onClick={handleBack} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Onboarding — ${client.name}`}
      subtitle="Configure tudo para começar a escalar"
      headerActions={
        <Button variant="outline" onClick={handleBack} className="rounded-xl border-slate-200">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      }
    >
      <div className="space-y-6 max-w-3xl">
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
                    <p className="text-sm text-slate-500">
                      {progress.completed} de {progress.total} passos concluídos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Trophy className="h-3.5 w-3.5 mr-1" />
                    {progress.percent}%
                  </Badge>

                  {progress.percent === 100 ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <Rocket className="h-3.5 w-3.5 mr-1" />
                      Pronto!
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      Em andamento
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Progress value={progress.percent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-3">
          {steps.map((s) => (
            <OnboardingStepCard key={s.key} stepKey={s.key} step={s as any} client={client as any} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
