import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageCircle, Star, HelpCircle, X, ArrowRight, CreditCard, Zap, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useBilling } from "@/hooks/useBilling";
import { PLANS, formatClientLimit } from "@/config/plans";
import { isPaidPlan } from "@/config/stripe";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export default function Pricing() {
  const { profile, user } = useAuth();
  const {
    subscription,
    isSubscriptionActive,
    currentPlan,
    isCheckoutLoading,
    isPortalLoading,
    createCheckout,
    openPortal,
    refreshSubscription,
  } = useBilling();
  const userEmail = user?.email || "";
  const [searchParams] = useSearchParams();

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("pricing_tutorial_seen");
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, []);

  // Handle success/cancel redirects
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso! Seu plano será atualizado em instantes.");
      // Refresh subscription data after a short delay
      setTimeout(() => refreshSubscription(), 3000);
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado.");
    }
  }, [searchParams]);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("pricing_tutorial_seen", "true");
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await createCheckout(planId);
    } catch {
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openPortal();
    } catch {
      toast.error("Erro ao abrir portal de assinatura.");
    }
  };

  const hasPaidSubscription = isSubscriptionActive && currentPlan !== "starter";

  return (
    <AppLayout
      title="Planos e Assinaturas"
      subtitle="Escolha o plano ideal para o seu negócio"
      headerActions={
        <div className="flex items-center gap-2 relative">
          {hasPaidSubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
              Gerenciar assinatura
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTutorial(true)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
            title="Como funciona?"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-14 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm">Entenda seus Planos</h3>
                  </div>
                  <button
                    onClick={closeTutorial}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3 text-sm text-blue-50">
                  <ul className="space-y-2 list-none">
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">1</span>
                      <span>Seu plano atual aparece em destaque no topo.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">2</span>
                      <span>Clique em "Assinar" para fazer upgrade via pagamento seguro.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">3</span>
                      <span>Use "Gerenciar assinatura" para alterar ou cancelar.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeTutorial}
                    className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    Entendi <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="absolute -top-2 right-3 w-4 h-4 bg-blue-600 rotate-45 transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Banner do Plano Atual */}
        <motion.div
          className="rounded-3xl !bg-white border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
              <Star className="h-6 w-6 text-blue-600 fill-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900">Seu plano atual</h3>
              <p className="text-slate-600 mt-1">
                Você está no plano{" "}
                <span className="text-blue-600 font-bold uppercase tracking-wide">{currentPlan}</span>
                {profile?.clients_limit && (
                  <span className="ml-2 text-slate-400">({formatClientLimit(profile.clients_limit)})</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="!bg-emerald-50 !text-emerald-700 border border-emerald-200 text-sm px-4 py-1.5 rounded-full font-bold whitespace-nowrap">
              {isSubscriptionActive && currentPlan !== "starter"
                ? "Assinatura Ativa"
                : currentPlan === "starter"
                  ? "Gratuito"
                  : subscription?.status === "past_due"
                    ? "Pagamento Pendente"
                    : "Inativo"}
            </Badge>
            {hasPaidSubscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerenciar"}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Grid de Planos */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {PLANS.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan;
            const PlanIcon = plan.icon;
            const hasStripePrice = !!STRIPE_PRICE_MAP[plan.id];

            return (
              <motion.div
                key={plan.id}
                className={`group relative flex flex-col h-full rounded-2xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                  ${plan.highlighted ? "border-emerald-500 ring-1 ring-emerald-500 shadow-emerald-50/50 z-10" : "border-slate-200 hover:border-blue-200"} 
                  ${isCurrentPlan ? "ring-2 ring-blue-500 border-blue-500 shadow-blue-50" : ""}
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max">
                    <Badge className="!bg-emerald-500 !text-white border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-md">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${
                        plan.highlighted
                          ? "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100"
                          : "bg-slate-50 border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100"
                      }`}
                    >
                      <PlanIcon className={`h-5 w-5 ${plan.highlighted ? "text-emerald-600" : "text-slate-600 group-hover:text-blue-600"}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                      <span className="text-slate-400 text-xs font-medium uppercase">{plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[40px]">{plan.description}</p>
                  </div>

                  <div className="h-px bg-slate-100 w-full mb-6" />

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2.5 text-xs font-medium text-slate-600">
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            plan.highlighted ? "bg-emerald-100" : "bg-blue-50"
                          }`}
                        >
                          <Check className={`h-2.5 w-2.5 ${plan.highlighted ? "text-emerald-600" : "text-blue-600"}`} />
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <Button
                        variant="outline"
                        className="w-full h-10 rounded-xl bg-slate-50 text-slate-400 border-slate-200 cursor-default hover:bg-slate-50 font-bold"
                        disabled
                      >
                        Plano Atual
                      </Button>
                    ) : plan.id === "starter" ? (
                      <Button
                        variant="outline"
                        className="w-full h-10 rounded-xl border-slate-200 text-slate-600 bg-white font-bold hover:bg-slate-50"
                        disabled
                      >
                        Plano Gratuito
                      </Button>
                    ) : hasStripePrice ? (
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isCheckoutLoading}
                        className={`w-full h-10 rounded-xl gap-2 font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          plan.highlighted
                            ? "!bg-emerald-600 !text-white hover:!bg-emerald-700 shadow-emerald-100"
                            : "!bg-blue-600 !text-white hover:!bg-blue-700 shadow-blue-100"
                        }`}
                      >
                        {isCheckoutLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Assinar
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full h-10 rounded-xl" disabled>
                        Indisponível
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ Area */}
        <motion.div
          className="rounded-3xl !bg-white border border-slate-200 p-8 text-center shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
              <Zap className="h-5 w-5" />
            </div>
            <p className="text-slate-600 font-medium">
              Precisa de ajuda com sua assinatura?{" "}
              <button
                onClick={handleManageSubscription}
                disabled={!hasPaidSubscription || isPortalLoading}
                className="text-blue-600 hover:text-blue-700 hover:underline font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Acesse o portal de assinatura
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
