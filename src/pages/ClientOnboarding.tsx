import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertTriangle, Rocket, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/AppLayout";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { useClientOnboarding } from "@/hooks/useClientOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

export default function ClientOnboarding() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { client, isLoading, computeProgress, updateSteps, refetch } = useClientOnboarding(clientId);
  const [generatingPlan, setGeneratingPlan] = useState(false);

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
          <Button variant="outline" onClick={() => navigate("/clients")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const progress = computeProgress();

  const handleGeneratePlan = async () => {
    if (!client) return;
    setGeneratingPlan(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        client_id: client.id,
        title: `Onboarding: Plano inicial de otimização`,
        description: `Tarefa criada pelo onboarding do cliente.`,
        checklist: [
          { id: crypto.randomUUID(), text: "Verificar dados do perfil Google", completed: false },
          { id: crypto.randomUUID(), text: "Completar informações do cliente", completed: false },
          { id: crypto.randomUUID(), text: "Configurar alertas de monitoramento", completed: false },
        ] as any,
        week_start: getWeekStartISO(),
        status: "pending",
        frequency: "weekly",
        is_custom: true,
      });
      if (error) throw error;
      await updateSteps({ plan_generated: true });
      toast.success("Plano de ação criado!");
    } catch (err: any) {
      console.error("[handleGeneratePlan]", err);
      toast.error("Erro ao criar plano. Tente novamente.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const steps = [
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
      onAction: () => navigate(`/audit/${client.id}`),
      showMarkDone: false,
    },
    {
      key: "audit_done" as const,
      title: "Rodar Auditoria",
      description: "Analise o perfil do cliente e identifique melhorias.",
      actionLabel: "Auditar",
      onAction: () => navigate(`/audit/${client.id}`),
      showMarkDone: true,
    },
    {
      key: "plan_generated" as const,
      title: "Gerar Plano de Ação",
      description: "Crie tarefas semanais baseadas na auditoria para otimizar o perfil.",
      actionLabel: "Gerar plano",
      onAction: handleGeneratePlan,
      showMarkDone: false,
    },
    {
      key: "alerts_enabled" as const,
      title: "Ativar Alertas",
      description: "Monitore quedas de performance e tarefas atrasadas automaticamente.",
      actionLabel: "Ver Alertas",
      onAction: () => navigate(`/alerts`),
      showMarkDone: true,
    },
    {
      key: "review_started" as const,
      title: "Gerenciar Avaliações",
      description: "Adicione ou responda avaliações de clientes.",
      actionLabel: "Ver Cliente",
      onAction: () => navigate(`/clients/${clientId}`),
      showMarkDone: true,
    },
  ];

  return (
    <AppLayout
      title={`Onboarding — ${client.name}`}
      subtitle="Configure tudo para começar a escalar"
      headerActions={
        <Button variant="outline" onClick={() => navigate("/clients")} className="rounded-xl border-slate-200">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      }
    >
      <div className="space-y-6 max-w-3xl">
        {/* Header com progresso */}
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

                <div className="w-full md:w-56">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-blue-600">{progress.percent}%</span>
                    {progress.percent >= 80 && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                        <Trophy className="h-3 w-3 mr-1" /> Pronto!
                      </Badge>
                    )}
                  </div>
                  <Progress value={progress.percent} className="h-2.5 bg-slate-100" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-600" />
                Passos do Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {steps.map((step, i) => (
                <OnboardingStepCard
                  key={step.key}
                  index={i + 1}
                  title={step.title}
                  description={step.description}
                  completed={progress.steps[step.key]}
                  actionLabel={step.actionLabel}
                  onAction={step.onAction}
                  showMarkDone={step.showMarkDone}
                  onMarkDone={() => updateSteps({ [step.key]: true })}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
