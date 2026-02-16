import { motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { PLANS, WHATSAPP_NUMBER, formatClientLimit } from "@/config/plans";

export default function Pricing() {
  const { profile, user } = useAuth();
  const currentPlan = profile?.plan || "starter";
  const userEmail = user?.email || "";

  const handleUpgrade = (planId: string, planName: string, planPrice: string, clientsLimit: string) => {
    const message = encodeURIComponent(
      `Olá! Quero contratar/upgrade no Gestão Nexus.\n\n` +
        `Plano de interesse: ${planName}\n` +
        `Preço: ${planPrice}/mês\n` +
        `Limite: ${clientsLimit}\n` +
        `Meu e-mail: ${userEmail}\n\n` +
        `Pode me ajudar com o processo?`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <AppLayout title="Planos e Assinaturas" subtitle="Escolha o plano ideal para o seu negócio">
      <div className="space-y-8">
        {/* Current Plan Banner */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1 text-slate-900">Seu plano atual</h3>
              <p className="text-slate-600">
                Você está no plano <span className="text-blue-600 font-semibold uppercase">{currentPlan}</span>
                {profile?.clients_limit && <span className="ml-2">({formatClientLimit(profile.clients_limit)})</span>}
              </p>
            </div>

            <Badge className="!bg-blue-50 !text-blue-700 border border-blue-200 text-sm px-4 py-1 rounded-full">
              {currentPlan === "starter" ? "Gratuito" : "Ativo"}
            </Badge>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {PLANS.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan;
            const PlanIcon = plan.icon;

            return (
              <motion.div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col shadow-sm !bg-white border-slate-200 relative ${
                  plan.highlighted ? "ring-2 ring-emerald-300" : ""
                } ${isCurrentPlan ? "ring-2 ring-blue-300" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="!bg-emerald-500 !text-white border border-emerald-400 rounded-full">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                      plan.highlighted ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <PlanIcon className={`h-4 w-4 ${plan.highlighted ? "text-emerald-600" : "text-slate-600"}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                </div>

                <div className="mb-3">
                  <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>

                <p className="text-xs text-slate-600 mb-4">{plan.description}</p>

                <ul className="space-y-2 mb-4 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl !bg-white !text-slate-700 border !border-slate-200"
                    size="sm"
                    disabled
                  >
                    Plano Atual
                  </Button>
                ) : plan.id === "starter" ? (
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl !bg-white !text-slate-700 border !border-slate-200"
                    size="sm"
                    disabled
                  >
                    Plano Gratuito
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    className={`w-full gap-2 h-9 rounded-xl ${
                      plan.highlighted
                        ? "!bg-emerald-500 !text-white hover:!bg-emerald-600"
                        : "!bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
                    }`}
                    size="sm"
                    onClick={() => handleUpgrade(plan.id, plan.name, plan.price, plan.clientsLimit)}
                  >
                    <MessageCircle className="h-3 w-3" />
                    Upgrade
                  </Button>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ or Additional Info */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 text-center shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-slate-600">
            Precisa de ajuda para escolher o plano ideal?{" "}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Fale conosco pelo WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
