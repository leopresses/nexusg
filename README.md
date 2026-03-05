# Gestão Nexus — SaaS de Gestão e Performance para Negócios Locais

O **Gestão Nexus** é um SaaS para gestão operacional e crescimento de negócios locais (restaurantes, lojas, serviços, barbearias/salões, cafés etc.), com foco em **tarefas acionáveis**, **checklists**, **métricas** e **relatórios** para melhorar rotina e performance.

---

## ✨ Principais recursos

- **Autenticação completa**
  - Login, registro, recuperação e redefinição de senha
  - Suporte a login social (quando habilitado)
- **Gestão de clientes**
  - Cadastro e organização de clientes
  - Importação/sincronização de informações públicas via integrações (quando configurado)
- **Templates de tarefas**
  - Templates diários e semanais
  - Checklists por tarefa
  - Segmentação por tipo de negócio (opcional)
- **Tarefas automatizadas**
  - Geração automática de tarefas a partir dos templates
  - Controle por status, data e cliente
- **Relatórios**
  - Relatórios por período
  - Exportação em PDF (quando habilitado)
- **Admin**
  - Área administrativa (usuários/planos/templates), conforme permissões
- **UI Premium**
  - Visual “SaaS 2026” (claro, limpo e profissional)
  - Componentes reutilizáveis + micro animações

---

## 🧱 Stack

- **Frontend:** Vite + React + TypeScript  
- **UI:** TailwindCSS + shadcn/ui + lucide-react  
- **Animações:** Framer Motion  
- **Backend/DB/Auth/Storage:** Supabase  
- **Integrações:** APIs externas (ex.: Places), quando configuradas

---

## 🧭 Páginas principais

- Landing / Demo
- Auth (Login / Registro / Recuperação)
- Dashboard
- Clientes
- Tarefas
- Relatórios
- Configurações
- Admin (restrito por permissão)

> As rotas podem variar conforme evolução do produto.

---

## 🔐 Segurança (alto nível)

- Regras de acesso por autenticação e permissões
- Proteção de dados por usuário/conta
- Nunca expõe chaves/segredos no repositório ou frontend
