import React, { useCallback, useMemo } from "react";
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

const FALLBACK_STATUS = { label: "Desconhecido", color: "!bg-slate-50 !text-slate-700 border-slate-200" };

export default function Billing() {
  const { profile } = useAuth();
  const { subscription, isLoading, isPortalLoading, isSubscriptionActive, currentPlan, openPortal } = useBilling();
  const navigate = useNavigate();

  const statusInfo = useMemo(() => {
    if (!subscription?.status) return null;
    return STATUS_LABELS[subscription.status] || { label: subscription.status, color: FALLBACK_STATUS.color };
  }, [subscription?.status]);

  const periodEnd = useMemo(() => {
    if (!subscription?.current_period_end) return null;
    try {
      return new Date(subscription.current_period_end).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [subscription?.current_period_end]);

  const handleOpenPortal = useCallback(async () => {
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

  // Quando não há assinatura ativa, direciona para página de planos
  if (!isSubscriptionActive) {
    return (
      <AppLayout title="Faturamento" subtitle="Gerencie seu plano e assinatura">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Você ainda não possui uma assinatura ativa</h2>
                <p className="text-slate-600">
                  Para liberar todos os recursos e limites do seu plano, escolha um plano na página de preços.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={handleGoPricing} className="h-11 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700">
                Ver planos <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open("https://wa.me/", "_blank")}
                className="h-11 rounded-xl bg-white border-slate-200"
              >
                Falar com suporte <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const planLabel = getPlanLabel(currentPlan);

  return (
    <AppLayout title="Faturamento" subtitle="Gerencie seu plano e assinatura">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>

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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500 mb-1">Limite de clientes</div>
              <div className="font-bold text-slate-900">{formatClientLimit(profile?.clients_limit)}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Próxima renovação
              </div>
              <div className="font-bold text-slate-900">{periodEnd || "—"}</div>
            </div>
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
