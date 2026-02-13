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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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

const demoTasks = [
  {
    title: "Atualizar fotos do estabelecimento",
    status: "completed",
    client: "Pizzaria Roma",
    progress: 100,
  },
  {
    title: "Responder avaliações de clientes",
    status: "in_progress",
    client: "Café Central",
    progress: 66,
  },
  {
    title: "Verificar métricas semanais",
    status: "pending",
    client: "Barbearia Style",
    progress: 0,
  },
];

import { SIMPLE_PLANS } from "@/config/plans";

const plans = SIMPLE_PLANS;

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* força o texto do Logo (inclui “Gestão”) */}
          <div className="text-slate-900 [&_*]:!text-slate-900">
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 !text-slate-700 hover:!bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
                Voltar
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
              Uma plataforma completa para gerenciar múltiplos clientes de Google Business com tarefas automatizadas,
              relatórios profissionais e métricas em tempo real.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Feature 1: Client Management */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Passo 1
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-4">Cadastre seus clientes</h2>
              <p className="text-slate-600 mb-6">
                Sincronize todas as informações de seus clientes diretamente pelo Google Place ID.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Restaurantes, cafés, barbearias, lojas e mais</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Vincule o perfil do Google Place ID</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Organize todos em um só lugar</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="space-y-4">
                {["Pizzaria Roma", "Café Central", "Barbearia Style"].map((name, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/60"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-700">{name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{name}</h4>
                      <p className="text-sm text-slate-600">{i === 0 ? "Restaurante" : i === 1 ? "Café" : "Serviço"}</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Ativo
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Automatic Tasks */}
      <section className="py-16 px-6 bg-white/40">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="space-y-4">
                {demoTasks.map((task, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium flex-1">{task.title}</h4>
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
                        {task.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {task.status === "in_progress" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {task.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {task.status === "completed"
                          ? "Concluída"
                          : task.status === "in_progress"
                            ? "Em progresso"
                            : "Pendente"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{task.client}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{task.progress}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Passo 2
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-4">Tarefas semanais automáticas</h2>
              <p className="text-slate-600 mb-6">
                Toda semana, o sistema gera automaticamente tarefas para todos os seus clientes baseadas em templates
                pré-configurados. Mais de 30 tipos de tarefas semanais e diárias!
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Atualizar fotos e informações</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Responder avaliações e mensagens</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Criar postagens e promoções</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Verificar métricas e otimizar perfil</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Status Updates */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Passo 3
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-4">Atualize status facilmente</h2>
              <p className="text-slate-600 mb-6">
                Cada tarefa possui um checklist detalhado e controle de status. Marque itens como concluídos e acompanhe
                o progresso em tempo real.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 py-2 px-4">
                  <Clock className="h-4 w-4 mr-2" />
                  Pendente
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 py-2 px-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Em Progresso
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 px-4">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Concluída
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h4 className="font-medium mb-4">Checklist: Atualizar fotos</h4>
              <div className="space-y-3">
                {[
                  { text: "Tirar foto da fachada", done: true },
                  { text: "Fotografar ambiente interno", done: true },
                  { text: "Fotografar produtos/serviços", done: true },
                  { text: "Remover fotos desatualizadas", done: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/60"
                  >
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        item.done ? "bg-blue-600 border-blue-600" : "border-slate-400"
                      }`}
                    >
                      {item.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className={item.done ? "line-through text-slate-500" : ""}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 4: Reports */}
      <section className="py-16 px-6 bg-white/40">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-4 mb-6">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium">Relatório Semanal</h4>
                  <p className="text-sm text-slate-600">Pizzaria Roma - Semana 04</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="text-2xl font-bold text-blue-700">1.2k</div>
                  <div className="text-xs text-slate-600">Visualizações</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="text-2xl font-bold text-emerald-700">45</div>
                  <div className="text-xs text-slate-600">Chamadas</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="text-2xl font-bold text-indigo-700">128</div>
                  <div className="text-xs text-slate-600">Rotas</div>
                </div>
              </div>

              <Button className="w-full rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-sm">
                Baixar PDF
              </Button>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Passo 4
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-4">Gere relatórios profissionais</h2>
              <p className="text-slate-600 mb-6">
                Crie relatórios em PDF com a sua marca para apresentar aos clientes. Inclua métricas, tarefas realizadas
                e recomendações.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Personalize com sua logo e cores</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Métricas do Google Business</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Histórico de tarefas completadas</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Planos
              </Badge>
            </div>
            <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comece grátis com 1 cliente e escale conforme sua agência cresce.
            </p>
          </motion.div>

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
                whileHover={{ y: -6, scale: plan.popular ? 1.03 : 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 bg-white
                shadow-[0_6px_25px_rgba(0,0,0,0.04)]
                hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]
                ${plan.popular ? "border-blue-600 ring-2 ring-blue-200/60 scale-105" : "border-slate-200 hover:border-blue-200"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-xs font-semibold text-white flex items-center gap-1 shadow-md">
                    <Star className="h-3 w-3" />
                    Popular
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
                          ? "!bg-blue-600 !text-white hover:!bg-blue-700"
                          : "!bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
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

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-white border border-slate-200
            shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
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
                variant="hero"
                size="xl"
                className="h-12 rounded-xl relative overflow-hidden group
                !bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white hover:opacity-95 shadow-lg hover:shadow-xl transition-all"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Criar Conta Gratuita
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
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
