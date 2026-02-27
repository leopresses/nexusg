import { motion } from "framer-motion";
import {
  CheckCircle2,
  Users,
  Calendar,
  FileText,
  BarChart3,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckSquare,
  Star,
  ArrowLeft,
  Shield,
  Bell,
  MessageSquare,
  TrendingUp,
  Zap,
} from "lucide-react";
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
  visible: { transition: { staggerChildren: 0.1 } },
};

const demoTasks = [
  { title: "Atualizar fotos do estabelecimento", status: "completed", client: "Pizzaria Roma", progress: 100 },
  { title: "Responder avaliações de clientes", status: "in_progress", client: "Café Central", progress: 66 },
  { title: "Verificar métricas semanais", status: "pending", client: "Barbearia Style", progress: 0 },
];

const demoFlow = [
  { step: "1", title: "Cadastre o cliente", desc: "Adicione nome, tipo de negócio e endereço.", icon: Users },
  { step: "2", title: "Sincronize o Google", desc: "Vincule o Place ID para importar dados públicos.", icon: TrendingUp },
  { step: "3", title: "Tarefas automáticas", desc: "O sistema gera tarefas semanais e diárias.", icon: Calendar },
  { step: "4", title: "Gere relatórios", desc: "Exporte PDFs profissionais com sua marca.", icon: FileText },
];

const features = [
  { icon: Shield, title: "Auditoria Score", desc: "Avaliação automática do perfil Google com pontuação e recomendações." },
  { icon: Bell, title: "Alertas Inteligentes", desc: "Monitoramento automático de queda de performance e tarefas atrasadas." },
  { icon: MessageSquare, title: "Avaliações", desc: "Sincronize e gerencie avaliações do Google com respostas prontas." },
  { icon: Zap, title: "Central de Recuperação", desc: "Organize evidências e documentação para recuperar perfis." },
  { icon: CheckSquare, title: "Onboarding por Cliente", desc: "Guia passo-a-passo para configuração completa de cada cliente." },
  { icon: BarChart3, title: "Métricas do Google", desc: "Visualizações, chamadas e rotas em um só lugar." },
];

const plans = SIMPLE_PLANS;

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f8fc] to-[#f6f8fc]" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[680px] h-[680px] bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="container mx-auto relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
              Veja como o{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestão Nexus
              </span>{" "}
              funciona
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 mb-8">
              Uma plataforma para gerenciar múltiplos clientes com dados do Google Places, tarefas automatizadas,
              relatórios profissionais e alertas inteligentes.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Demo Flow — 4 steps */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fluxo de trabalho</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {demoFlow.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-center hover:border-blue-200 transition-colors"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3">
                  Passo {item.step}
                </Badge>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-white/40">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Funcionalidades</h2>
          <p className="text-center text-slate-600 mb-12 max-w-xl mx-auto">
            Tudo que você precisa para gestão profissional de perfis do Google.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Task Demo */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h4 className="font-semibold mb-4 text-slate-900">Exemplo: Tarefas da semana</h4>
              <div className="space-y-4">
                {demoTasks.map((task, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium flex-1 text-slate-900">{task.title}</h4>
                      <Badge
                        variant="outline"
                        className={
                          task.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : task.status === "in_progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {task.status === "completed" ? "Concluída" : task.status === "in_progress" ? "Em progresso" : "Pendente"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{task.client}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">* Dados de exemplo para demonstração</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Automação</Badge>
              </div>
              <h2 className="text-3xl font-bold mb-4">Tarefas inteligentes</h2>
              <p className="text-slate-600 mb-6">
                Tarefas geradas automaticamente com base no tipo de negócio e status de sincronização Google.
                Diárias e semanais, priorizadas por impacto.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span>Até 3 tarefas diárias por cliente</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span>Templates por tipo de negócio</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span>Checklist detalhado com progresso</span></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6 bg-white/40">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comece grátis com 1 cliente e escale conforme sua agência cresce.
            </p>
          </div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`relative p-6 rounded-2xl border bg-white shadow-sm
                ${plan.popular ? "border-blue-600 ring-2 ring-blue-200/60 scale-105" : "border-slate-200 hover:border-blue-200"} transition-colors`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-xs font-semibold text-white flex items-center gap-1 shadow-md">
                    <Star className="h-3 w-3" /> Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{plan.clients}</p>
                  <div className="text-2xl font-bold mb-6">{plan.price}</div>
                  <Link to="/register">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className={`w-full rounded-xl ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Começar
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-white border border-slate-200 shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              Crie sua conta gratuita agora e comece a gerenciar seu primeiro cliente em minutos.
            </p>
            <Link to="/register">
              <Button className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-lg">
                <span className="flex items-center gap-2">
                  Criar Conta Gratuita
                  <ArrowRight className="h-5 w-5" />
                </span>
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
          <a href="https://wa.me/5535991553748" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
            Suporte via WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
