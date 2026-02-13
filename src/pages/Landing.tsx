import { motion } from "framer-motion";
import { CheckCircle2, BarChart3, Users, Calendar, FileText, Zap, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { SIMPLE_PLANS, WHATSAPP_NUMBER } from "@/config/plans";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-100 overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-300">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* 👇 força a cor do logo */}
          <Logo size="sm" className="text-slate-900" />

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="!text-slate-800 hover:!bg-slate-200">
                Entrar
              </Button>
            </Link>

            <Link to="/register">
              <Button size="sm" className="!bg-blue-600 !text-white hover:!bg-blue-700 rounded-xl">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 bg-slate-100">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-300 shadow-sm mb-8">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-slate-700">A plataforma #1 para gestão de Google Business</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-slate-900">
            Cresça no Google com <span className="text-blue-600">Gestão Nexus</span>
          </h1>

          <p className="text-lg text-slate-700 mb-10 max-w-2xl mx-auto">
            Automatize tarefas, acompanhe métricas e gere relatórios profissionais para restaurantes e negócios locais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 gap-2">
                Começar Gratuitamente
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            <Link to="/demo">
              <Button
                variant="outline"
                className="h-12 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-200"
              >
                Ver Demonstração
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Setup em 2 minutos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Suporte via WhatsApp
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-slate-200">
        <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Calendar,
              title: "Tarefas Automatizadas",
              desc: "Templates semanais que geram tarefas automaticamente para todos os seus clientes.",
            },
            {
              icon: BarChart3,
              title: "Métricas do Google",
              desc: "Acompanhe visualizações, chamadas e rotas do Google Business em tempo real.",
            },
            {
              icon: FileText,
              title: "Relatórios em PDF",
              desc: "Gere relatórios automáticos para apresentar aos clientes.",
            },
            {
              icon: Users,
              title: "Multi-clientes",
              desc: "Gerencie múltiplos estabelecimentos de forma organizada.",
            },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900">{feature.title}</h3>
              <p className="text-slate-700 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 bg-slate-100">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {SIMPLE_PLANS.map((plan, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-300 bg-white shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-slate-700 text-sm">{plan.clients}</p>
              <div className="text-xl font-bold mt-3 mb-4 text-slate-900">{plan.price}</div>

              <Button
                variant="outline"
                className="w-full rounded-xl bg-white border border-slate-300 hover:bg-slate-200"
              >
                Escolher Plano
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-200">
        <div className="container mx-auto max-w-4xl text-center bg-white p-12 rounded-3xl border border-slate-300 shadow-sm">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Pronto para voar mais alto?</h2>
          <p className="text-slate-700 mb-8">
            Junte-se a centenas de agências e gestores que já estão transformando a presença digital dos seus clientes.
          </p>
          <Link to="/register">
            <Button className="h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-slate-300 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" className="text-slate-900" />

          <p className="text-sm text-slate-700">© 2026 Gestão Nexus. Todos os direitos reservados.</p>

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
