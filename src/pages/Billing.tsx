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
  const {
    subscription,
    isLoading,
    isPortalLoading,
    isSubscriptionActive,
    currentPlan,
    openPortal,
  } = useBilling();
  const navigate = useNavigate();

  const handleOpenPortal = async () => {
    try {
      await openPortal();
    } catch {
      toast.error("Erro ao abrir portal de assinatura.");
    }
  }, [openPortal]);

  const handleGoPricing = useCallback(() => {
    navigate("/pricing");
  }, [navigate]);

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
    <AppLayout title="Faturamento" subtitle="Gerencie seu plano e assinatura">
      <div className="max-w-3xl mx-auto space-y-6">
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
                <h2 className="text-lg font-bold text-slate-900 mb-1">Sua assinatura</h2>
                <p className="text-slate-600">Plano atual e status do pagamento</p>
              </div>
            </div>

            {statusInfo && (
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500 mb-1">Plano</div>
              <div className="font-bold text-slate-900">{planLabel}</div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Limite de clientes</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatClientLimit(profile?.clients_limit || 1)}
                </p>
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

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleOpenPortal}
              disabled={isPortalLoading}
              className="h-11 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
            >
              {isPortalLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Gerenciar assinatura
            </Button>

            <Button variant="outline" onClick={handleGoPricing} className="h-11 rounded-xl bg-white border-slate-200">
              Ver planos
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
