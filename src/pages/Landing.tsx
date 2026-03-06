import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  MessageCircle,
  Star,
  ArrowRight,
  Zap,
  BarChart3,
  LayoutDashboard,
  PlayCircle,
  FileBarChart,
  Shield,
  Bell,
  MessageSquareText,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { PLANS, WHATSAPP_NUMBER, formatClientLimit } from "@/config/plans";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const handleUpgrade = (planName: string, planPrice: string, clientsLimit: string) => {
    const message = encodeURIComponent(
      `Olá! Estive vendo a Landing Page do Gestão Nexus e tenho interesse no plano: ${planName}.\n` +
        `Preço: ${planPrice}/mês\n` +
        `Limite: ${clientsLimit}\n` +
        `Pode me ajudar a começar?`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  const allFeatures = [
    {
      icon: Zap,
      title: "Sincronização Google Places",
      desc: "Conecte o Place ID e puxe métricas, avaliações e dados do negócio automaticamente.",
    },
    {
      icon: FileBarChart,
      title: "Relatórios White-Label",
      desc: "Gere PDFs profissionais com sua logo e cores. Envie direto para o cliente.",
    },
    {
      icon: LayoutDashboard,
      title: "Checklist Inteligente",
      desc: "Tarefas semanais e diárias geradas automaticamente por tipo de negócio.",
    },
    {
      icon: BarChart3,
      title: "Auditoria Score",
      desc: "Avaliação automática da presença digital de cada cliente com score de 0 a 100.",
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      desc: "Notificações automáticas sobre queda de performance, tarefas atrasadas e dados desatualizados.",
    },
    {
      icon: MessageSquareText,
      title: "Gestão de Avaliações",
      desc: "Importe avaliações do Google, responda com templates e acompanhe métricas de satisfação.",
    },
    {
      icon: ShieldAlert,
      title: "Central de Recuperação",
      desc: "Guia passo a passo para recuperar contas restritas ou suspensas no Google.",
    },
    {
      icon: ClipboardCheck,
      title: "Onboarding por Cliente",
      desc: "Processo guiado de ativação com checklist personalizado por tipo de negócio.",
    },
    {
      icon: Shield,
      title: "Multi-tenant Seguro",
      desc: "Cada gestor acessa apenas seus próprios dados. Isolamento total via políticas de segurança.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="hover:text-blue-600 transition-colors">
              Preços
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-bold text-slate-600">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full px-6 shadow-lg shadow-blue-200 font-bold">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Badge
              variant="outline"
              className="mb-6 py-1 px-4 rounded-full border-blue-200 bg-blue-50 text-blue-700 font-bold"
            >
              🚀 A plataforma #1 para Gestores de Google Places
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Sua agência no <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Próximo Nível.
              </span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Automatize tarefas, sincronize dados do Google Places, gerencie avaliações e gere relatórios profissionais. Tudo white-label para sua marca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-blue-200 group"
                >
                  Começar agora <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 rounded-2xl font-bold"
                  aria-label="Ver demonstração do Gestão Nexus"
                >
                  <PlayCircle className="mr-2 h-5 w-5 text-blue-600" /> Ver demonstração
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-50 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">
            Especializado em Nichos Locais
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale items-center font-black text-xl">
            <span>RESTAURANTES</span>
            <span>CLÍNICAS</span>
            <span>ESTÉTICA</span>
            <span>ACADEMIAS</span>
            <span>LOJAS</span>
          </div>
        </div>
      </section>

      {/* Features - expanded */}
      <section id="funcionalidades" className="py-24 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Tudo que você precisa para escalar sua operação.
            </h2>
            <p className="text-slate-500 text-lg">
              Do onboarding à auditoria. Do alerta ao relatório. Uma plataforma completa.
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {allFeatures.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                className="p-7 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA after features */}
          <div className="text-center mt-16">
            <Link to="/register">
              <Button size="lg" className="rounded-2xl px-10 font-bold shadow-lg shadow-blue-200">
                Experimente Grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-slate-400 mt-3">Sem cartão de crédito. 1 cliente grátis para sempre.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 px-6 bg-slate-50/50 relative">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
              Planos que acompanham seu crescimento
            </h2>
            <p className="text-slate-500">Comece grátis hoje e escale conforme sua carteira de clientes aumenta.</p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const formattedLimit = formatClientLimit(plan.clientsLimitValue);

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeInUp}
                  className={`
                    group relative flex flex-col rounded-2xl border bg-white transition-all duration-300 hover:shadow-xl
                    ${
                      plan.highlighted
                        ? "border-emerald-500 ring-1 ring-emerald-500 shadow-emerald-50/50 scale-[1.03] z-10"
                        : "border-slate-200 hover:border-blue-300"
                    }
                  `}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max z-20">
                      <Badge className="!bg-emerald-500 !text-white border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-md">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <div className="p-5 flex flex-col h-full">
                    <div className="mb-4">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center border mb-4 transition-colors ${
                          plan.highlighted
                            ? "bg-emerald-50 border-emerald-100"
                            : "bg-slate-50 border-slate-100 group-hover:bg-blue-50"
                        }`}
                      >
                        <PlanIcon
                          className={`h-5 w-5 ${plan.highlighted ? "text-emerald-600" : "text-slate-600 group-hover:text-blue-600"}`}
                        />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{plan.name}</h3>
                    </div>

                    <div className="mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase">{plan.period}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed h-8 line-clamp-2">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                          <div
                            className={`mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              plan.highlighted ? "bg-emerald-100" : "bg-blue-50"
                            }`}
                          >
                            <Check className={`h-2 w-2 ${plan.highlighted ? "text-emerald-600" : "text-blue-600"}`} />
                          </div>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {plan.id === "starter" ? (
                        <Link to="/register" className="w-full">
                          <Button
                            variant="outline"
                            className="w-full h-9 rounded-xl font-bold text-xs"
                          >
                            Começar Grátis
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleUpgrade(plan.name, plan.price, formattedLimit)}
                          className={`w-full h-9 rounded-xl gap-2 font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            plan.highlighted
                              ? "!bg-emerald-600 !text-white hover:!bg-emerald-700"
                              : ""
                          }`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Contratar
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-slate-900 text-white">
        <div className="container mx-auto grid md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="col-span-2">
            <Logo size="md" />
            <p className="mt-6 text-slate-400 max-w-sm mx-auto md:mx-0">
              Simplificando a gestão de Google Places para agências de performance e gestores locais em todo o Brasil.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Plataforma</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <a href="#funcionalidades" className="hover:text-white transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#precos" className="hover:text-white transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <Link to="/demo" className="hover:text-white transition-colors">
                  Demonstração
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Suporte</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-20 pt-8 border-t border-white/5 text-center text-slate-500 text-xs">
          © 2026 Gestão Nexus. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
