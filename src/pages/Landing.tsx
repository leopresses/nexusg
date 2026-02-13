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
    <div className="min-h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* força o texto do Logo (inclui “Gestão”) */}
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="!text-slate-700 hover:!bg-slate-100">
                Entrar
              </Button>
            </Link>

            <Link to="/register">
              <Button
                variant="default"
                size="sm"
                className="!bg-blue-600 !text-white hover:!bg-blue-700 rounded-xl shadow-sm"
              >
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background effects (claro, estilo da referência) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />

        <div className="container mx-auto relative">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
            >
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-slate-600">A plataforma #1 para gestão de Google Business</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-slate-900"
            >
              Cresça no Google com <span className="text-blue-600">Gestão Nexus</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Automatize tarefas, acompanhe métricas e gere relatórios profissionais para restaurantes e negócios
              locais.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                {/* NÃO altera lógica: só força aparência clara */}
                <Button
                  variant="default"
                  size="xl"
                  className="w-full sm:w-auto h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 gap-2 shadow-sm"
                >
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/demo">
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full sm:w-auto h-12 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50 shadow-sm"
                >
                  Ver Demonstração
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Suporte via WhatsApp</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative bg-slate-50">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Tudo que você precisa para <span className="text-blue-600">dominar o Google</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Ferramentas poderosas para agências e gestores que querem resultados reais.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 transition-all duration-300 shadow-sm"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 relative bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent" />
        <div className="container mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Planos para cada <span className="text-blue-600">tamanho de negócio</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Comece grátis e escale conforme sua operação cresce.</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {SIMPLE_PLANS.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: plan.popular ? 1.03 : 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`relative p-5 rounded-2xl border transition-all duration-300 bg-white shadow-sm ${
                  plan.popular ? "border-emerald-300 ring-2 ring-emerald-200" : "border-slate-200 hover:border-blue-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3" />
                    Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1 text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-600 mb-3">{plan.clients}</p>
                  <div className="text-xl font-bold mb-4 text-slate-900">{plan.price}</div>
                  <Link to="/register">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className={`w-full rounded-xl ${
                        plan.popular
                          ? "!bg-emerald-600 !text-white hover:!bg-emerald-700"
                          : "!bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
                      }`}
                      size="sm"
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
      <section className="py-20 px-6 bg-slate-50">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Pronto para voar mais alto?</h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              Junte-se a centenas de agências e gestores que já estão transformando a presença digital dos seus
              clientes.
            </p>
            <Link to="/register">
              <Button
                variant="default"
                size="xl"
                className="h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 gap-2 shadow-sm"
              >
                Criar Conta Gratuita
                <ArrowRight className="h-5 w-5" />
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
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
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
