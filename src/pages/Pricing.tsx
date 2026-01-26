import { motion } from "framer-motion";
import { 
  Check, 
  Zap,
  Crown,
  Rocket,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: "Grátis",
    period: "",
    description: "Perfeito para começar a gerenciar seu primeiro cliente.",
    features: [
      "1 cliente",
      "Tarefas ilimitadas",
      "Relatórios básicos",
      "Suporte por email",
    ],
    highlighted: false,
    buttonText: "Plano Atual",
    buttonVariant: "outline" as const,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: "R$ 97",
    period: "/mês",
    description: "Ideal para profissionais que gerenciam múltiplos clientes.",
    features: [
      "Até 10 clientes",
      "Tarefas ilimitadas",
      "Relatórios avançados",
      "White-label (sua marca)",
      "Suporte prioritário",
    ],
    highlighted: true,
    buttonText: "Fazer Upgrade",
    buttonVariant: "default" as const,
  },
  {
    id: "elite",
    name: "Elite",
    icon: Rocket,
    price: "R$ 197",
    period: "/mês",
    description: "Para agências que precisam de recursos avançados.",
    features: [
      "Até 30 clientes",
      "Tudo do Pro",
      "API de integração",
      "Múltiplos usuários",
      "Dashboard personalizado",
      "Suporte 24/7",
    ],
    highlighted: false,
    buttonText: "Fazer Upgrade",
    buttonVariant: "outline" as const,
  },
  {
    id: "agency",
    name: "Agency",
    icon: Building,
    price: "R$ 397",
    period: "/mês",
    description: "Solução completa para grandes operações.",
    features: [
      "Clientes ilimitados",
      "Tudo do Elite",
      "Gerente de conta dedicado",
      "Treinamento personalizado",
      "SLA garantido",
      "Integrações customizadas",
    ],
    highlighted: false,
    buttonText: "Fazer Upgrade",
    buttonVariant: "outline" as const,
  },
];

export default function Pricing() {
  const { profile } = useAuth();
  const currentPlan = profile?.plan || "starter";

  return (
    <AppLayout 
      title="Planos e Assinaturas" 
      subtitle="Escolha o plano ideal para o seu negócio"
    >
      <div className="space-y-8">
        {/* Current Plan Banner */}
        <motion.div 
          className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Seu plano atual</h3>
              <p className="text-muted-foreground">
                Você está no plano <span className="text-primary font-semibold uppercase">{currentPlan}</span>
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
              {currentPlan === "starter" ? "Gratuito" : "Ativo"}
            </Badge>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {plans.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan;
            const PlanIcon = plan.icon;

            return (
              <motion.div
                key={plan.id}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlighted 
                    ? 'bg-card border-primary shadow-lg shadow-primary/10 relative' 
                    : 'bg-card border-border'
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    plan.highlighted ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <PlanIcon className={`h-5 w-5 ${plan.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={isCurrentPlan ? "outline" : plan.buttonVariant}
                  className="w-full"
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Plano Atual" : plan.buttonText}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ or Additional Info */}
        <motion.div 
          className="rounded-xl bg-card border border-border p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-muted-foreground">
            Precisa de ajuda para escolher o plano ideal?{" "}
            <a 
              href="https://wa.me/5535991553748" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Fale conosco pelo WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
