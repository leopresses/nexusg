import { motion } from "framer-motion";
import { CheckCircle2, BarChart3, Users, Calendar, FileText, Zap, ArrowRight, Star, TrendingUp } from "lucide-react";
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
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
    <div className="min-h-screen bg-[#f6f8fc] overflow-hidden text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-slate-900 [&_*]:!text-slate-900 scale-90 origin-left">
            <Logo size="md" />
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-600">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              {/* Botão padronizado com a variante default azul */}
              <Button variant="default" size="sm" className="px-6">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Efeitos de Fundo Suaves */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="container mx-auto relative z-10">
          <motion.div className="max-w-5xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-100 shadow-sm mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-slate-600">A plataforma #1 para Gestores de Tráfego</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight text-slate-900"
            >
              Escale sua agência com <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestão Inteligente
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Centralize tarefas, automatize relatórios e mostre resultados reais do Google Business para seus clientes
              em uma única tela.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link to="/register">
                {/* Usando a variante HERO que definimos no global */}
                <Button variant="hero" size="xl" className="w-full sm:w-auto min-w-[200px]">
                  Começar Grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="xl" className="w-full sm:w-auto bg-white hover:bg-slate-50">
                  Ver como funciona
                </Button>
              </Link>
            </motion.div>

            {/* PRODUCT PREVIEW / DASHBOARD MOCKUP */}
            <motion.div variants={fadeInUp} className="relative mx-auto max-w-5xl">
              <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl p-2 shadow-2xl">
                <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                  {/* Mockup Header */}
                  <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400/20 border border-red-400/50" />
                      <div className="h-3 w-3 rounded-full bg-amber-400/20 border border-amber-400/50" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400/20 border border-emerald-400/50" />
                    </div>
                    <div className="h-5 w-64 bg-white rounded-md border border-slate-100 mx-auto" />
                  </div>
                  {/* Mockup Body - Grid Representation */}
                  <div className="p-6 grid grid-cols-12 gap-6 bg-slate-50/50">
                    {/* Sidebar */}
                    <div className="hidden md:block col-span-2 space-y-3">
                      <div className="h-8 w-full bg-blue-600/10 rounded-lg" />
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-4 w-1/2 bg-slate-200 rounded" />
                      <div className="h-4 w-2/3 bg-slate-200 rounded" />
                    </div>
                    {/* Main Content */}
                    <div className="col-span-12 md:col-span-10 grid grid-cols-3 gap-4">
                      {/* Metric Cards */}
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-xl bg-white border border-slate-100 shadow-sm p-4">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 mb-2" />
                          <div className="h-4 w-12 bg-slate-100 rounded" />
                        </div>
                      ))}
                      {/* Big Chart Area */}
                      <div className="col-span-3 h-64 rounded-xl bg-white border border-slate-100 shadow-sm p-4 flex items-end gap-2 pb-0 overflow-hidden">
                        {[40, 60, 45, 70, 50, 80, 65, 85, 75, 90, 60, 50].map((h, idx) => (
                          <div key={idx} className="flex-1 bg-blue-600/10 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-20 bg-white p-3 rounded-xl shadow-xl border border-slate-100 hidden lg:flex items-center gap-3"
              >
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Crescimento</div>
                  <div className="text-sm font-bold text-slate-900">+127%</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="border-y border-slate-100 bg-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-medium text-slate-500 mb-6">CONFIADO POR GESTORES QUE ATENDEM</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholders for logos or simple text stats */}
            <span className="text-xl font-black text-slate-300">RESTAURANTES</span>
            <span className="text-xl font-black text-slate-300">CLÍNICAS</span>
            <span className="text-xl font-black text-slate-300">LOJAS LOCAIS</span>
            <span className="text-xl font-black text-slate-300">DELIVERIES</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 px-6 relative bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Tudo que você precisa para <br />
              <span className="text-blue-600">dominar o Google</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Substitua planilhas complexas por um sistema desenhado para escalar sua operação de SEO Local.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
              >
                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                  <feature.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 relative bg-[#f6f8fc]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Planos transparentes</h2>
            <p className="text-slate-600">Escolha o tamanho ideal para sua carteira de clientes.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {SIMPLE_PLANS.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative p-6 rounded-3xl border flex flex-col justify-between bg-white transition-all duration-300
                ${
                  plan.popular
                    ? "border-blue-500 shadow-xl shadow-blue-900/10 ring-1 ring-blue-500 scale-105 z-10"
                    : "border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" /> Popular
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <div className="text-sm text-slate-500 font-medium mb-4">{plan.clients}</div>
                  <div className="text-3xl font-black text-slate-900 mb-6">{plan.price}</div>
                </div>

                <Link to="/register" className="mt-auto">
                  <Button
                    // AQUI A MÁGICA: Usamos a lógica simples com as classes globais
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full rounded-xl font-bold"
                  >
                    Escolher Plano
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para crescer?</h2>
              <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
                Crie sua conta gratuita agora e comece a gerenciar seus clientes de forma profissional.
              </p>
              <Link to="/register">
                <Button
                  size="xl"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-2xl shadow-lg border-0 h-14 px-10 text-lg"
                >
                  Criar Conta Gratuita
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-slate-900 [&_*]:!text-slate-900 scale-90 origin-left">
              <Logo size="md" />
            </div>
            <p className="text-sm text-slate-500">© 2026 Gestão Nexus.</p>
          </div>

          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              Termos
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              Privacidade
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg"
            >
              Suporte via WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
