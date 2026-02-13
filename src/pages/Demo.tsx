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
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E6EAF2]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F5F7FB]">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-semibold text-[#0F172A] mb-6">
              Veja como o <span className="text-[#2563EB]">Gestão Nexus</span> funciona
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-[#64748B] mb-8">
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
                <div className="h-10 w-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                  Passo 1
                </Badge>
              </div>
              <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">Cadastre seus clientes</h2>
              <p className="text-[#64748B] mb-6">
                Sincronize todas as informações de seus clientes diretamente pelo Google Place ID.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Restaurantes, cafés, barbearias, lojas e mais</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Vincule o perfil do Google Place ID</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Organize todos em um só lugar</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white border border-[#E6EAF2] shadow-sm p-6">
              <div className="space-y-3">
                {["Pizzaria Roma", "Café Central", "Barbearia Style"].map((name, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F7FB]">
                    <div className="h-12 w-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                      <span className="text-lg font-semibold text-[#2563EB]">{name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#0F172A]">{name}</h4>
                      <p className="text-sm text-[#64748B]">
                        {i === 0 ? "Restaurante" : i === 1 ? "Café" : "Serviço"}
                      </p>
                    </div>
                    <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-full px-3 py-1 text-xs font-medium">
                      Ativo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Automatic Tasks */}
      <section className="py-16 px-6 bg-[#EFF6FF]/40">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 rounded-2xl bg-white border border-[#E6EAF2] shadow-sm p-6">
              <div className="space-y-3">
                {demoTasks.map((task, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#F5F7FB]">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-[#0F172A] flex-1">{task.title}</h4>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                          task.status === "completed"
                            ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                            : task.status === "in_progress"
                              ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
                              : "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]"
                        }`}
                      >
                        {task.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {task.status === "in_progress" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {task.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {task.status === "completed"
                          ? "Concluída"
                          : task.status === "in_progress"
                            ? "Em progresso"
                            : "Pendente"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">{task.client}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[#E6EAF2] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-xs text-[#64748B]">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                  Passo 2
                </Badge>
              </div>
              <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">Tarefas semanais automáticas</h2>
              <p className="text-[#64748B] mb-6">
                Toda semana, o sistema gera automaticamente tarefas para todos os seus clientes baseadas em templates
                pré-configurados. Mais de 30 tipos de tarefas semanais e diárias!
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Atualizar fotos e informações</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Responder avaliações e mensagens</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Criar postagens e promoções</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
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
                <div className="h-10 w-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                  Passo 3
                </Badge>
              </div>
              <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">Atualize status facilmente</h2>
              <p className="text-[#64748B] mb-6">
                Cada tarefa possui um checklist detalhado e controle de status. Marque itens como concluídos e acompanhe
                o progresso em tempo real.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="inline-flex items-center bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A] rounded-full py-2 px-4 text-sm font-medium">
                  <Clock className="h-4 w-4 mr-2" />
                  Pendente
                </span>
                <span className="inline-flex items-center bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full py-2 px-4 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Em Progresso
                </span>
                <span className="inline-flex items-center bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-full py-2 px-4 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Concluída
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-[#E6EAF2] shadow-sm p-6">
              <h4 className="font-medium text-[#0F172A] mb-4">Checklist: Atualizar fotos</h4>
              <div className="space-y-3">
                {[
                  { text: "Tirar foto da fachada", done: true },
                  { text: "Fotografar ambiente interno", done: true },
                  { text: "Fotografar produtos/serviços", done: true },
                  { text: "Remover fotos desatualizadas", done: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F7FB]">
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        item.done ? "bg-[#2563EB] border-[#2563EB]" : "border-[#64748B]"
                      }`}
                    >
                      {item.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className={item.done ? "line-through text-[#64748B]" : "text-[#0F172A]"}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 4: Reports */}
      <section className="py-16 px-6 bg-[#EFF6FF]/40">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 rounded-2xl bg-white border border-[#E6EAF2] shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <FileText className="h-8 w-8 text-[#2563EB]" />
                <div>
                  <h4 className="font-medium text-[#0F172A]">Relatório Semanal</h4>
                  <p className="text-sm text-[#64748B]">Pizzaria Roma - Semana 04</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-[#F5F7FB]">
                  <div className="text-2xl font-semibold text-[#2563EB]">1.2k</div>
                  <div className="text-xs text-[#64748B]">Visualizações</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#F5F7FB]">
                  <div className="text-2xl font-semibold text-[#16A34A]">45</div>
                  <div className="text-xs text-[#64748B]">Chamadas</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#F5F7FB]">
                  <div className="text-2xl font-semibold text-[#2563EB]">128</div>
                  <div className="text-xs text-[#64748B]">Rotas</div>
                </div>
              </div>
              <Button className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]">Baixar PDF</Button>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                  Passo 4
                </Badge>
              </div>
              <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">Gere relatórios profissionais</h2>
              <p className="text-[#64748B] mb-6">
                Crie relatórios em PDF com a sua marca para apresentar aos clientes. Inclua métricas, tarefas realizadas
                e recomendações.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Personalize com sua logo e cores</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span>Métricas do Google Business</span>
                </li>
                <li className="flex items-center gap-3 text-[#0F172A]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
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
              <div className="h-10 w-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <Badge variant="outline" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                Planos
              </Badge>
            </div>
            <h2 className="text-3xl font-semibold text-[#0F172A] mb-4">Escolha o plano ideal</h2>
            <p className="text-[#64748B] max-w-2xl mx-auto">
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
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? "bg-white border-[#2563EB] shadow-md scale-105"
                    : "bg-white border-[#E6EAF2] shadow-sm hover:border-[#BFDBFE]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#2563EB] text-xs font-semibold text-white flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#64748B] mb-4">{plan.clients}</p>
                  <div className="text-2xl font-semibold text-[#0F172A] mb-6">{plan.price}</div>
                  <Link to="/register">
                    <Button
                      className={
                        plan.popular
                          ? "w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB]"
                          : "w-full bg-white text-[#2563EB] border border-[#E6EAF2] hover:bg-[#F5F7FB] hover:border-[#BFDBFE]"
                      }
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
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] border border-[#2563EB]/30"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-white mb-4">Pronto para começar?</h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Crie sua conta gratuita agora e comece a gerenciar seu primeiro cliente em minutos.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-[#2563EB] hover:bg-white/90 font-semibold px-8 h-12 text-base focus-visible:ring-white">
                Criar Conta Gratuita
                <ArrowRight className="h-5 w-5 ml-2" />
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
            href="https://wa.me/5535991553748"
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
