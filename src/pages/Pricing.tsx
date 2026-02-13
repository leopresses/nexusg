// src/pages/Pricing.tsx
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Rocket, Star, Shield, Users } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

type Plan = {
  id: string;
  name: string;
  priceLabel: string;
  priceNote?: string;
  highlight?: string;
  icon: any;
  accent: "blue" | "green" | "purple" | "slate";
  features: string[];
  cta: string;
};

export default function Pricing() {
  const navigate = useNavigate();

  const plans: Plan[] = useMemo(
    () => [
      {
        id: "starter",
        name: "Starter",
        priceLabel: "R$ 0",
        priceNote: "Para começar e testar",
        highlight: "Grátis",
        icon: Shield,
        accent: "slate",
        features: [
          "Até 1 cliente",
          "Tarefas semanais automáticas",
          "Checklist por tarefa",
          "Relatórios básicos",
          "Suporte via WhatsApp",
        ],
        cta: "Usar Starter",
      },
      {
        id: "tatico",
        name: "Tático",
        priceLabel: "R$ 29,90/mês",
        priceNote: "Ideal para freelancers",
        highlight: "Mais vendido",
        icon: Rocket,
        accent: "blue",
        features: [
          "Até 5 clientes",
          "Tarefas semanais + diárias",
          "Relatórios em PDF",
          "White label básico",
          "Integração Google (Place ID)",
          "Suporte prioritário",
        ],
        cta: "Assinar Tático",
      },
      {
        id: "pro",
        name: "Pro",
        priceLabel: "R$ 59,90/mês",
        priceNote: "Para equipes pequenas",
        icon: Star,
        accent: "green",
        features: [
          "Até 15 clientes",
          "Relatórios avançados",
          "Templates de tarefas",
          "White label completo",
          "Automação de tarefas",
          "Suporte prioritário",
        ],
        cta: "Assinar Pro",
      },
      {
        id: "elite",
        name: "Elite",
        priceLabel: "R$ 99,90/mês",
        priceNote: "Para agências em crescimento",
        icon: Crown,
        accent: "purple",
        features: [
          "Até 40 clientes",
          "Relatórios avançados + branding",
          "Templates avançados",
          "Equipe (multiusuário)",
          "Notificações e rotinas",
          "Suporte VIP",
        ],
        cta: "Assinar Elite",
      },
      {
        id: "agency",
        name: "Agency",
        priceLabel: "Sob consulta",
        priceNote: "Para operação em escala",
        icon: Users,
        accent: "blue",
        features: [
          "Clientes ilimitados",
          "Multiusuário + permissões",
          "Templates e relatórios por segmento",
          "Integrações personalizadas",
          "SLA e suporte dedicado",
          "Onboarding assistido",
        ],
        cta: "Falar com suporte",
      },
    ],
    [],
  );

  const accentClasses = (accent: Plan["accent"]) => {
    if (accent === "blue")
      return {
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        ring: "ring-blue-200",
        button: "!bg-blue-600 !text-white hover:!bg-blue-700",
        iconWrap: "!bg-blue-50 border-blue-200",
        icon: "text-blue-600",
      };
    if (accent === "green")
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        ring: "ring-emerald-200",
        button: "!bg-emerald-600 !text-white hover:!bg-emerald-700",
        iconWrap: "!bg-emerald-50 border-emerald-200",
        icon: "text-emerald-600",
      };
    if (accent === "purple")
      return {
        badge: "bg-violet-50 text-violet-700 border-violet-200",
        ring: "ring-violet-200",
        button: "!bg-violet-600 !text-white hover:!bg-violet-700",
        iconWrap: "!bg-violet-50 border-violet-200",
        icon: "text-violet-600",
      };
    return {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      ring: "ring-slate-200",
      button: "!bg-slate-900 !text-white hover:!bg-slate-800",
      iconWrap: "!bg-slate-50 border-slate-200",
      icon: "text-slate-700",
    };
  };

  const handleCTA = (planId: string) => {
    // Mantém simples: você pode plugar checkout depois.
    if (planId === "agency") {
      navigate("/settings");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <AppLayout title="Planos" subtitle="Escolha o plano ideal para o seu momento">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Aumente sua operação com relatórios e automação</h2>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Planos pensados para quem gerencia negócios locais com foco em resultados (tarefas, Google Business e
                relatórios em PDF).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-200">
                Cancelamento quando quiser
              </Badge>
              <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
                Sem taxas escondidas
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {plans.map((plan, idx) => {
            const C = accentClasses(plan.accent);
            const Icon = plan.icon;
            const isFeatured = plan.highlight === "Mais vendido";

            return (
              <motion.div
                key={plan.id}
                className={`rounded-2xl !bg-white border border-slate-200 shadow-sm p-6 relative ${
                  isFeatured ? `ring-2 ${C.ring}` : ""
                }`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-5">
                    <Badge variant="outline" className={`rounded-full ${C.badge}`}>
                      {plan.highlight}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${C.iconWrap}`}>
                        <Icon className={`h-5 w-5 ${C.icon}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                        <p className="text-xs text-slate-500">{plan.priceNote}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-3xl font-bold text-slate-900">{plan.priceLabel}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button onClick={() => handleCTA(plan.id)} className={`w-full h-10 rounded-xl ${C.button}`}>
                    {plan.cta}
                  </Button>

                  <div className="mt-3 text-xs text-slate-500">*Você pode ajustar limites e checkout depois.</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer Card */}
        <motion.div
          className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h3 className="text-lg font-semibold text-slate-900">Dúvidas sobre qual plano escolher?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Se você está começando, o <strong>Tático</strong> normalmente é o melhor custo-benefício. Para agências, o{" "}
            <strong>Elite</strong> ou <strong>Agency</strong> faz mais sentido.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full bg-slate-100 text-slate-700 border-slate-200">
              White label
            </Badge>
            <Badge variant="outline" className="rounded-full bg-slate-100 text-slate-700 border-slate-200">
              Relatórios PDF
            </Badge>
            <Badge variant="outline" className="rounded-full bg-slate-100 text-slate-700 border-slate-200">
              Google Place ID
            </Badge>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
