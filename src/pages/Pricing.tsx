import { motion } from "framer-motion";
import { Check, MessageCircle, Sparkles } from "lucide-react";
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
          className="rounded-2xl bg-secondary border border-border p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display font-semibold text-lg mb-1 text-foreground">Seu plano atual</h3>
              <p className="text-muted-foreground">
                Você está no plano{" "}
                <span className="text-gradient-neon font-semibold uppercase">{currentPlan}</span>
                {profile?.clients_limit && (
                  <span className="ml-2 text-muted-foreground">
                    ({formatClientLimit(profile.clients_limit)})
                  </span>
                )}
              </p>
            </div>
            <Badge variant="gold" className="text-sm px-4 py-1">
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
                className={`rounded-2xl border p-5 flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-card border-primary shadow-neon relative"
                    : "bg-card border-border hover:border-muted-foreground/30"
                } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gold" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      plan.highlighted ? "gradient-neon shadow-neon" : "bg-secondary"
                    }`}
                  >
                    <PlanIcon
                      className={`h-4 w-4 ${
                        plan.highlighted ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground">{plan.name}</h3>
                </div>

                <div className="mb-3">
                  <span className="text-2xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                <ul className="space-y-2 mb-4 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full rounded-xl" size="sm" disabled>
                    Plano Atual
                  </Button>
                ) : plan.id === "starter" ? (
                  <Button variant="outline" className="w-full rounded-xl" size="sm" disabled>
                    Plano Gratuito
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlighted ? "hero" : "outline"}
                    className="w-full gap-2 rounded-xl"
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

        {/* FAQ / Help */}
        <motion.div
          className="rounded-2xl bg-card border border-border p-6 text-center cyber-lines"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-muted-foreground">
            Precisa de ajuda para escolher o plano ideal?{" "}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Fale conosco pelo WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
