import { motion } from "framer-motion";
import { CreditCard, ExternalLink, Loader2, Calendar, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { useBilling } from "@/hooks/useBilling";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getPlanLabel, formatClientLimit } from "@/config/plans";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Ativa", color: "!bg-emerald-50 !text-emerald-700 border-emerald-200" },
  trialing: { label: "Período de teste", color: "!bg-blue-50 !text-blue-700 border-blue-200" },
  past_due: { label: "Pagamento pendente", color: "!bg-amber-50 !text-amber-700 border-amber-200" },
  canceled: { label: "Cancelada", color: "!bg-red-50 !text-red-700 border-red-200" },
  unpaid: { label: "Não paga", color: "!bg-red-50 !text-red-700 border-red-200" },
};

export default function Billing() {
  const { profile } = useAuth();
  const { subscription, isLoading, isPortalLoading, isSubscriptionActive, currentPlan, openPortal } = useBilling();
  const navigate = useNavigate();

  const handleOpenPortal = async () => {
    try {
      await openPortal();
    } catch {
      toast.error("Erro ao abrir portal de assinatura.");
    }
  };

  const hasPaidPlan = currentPlan !== "starter";

  const fallbackStatus = hasPaidPlan
    ? {
        label: "Pago",
        color: "!bg-emerald-50 !text-emerald-700 border-emerald-200",
      }
    : {
        label: "Gratuito",
        color: "!bg-slate-100 !text-slate-600 border-slate-200",
      };

  const statusInfo = subscription?.status
    ? STATUS_LABELS[subscription.status] || {
        label: subscription.status,
        color: "!bg-slate-50 !text-slate-700 border-slate-200",
      }
    : fallbackStatus;

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  if (isLoading) {
    return (
      <AppLayout title="Faturamento">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Faturamento" subtitle="Gerencie sua assinatura e plano">
      <div className="max-w-2xl space-y-6">
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Plano Atual</h2>
              <p className="text-sm text-slate-500">Detalhes da sua assinatura</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Plano</p>
                <p className="text-lg font-bold text-slate-900">{getPlanLabel(currentPlan)}</p>
              </div>

              <Badge className={`${statusInfo.color} border text-sm px-3 py-1 rounded-full font-bold`}>
                {statusInfo.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Limite de clientes</p>
                <p className="text-lg font-bold text-slate-900">{formatClientLimit(profile?.clients_limit || 1)}</p>
              </div>
              <Shield className="h-5 w-5 text-slate-400" />
            </div>

            {periodEnd && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm text-slate-500">Próxima renovação</p>
                  <p className="text-lg font-bold text-slate-900">{periodEnd}</p>
                </div>
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-slate-900 mb-4">Ações</h3>
          <div className="space-y-3">
            {isSubscriptionActive && currentPlan !== "starter" && (
              <Button
                onClick={handleOpenPortal}
                disabled={isPortalLoading}
                className="w-full h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 font-bold gap-2"
              >
                {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Gerenciar assinatura
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="w-full h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              {currentPlan === "starter" ? "Fazer upgrade" : "Alterar plano"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
