import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  MessageCircle,
  MessageSquareText,
  PlayCircle,
  Shield,
  ShieldAlert,
  Star,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PLANS, WHATSAPP_NUMBER, formatClientLimit } from "@/config/plans";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
} as const;

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
} as const;

type PlanLike = {
  name: string;
  price: string;
  clientsLimit: number;
  description?: string;
  features?: string[];
  popular?: boolean;
};

function buildWhatsAppUrl(params: { planName: string; planPrice: string; clientsLimit: string }) {
  const message = encodeURIComponent(
    `Olá! Estive vendo a Landing Page do Gestão Nexus e tenho interesse no plano: ${params.planName}.\n` +
      `Preço: ${params.planPrice}/mês\n` +
      `Limite: ${params.clientsLimit}\n` +
      `Pode me ajudar a começar?`,
  );

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function LandingPage() {
  const plans = useMemo(() => {
    // PLANS vem do config; garantimos formato mínimo com fallback seguro.
    return (Array.isArray(PLANS) ? PLANS : []) as unknown as PlanLike[];
  }, []);

  const handleUpgrade = useCallback((plan: PlanLike) => {
    const url = buildWhatsAppUrl({
      planName: plan.name,
      planPrice: plan.price,
      clientsLimit: formatClientLimit(plan.clientsLimit),
    });
    openInNewTab(url);
  }, []);

  const highlights = useMemo(
    () => [
      {
        icon: LayoutDashboard,
        title: "Painel completo",
        desc: "Acompanhe o desempenho dos seus clientes em um só lugar.",
      },
      {
        icon: ClipboardCheck,
        title: "Tarefas automáticas",
        desc: "Checklist semanal/diário com as ações mais importantes.",
      },
      { icon: BarChart3, title: "Métricas úteis", desc: "Visualizações, ligações, rotas e outros sinais do Google." },
      {
        icon: FileBarChart,
        title: "Relatórios em PDF",
        desc: "Gere relatórios para provar resultado e reter clientes.",
      },
      {
        icon: Bell,
        title: "Alertas inteligentes",
        desc: "Identifique quedas e oportunidades antes de virar problema.",
      },
      { icon: Shield, title: "Operação segura", desc: "Estrutura robusta para organizar sua rotina e escalar." },
    ],
    [],
  );

  const steps = useMemo(
    () => [
      { title: "Cadastre o cliente", desc: "Adicione o Place ID e dados básicos do estabelecimento." },
      { title: "Sincronize informações", desc: "Puxe métricas e organize tudo em um layout simples." },
      { title: "Execute o método", desc: "Siga as tarefas sugeridas e acompanhe os resultados." },
    ],
    [],
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Ana Souza",
        role: "Social Media",
        text: "O Nexus me ajudou a organizar meus clientes e provar resultado.",
      },
      {
        name: "Lucas Martins",
        role: "Gestor de Tráfego",
        text: "As tarefas semanais viraram rotina. Fica impossível esquecer.",
      },
      { name: "Bruna Lima", role: "Agência Local", text: "Relatório em PDF + métricas claras = retenção muito maior." },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-slate-900 [&_*]:!text-slate-900">
              <Logo size="sm" />
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-white border-slate-200" asChild>
              <Link to="/demo">
                <PlayCircle className="h-4 w-4 mr-2" />
                Ver demo
              </Link>
            </Button>
            <Button className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700" asChild>
              <Link to="/login">
                Entrar <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid lg:grid-cols-2 gap-10 items-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 py-1">
              <Zap className="h-3.5 w-3.5 mr-1" />
              Premium SaaS 2026
            </Badge>

            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Gestão Nexus: tarefas, métricas e relatórios para seus clientes
            </h1>

            <p className="mt-4 text-slate-600 text-lg leading-relaxed">
              Organize sua operação, acompanhe resultados e retenha clientes com um método claro. Sem bagunça. Sem
              planilhas intermináveis.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button className="h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700" asChild>
                <Link to="/register">
                  Criar conta grátis <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-xl bg-white border-slate-200"
                onClick={() => openInNewTab(`https://wa.me/${WHATSAPP_NUMBER}`)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Falar no WhatsApp
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-slate-600">
              <div className="flex -space-x-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-r from-blue-600 to-indigo-600"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                ))}
                <span className="ml-2 text-sm">Método claro + execução simples</span>
              </div>
            </div>
          </motion.div>

          {/* Card */}
          <motion.div variants={fadeInUp} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Top 5 ações do dia</p>
                  <p className="text-sm text-slate-600">Priorize o que mais impacta resultado.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Postar 3 fotos novas no Google",
                  "Responder avaliações recentes",
                  "Atualizar horário especial",
                  "Verificar métricas semanais",
                  "Checar categoria principal",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-800">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-center gap-2 text-blue-700 font-bold">
                  <MessageSquareText className="h-4 w-4" />
                  Relatório em PDF
                </div>
                <p className="mt-1 text-sm text-blue-700/80">
                  Gere um PDF bonito para enviar ao cliente e comprovar evolução.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-4"
        >
          {highlights.map((h) => (
            <motion.div
              key={h.title}
              variants={fadeInUp}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"
            >
              <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <h.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">{h.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-900">Como funciona</h2>
          <p className="mt-2 text-slate-600">Em 3 passos você coloca tudo pra rodar.</p>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {steps.map((s, idx) => (
              <div key={s.title} className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                <div className="text-[10px] font-extrabold text-blue-700 bg-blue-100 w-fit px-2 py-1 rounded-full">
                  PASSO {idx + 1}
                </div>
                <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Planos</h2>
            <p className="mt-2 text-slate-600">Escolha o plano ideal para o seu momento.</p>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full">
            Sem taxa de setup
          </Badge>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl border p-6 shadow-sm bg-white ${
                p.popular ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900">{p.name}</h3>
                {p.popular && <Badge className="rounded-full !bg-blue-600 !text-white">Recomendado</Badge>}
              </div>

              <div className="mt-4">
                <div className="text-4xl font-extrabold text-slate-900">{p.price}</div>
                <div className="text-sm text-slate-600">por mês</div>
              </div>

              <div className="mt-4 text-sm text-slate-600">
                Limite: <strong className="text-slate-900">{formatClientLimit(p.clientsLimit)}</strong>
              </div>

              {p.description && <p className="mt-3 text-sm text-slate-600">{p.description}</p>}

              <div className="mt-5 space-y-2">
                {(p.features || []).map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`mt-6 w-full h-11 rounded-xl ${
                  p.popular
                    ? "!bg-blue-600 !text-white hover:!bg-blue-700"
                    : "!bg-slate-900 !text-white hover:opacity-95"
                }`}
                onClick={() => handleUpgrade(p)}
              >
                Quero esse plano <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <h2 className="text-2xl font-extrabold">O que estão dizendo</h2>
          <p className="mt-2 text-blue-100">Resultados com organização e execução.</p>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white/10 border border-white/20 p-5">
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-300" aria-hidden="true" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-blue-50 leading-relaxed">“{t.text}”</p>
                <div className="mt-4">
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-blue-100">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="text-slate-600 text-sm">
            <div className="font-bold text-slate-900">Gestão Nexus</div>
            <div className="mt-1">© {new Date().getFullYear()} Todos os direitos reservados.</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl bg-white border-slate-200"
              onClick={() => openInNewTab(`https://wa.me/${WHATSAPP_NUMBER}`)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Suporte
            </Button>

            <Button className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700" asChild>
              <Link to="/register">
                Começar <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
