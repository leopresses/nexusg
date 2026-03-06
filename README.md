🚀 Gestão Nexus — SaaS de Gestão e Automação para Negócios Locais

Sistema SaaS completo para gestão de clientes, automação de tarefas,
monitoramento de métricas do Google Business, geração de relatórios e
otimização da presença digital de empresas locais.

------------------------------------------------------------------------

✨ Visão Geral

O Gestão Nexus permite:

-   Gerenciar múltiplos clientes (negócios locais)
-   Automatizar tarefas semanais e diárias com templates
-   Acompanhar métricas do Google Business (visualizações, chamadas,
    rotas etc.)
-   Gerar relatórios em PDF personalizados (white-label)
-   Administrar usuários, planos e limites por assinatura

------------------------------------------------------------------------

🧱 Stack Tecnológica

Frontend: - React + Vite - TypeScript - Tailwind CSS - shadcn/ui -
Framer Motion - React Router - Lucide Icons

Backend: - Supabase (Auth, Database, Storage, Edge Functions)

Integrações: - Google Places API - Google Business Metrics - Exportação
de relatórios em PDF

------------------------------------------------------------------------

🧩 Funcionalidades

Autenticação: - Login e registro - Recuperação de senha - Proteção de
rotas - Perfis e papéis (admin e usuário)

Clientes: - Cadastro e gestão de clientes - Tipos de negócio
personalizados - Vinculação com Google Place ID - Limite de clientes por
plano

Tarefas: - Templates diários e semanais - Geração automática de
tarefas - Checklist e status de progresso

Relatórios: - Relatórios por período - Métricas e tarefas incluídas -
White-label com logo e cores personalizadas

Configurações: - Nome da empresa - Logo - Cor primária - Rodapé do
relatório - Preferências do sistema

Admin: - Gestão de usuários e planos - Gestão de templates de tarefas

------------------------------------------------------------------------

📂 Estrutura do Projeto

src/ components/ → Componentes reutilizáveis e UI pages/ → Páginas
principais do sistema hooks/ → Hooks customizados integrations/ →
Integrações externas (Supabase) lib/ → Utilitários gerais config/ →
Configurações globais

------------------------------------------------------------------------

🗄️ Banco de Dados (Supabase)

Principais tabelas: - profiles - user_roles - clients - task_templates -
tasks - reports - brand_settings - google_metrics_daily

RPC Functions: - can_add_client - generate_tasks_for_client -
generate_weekly_tasks_for_all_clients

------------------------------------------------------------------------

▶️ Instalação e Execução

Instalar dependências: npm install

Executar projeto: npm run dev

Build produção: npm run build

------------------------------------------------------------------------

🔐 Segurança

-   RLS habilitado no Supabase
-   Dados isolados por usuário
-   Controle de acesso por perfil

------------------------------------------------------------------------

👨‍💻 Autor

Leonardo Presses
