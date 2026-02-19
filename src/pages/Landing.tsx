import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  MessageCircle,
  Star,
  ArrowRight,
  Zap,
  ShieldCheck,
  Globe,
  BarChart3,
  Users,
  LayoutDashboard,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { PLANS, WHATSAPP_NUMBER } from "@/config/plans";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* 1. Navbar Glassmorphism */}
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
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-bold text-slate-600">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="default" className="rounded-full px-6 shadow-lg shadow-blue-200 font-bold">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="container mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Badge
              variant="outline"
              className="mb-6 py-1 px-4 rounded-full border-blue-200 bg-blue-50 text-blue-700 font-bold"
            >
              🚀 A plataforma #1 para Gestores de Google Business
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Sua agência no <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Próximo Nível.
              </span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Automatize tarefas, sincronize dados do Google Places e gere relatórios profissionais em segundos. Tudo
              white-label para sua marca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-200 group"
                >
                  Começar agora <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-2xl border-slate-200 font-bold text-slate-600"
              >
                <PlayCircle className="mr-2 h-5 w-5 text-blue-600" /> Ver demonstração
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Social Proof */}
      <section className="py-12 border-y border-slate-50 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">
            Especializado em Nichos Locais
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale items-center">
            <span className="text-xl font-black">RESTAURANTES</span>
            <span className="text-xl font-black">CLÍNICAS</span>
            <span className="text-xl font-black">ESTÉTICA</span>
            <span className="text-xl font-black">ACADEMIAS</span>
            <span className="text-xl font-black">LOJAS</span>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="funcionalidades" className="py-24 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Feito para quem não quer perder tempo com planilhas.
            </h2>
            <p className="text-slate-500">
              Desenvolvemos o Gestão Nexus para ser o cérebro da sua operação de SEO Local.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Sincronização Direta",
                desc: "Conecte o Place ID e puxe métricas de visualização e chamadas automaticamente.",
              },
              {
                icon: FileBarChart,
                title: "Relatórios White-Label",
                desc: "Gere PDFs com sua logo, suas cores e envie direto no WhatsApp do cliente.",
              },
              {
                icon: LayoutDashboard,
                title: "Checklist Inteligente",
                desc: "Tarefas geradas semanalmente seguindo o método que traz resultados.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all"
              >
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing Grid (O seu código remodelado e encaixado aqui) */}
      <section id="precos" className="py-24 px-6 bg-slate-50/50 relative">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
              Planos que acompanham seu crescimento
            </h2>
            <p className="text-slate-500">Comece grátis hoje e escale conforme sua carteira de clientes aumenta.</p>
          </div>

          {/* O seu GRID DE PLANOS entra aqui perfeitamente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
            {/* ... mapeamento dos planos igual ao componente Pricing anterior ... */}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="py-20 px-6 bg-slate-900 text-white">
        <div className="container mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <Logo size="md" />
            <p className="mt-6 text-slate-400 max-w-sm">
              Simplificando a gestão de Google Business para agências de performance e gestores locais em todo o Brasil.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Plataforma</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Demonstração
                </a>
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
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Central de Ajuda
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
