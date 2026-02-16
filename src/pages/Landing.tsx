import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Users, Calendar, BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SIMPLE_PLANS } from "@/config/plans";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/demo">
              <Button variant="ghost" size="sm" className="!text-slate-700 hover:!bg-slate-100">
                Ver Demo
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="!text-slate-700 hover:!bg-slate-100">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="default"
                size="sm"
                className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-sm"
              >
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f8fc] to-[#f6f8fc]" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[680px] h-[680px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="container mx-auto relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold mb-6">
              Gerencie seus clientes do{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Google Business
              </span>{" "}
              com eficiência
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Tarefas automatizadas, relatórios profissionais e métricas em tempo real.
              Tudo em uma única plataforma.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="xl"
                  className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-lg shadow-blue-200"
                >
                  Começar Grátis
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="rounded-xl !text-slate-700 border !border-slate-200">
                  Ver Demonstração
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Tudo que você precisa para crescer</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Uma plataforma completa para gerenciar múltiplos clientes de Google Business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: "Gestão de Clientes",
                description: "Cadastre e organize todos os seus clientes em um só lugar com sincronização via Place ID.",
              },
              {
                icon: Calendar,
                title: "Tarefas Automáticas",
                description: "Tarefas semanais e diárias geradas automaticamente baseadas em templates inteligentes.",
              },
              {
                icon: BarChart3,
                title: "Relatórios Profissionais",
                description: "Gere relatórios em PDF personalizados com a sua marca para apresentar aos clientes.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-white/40">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o Gestão Nexus?</h2>
            <div className="space-y-4">
              {[
                "Economize horas com tarefas automatizadas toda semana",
                "Relatórios white-label com sua marca e cores",
                "Métricas do Google Business em tempo real",
                "Suporte dedicado via WhatsApp",
                "Comece grátis, sem cartão de crédito",
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comece grátis com 1 cliente e escale conforme sua agência cresce.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {SIMPLE_PLANS.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-[32px] border bg-white flex flex-col transition-all duration-300
                ${
                  plan.popular
                    ? "border-blue-600 shadow-2xl shadow-blue-100 z-10 scale-105"
                    : "border-slate-100 shadow-sm hover:border-blue-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest shadow-lg flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Recomendado
                  </div>
                )}

                <div className="flex-1 text-center flex flex-col items-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-tighter mb-6">{plan.clients}</p>

                  <div className="mt-auto mb-8">
                    <span className="text-3xl font-black text-slate-900 block">{plan.price}</span>
                  </div>
                </div>

                <Link to="/register" className="w-full">
                  <Button
                    className={`w-full h-12 rounded-2xl font-bold transition-all ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                        : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-100"
                    }`}
                  >
                    Escolher Plano
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              Crie sua conta gratuita agora e comece a gerenciar seu primeiro cliente em minutos.
            </p>
            <Link to="/register">
              <Button
                size="xl"
                className="rounded-xl !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white hover:opacity-95 shadow-lg"
              >
                Criar Conta Gratuita
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="sm" />
          </div>
          <p className="text-sm text-slate-600">© 2026 Gestão Nexus. Todos os direitos reservados.</p>
          <a
            href="https://wa.me/5535991553748"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Suporte via WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
