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
    <div className="min-h-screen bg-[#F5F7FB] overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E6EAF2]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-[#0F172A] hover:bg-[#EFF6FF]">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#EFF6FF] to-[#F5F7FB]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-3xl" />

        <div className="container mx-auto relative">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E6EAF2] shadow-sm mb-8"
            >
              <Zap className="h-4 w-4 text-[#2563EB]" />
              <span className="text-sm text-[#64748B]">A plataforma #1 para gestão de Google Business</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-[#0F172A]">
              Cresça no Google com <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">Gestão Nexus</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-[#64748B] mb-10 max-w-2xl mx-auto">
              Automatize tarefas, acompanhe métricas e gere relatórios profissionais para restaurantes e negócios
              locais.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="xl" className="w-full sm:w-auto bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl font-semibold shadow-lg shadow-[#2563EB]/25">
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="xl" className="w-full sm:w-auto border-[#E6EAF2] text-[#0F172A] hover:bg-white rounded-xl">
                  Ver Demonstração
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex items-center justify-center gap-6 text-sm text-[#64748B]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                <span>Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                <span>Suporte via WhatsApp</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0F172A]">
              Tudo que você precisa para <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">dominar o Google</span>
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto">
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
                className="p-6 rounded-2xl bg-white border border-[#E6EAF2] hover:border-[#2563EB]/30 transition-all duration-300 group hover:shadow-md shadow-sm"
              >
                <div className="h-12 w-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-[#2563EB]" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#0F172A]">{feature.title}</h3>
                <p className="text-[#64748B] text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#EFF6FF] to-transparent" />
        <div className="container mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0F172A]">
              Planos para cada <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">tamanho de negócio</span>
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto">
              Comece grátis e escale conforme sua operação cresce.
            </p>
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
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? "bg-white border-[#2563EB] shadow-lg shadow-[#2563EB]/10 scale-105"
                    : "bg-white border-[#E6EAF2] hover:border-[#2563EB]/30 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1 text-[#0F172A]">{plan.name}</h3>
                  <p className="text-sm text-[#64748B] mb-3">{plan.clients}</p>
                  <div className="text-xl font-bold mb-4 text-[#0F172A]">{plan.price}</div>
                  <Link to="/register">
                    <Button className={`w-full rounded-xl ${plan.popular ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]" : "border border-[#E6EAF2] bg-white text-[#0F172A] hover:bg-[#EFF6FF]"}`} size="sm">
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
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Pronto para voar mais alto?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Junte-se a centenas de agências e gestores que já estão transformando a presença digital dos seus
              clientes.
            </p>
            <Link to="/register">
              <Button size="xl" className="bg-white text-[#1E3A8A] hover:bg-white/90 rounded-xl font-semibold shadow-lg">
                Criar Conta Gratuita
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#E6EAF2] bg-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-[#64748B]">© 2026 Gestão Nexus. Todos os direitos reservados.</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#2563EB] hover:underline"
          >
            Suporte via WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
