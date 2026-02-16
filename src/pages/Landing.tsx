import { motion } from "framer-motion";
import { CheckCircle2, BarChart3, Users, Calendar, FileText, Zap, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { SIMPLE_PLANS, WHATSAPP_NUMBER } from "@/config/plans";

const features = [
  {
    icon: Calendar,
    title: "Tarefas Automatizadas",
    description: "Templates semanais que geram tarefas automaticamente para todos os seus clientes.",
  },
  {
    icon: BarChart3,
    title: "Métricas do Google",
    description: "Acompanhe visualizações, chamadas e rotas do Google Business em tempo real.",
  },
  {
    icon: FileText,
    title: "Relatórios em PDF",
    description: "Gere relatórios profissionais automaticamente para apresentar aos clientes.",
  },
  {
    icon: Users,
    title: "Multi-clientes",
    description: "Gerencie múltiplos estabelecimentos de forma organizada e eficiente.",
  },
];

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
    <div className="min-h-screen bg-white overflow-hidden text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="default"
                size="sm"
                className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-md shadow-blue-200/50"
              >
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-400/10 blur-[120px] rounded-full" />

        <div className="container mx-auto relative">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 shadow-sm mb-8"
            >
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">A plataforma #1 para gestão de Google Business</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-slate-900"
            >
              Cresça no Google com{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestão Nexus
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Automatize tarefas, acompanhe métricas e gere relatórios profissionais para restaurantes e negócios
              locais.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="xl"
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-xl shadow-blue-200/50 group transition-all"
                >
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    Começar Gratuitamente
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
              <Link to="/demo">
                <Button
                  size="xl"
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl !bg-white !text-slate-700 border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <span className="text-lg font-semibold">Ver Demonstração</span>
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>Suporte via WhatsApp</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-slate-50/50 border-y border-slate-100">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                dominar o Google
              </span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Ferramentas poderosas para agências e gestores que querem resultados reais.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                className="group relative p-8 rounded-3xl bg-white border border-slate-200/60
                shadow-[0_4px_20px_rgba(0,0,0,0.03)]
                hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)]
                hover:border-blue-200 transition-all duration-300"
              >
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Planos para cada <span className="text-blue-600">tamanho de negócio</span>
            </h2>
            <p className="text-slate-600 text-lg">Comece grátis e escale conforme sua operação cresce.</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-5 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {SIMPLE_PLANS.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className={`relative p-6 rounded-3xl border bg-white transition-all duration-300
                ${
                  plan.popular
                    ? "border-blue-600 shadow-xl shadow-blue-100/50 scale-105 z-10"
                    : "border-slate-200 shadow-sm hover:border-blue-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
                    Recomendado
                  </div>
                )}
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-tighter">{plan.clients}</p>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{plan.price}</div>
                  <Link to="/register" className="block">
                    <Button
                      className={`w-full h-11 rounded-xl font-bold transition-all ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                          : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      Escolher Plano
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <motion.div
            className="max-w-5xl mx-auto p-12 md:p-16 rounded-[40px] bg-blue-600 relative overflow-hidden text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white relative z-10">
              Pronto para voar mais alto?
            </h2>
            <p className="text-blue-50 text-xl mb-10 max-w-2xl mx-auto relative z-10">
              Junte-se a centenas de agências que já estão transformando a presença digital dos seus clientes.
            </p>
            <Link to="/register" className="relative z-10">
              <Button
                size="xl"
                className="h-16 px-10 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 shadow-2xl shadow-black/20 font-bold text-lg"
              >
                Criar Minha Conta Gratuita
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-slate-900">
            <Logo size="md" />
          </div>
          <p className="text-slate-500 font-medium tracking-tight">
            © 2026 Gestão Nexus. Todos os direitos reservados.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-50 text-blue-600 font-bold hover:bg-blue-50 transition-colors border border-slate-100"
          >
            Suporte via WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
