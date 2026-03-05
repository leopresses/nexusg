import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PLANS } from "@/config/plans";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const;

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
} as const;

type DemoTaskStatus = "completed" | "in_progress" | "pending";

const demoTasks: Array<{ title: string; status: DemoTaskStatus; client: string; progress: number }> = [
  { title: "Atualizar fotos do estabelecimento", status: "completed", client: "Pizzaria Roma", progress: 100 },
  { title: "Responder avaliações de clientes", status: "in_progress", client: "Café Central", progress: 66 },
  { title: "Verificar métricas semanais", status: "pending", client: "Barbearia Style", progress: 0 },
];

function statusLabel(status: DemoTaskStatus) {
  if (status === "completed") return "Concluída";
  if (status === "in_progress") return "Em andamento";
  return "Pendente";
}

function statusBadgeClass(status: DemoTaskStatus) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "in_progress") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-slate-900 [&_*]:!text-slate-900">
              <Logo size="sm" />
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-white border-slate-200" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>

            <Button className="rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700" asChild>
              <Link to="/register">
                Criar conta <ArrowRight className="h-4 w-4 ml-2" />
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
          className="grid lg:grid-cols-2 gap-10 items-start"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 py-1">
              <Zap className="h-3.5 w-3.5 mr-1" />
              Demo interativa
            </Badge>

            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Veja como o Nexus organiza sua rotina
            </h1>

            <p className="mt-4 text-slate-600 text-lg leading-relaxed">
              Um exemplo realista de como tarefas, métricas e relatórios aparecem no dia a dia.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button className="h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700" asChild>
                <Link to="/register">
                  Quero usar no meu negócio <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <Button variant="outline" className="h-12 rounded-xl bg-white border-slate-200" asChild>
                <Link to="/pricing">
                  Ver planos <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Clientes" },
                { icon: CheckSquare, label: "Tarefas" },
                { icon: BarChart3, label: "Métricas" },
                { icon: FileText, label: "Relatórios" },
                { icon: Bell, label: "Alertas" },
                { icon: Shield, label: "Segurança" },
              ].map((i) => (
                <div
                  key={i.label}
                  className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <i.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{i.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Demo Card */}
          <motion.div variants={fadeInUp} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Tarefas da semana</h2>
                  <p className="text-sm text-slate-600">Exemplo de execução por cliente</p>
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Atualizado hoje
                </Badge>
              </div>

              <div className="space-y-3">
                {demoTasks.map((t) => (
                  <div key={t.title} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {t.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : t.status === "in_progress" ? (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-slate-400" />
                          )}
                          <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Cliente: <strong className="text-slate-900">{t.client}</strong>
                        </div>
                      </div>

                      <Badge variant="outline" className={statusBadgeClass(t.status)}>
                        {statusLabel(t.status)}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{t.progress}%</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-center gap-2 font-bold text-blue-700">
                  <TrendingUp className="h-4 w-4" />
                  Resultado em foco
                </div>
                <p className="mt-1 text-sm text-blue-700/80">
                  O objetivo é deixar a execução óbvia: o que fazer, quando fazer e o que acompanhar.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Plans preview */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Planos simples</h2>
            <p className="mt-2 text-slate-600">Comece pequeno e evolua conforme sua operação.</p>
          </div>
          <div className="flex items-center gap-2 text-amber-600">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
            ))}
            <span className="text-sm text-slate-600">Método aprovado por quem executa</span>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {PLANS.slice(0, 3).map((p) => (
            <div key={p.name} className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900">{p.name}</h3>
              <div className="mt-3 text-4xl font-extrabold text-slate-900">{p.price}{p.period}</div>
              <div className="text-sm text-slate-600">por mês</div>

              <div className="mt-5 space-y-2">
                {p.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Button className="mt-6 w-full h-11 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700" asChild>
                <Link to="/pricing">
                  Ver detalhes <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
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
            <Button variant="outline" className="rounded-xl bg-white border-slate-200" asChild>
              <Link to="/login">Entrar</Link>
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
