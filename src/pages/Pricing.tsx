import { motion } from "framer-motion";
import { Check, MessageCircle, Star } from "lucide-react";
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
          className="rounded-3xl !bg-white border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
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

          <Badge className="!bg-emerald-50 !text-emerald-700 border border-emerald-200 text-sm px-4 py-1.5 rounded-full font-bold">
            {currentPlan === "starter" ? "Gratuito" : "Assinatura Ativa"}
          </Badge>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
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
                className={`relative rounded-3xl border p-6 flex flex-col shadow-sm !bg-white transition-all duration-300 hover:shadow-md ${
                  plan.highlighted
                    ? "border-emerald-200 shadow-emerald-100/50 ring-1 ring-emerald-100"
                    : "border-slate-200"
                } ${isCurrentPlan ? "ring-2 ring-blue-500 border-blue-500 shadow-blue-100" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="!bg-emerald-500 !text-white border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-md shadow-emerald-200">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                      plan.highlighted ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <PlanIcon className={`h-5 w-5 ${plan.highlighted ? "text-emerald-600" : "text-slate-600"}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{plan.name}</h3>
                </div>

                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-xs font-medium uppercase">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[40px]">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2.5 text-xs font-medium text-slate-600">
                      <div
                        className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.highlighted ? "bg-emerald-100" : "bg-blue-50"
                        }`}
                      >
                        <Check className={`h-2.5 w-2.5 ${plan.highlighted ? "text-emerald-600" : "text-blue-600"}`} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl bg-slate-50 text-slate-400 border-slate-200 cursor-default hover:bg-slate-50"
                    disabled
                  >
                    Plano Atual
                  </Button>
                ) : plan.id === "starter" ? (
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl border-slate-200 text-slate-600 bg-white"
                    disabled
                  >
                    Plano Gratuito
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.id, plan.name, plan.price, plan.clientsLimit)}
                    className={`w-full h-10 rounded-xl gap-2 font-bold shadow-md transition-all ${
                      plan.highlighted
                        ? "!bg-emerald-500 !text-white hover:!bg-emerald-600 shadow-emerald-100"
                        : "!bg-blue-600 !text-white hover:!bg-blue-700 shadow-blue-100"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contratar
                  </Button>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ or Additional Info */}
        <motion.div
          className="rounded-3xl !bg-white border border-slate-200 p-8 text-center shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-slate-600 font-medium">
            Precisa de um plano personalizado para sua agência?{" "}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-bold inline-flex items-center gap-1 transition-colors"
            >
              Fale conosco pelo WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
