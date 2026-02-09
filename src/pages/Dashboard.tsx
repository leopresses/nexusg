import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  CheckSquare,
  Plus,
  Search,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  CreditCard,
  Shield,
  LogOut,
  Menu,
  X,
  Star,
  MapPin,
  Phone,
  Globe,
  LinkIcon,
  ChevronDown,
  Loader2,
  ClipboardList,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { getBusinessTypeLabel, formatClientLimit, getPlanLabel } from "@/config/plans";
import { useIsMobile } from "@/hooks/use-mobile";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string } | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700 border border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em progresso",
  completed: "Concluído",
};

// --- Sidebar Nav Items ---
const baseNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks" },
  { icon: FileText, label: "Relatórios", href: "/reports" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

const adminNavItems = [
  { icon: Shield, label: "Usuários & Planos", href: "/admin/users-plans" },
  { icon: FileText, label: "Templates de Tarefas", href: "/admin/templates" },
];

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState({ pending: 0, in_progress: 0, completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const fetchData = async () => {
    try {
      const clientsRes = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      const recentTasksRes = await supabase
        .from("tasks")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(10);

      const [pendingCount, inProgressCount, completedCount] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (recentTasksRes.data) setRecentTasks(recentTasksRes.data as Task[]);

      const pending = pendingCount.count || 0;
      const inProgress = inProgressCount.count || 0;
      const completed = completedCount.count || 0;

      setTaskStats({
        pending,
        in_progress: inProgress,
        completed,
        total: pending + inProgress + completed,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  const isActive = (href: string) => location.pathname === href || (href !== "/dashboard" && location.pathname.startsWith(href));
  const userName = profile?.full_name || "Usuário";

  // Featured client for the right panel
  const featuredClient = clients[0] || null;
  const placeSnapshot = featuredClient?.place_snapshot as Record<string, any> | null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : "hidden lg:flex lg:w-[260px]"
          }
          flex-col bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] text-white
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Gestão Nexus</span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto">
              <X className="h-5 w-5 text-white/70" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-white/15 ring-1 ring-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.label === "Clientes" && (
                <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white text-sm w-full transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Search bar */}
            <div className="h-10 w-[320px] md:w-[420px] max-w-full rounded-full bg-white border border-slate-200 shadow-sm px-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 relative">
              <Bell className="h-5 w-5 text-slate-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100">
              <Settings className="h-5 w-5 text-slate-500" />
            </button>
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold ml-1">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-semibold text-slate-900">
              Bem-vindo, {userName.split(" ")[0]}! 👋
            </h1>
            <button
              onClick={() => navigate("/onboarding")}
              className="h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </button>
          </div>

          {/* ===== METRICS + RIGHT PANEL ===== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* LEFT COL */}
            <div className="xl:col-span-8 space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clientes Ativos */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm text-blue-100">Clientes Ativos</p>
                    <p className="text-3xl font-bold mt-1">{clients.length}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Tarefas Pendentes */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm text-orange-100">Tarefas Pendentes</p>
                    <p className="text-3xl font-bold mt-1">{taskStats.pending}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Avaliações Totais */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm text-slate-500">Avaliações Totais</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {placeSnapshot?.user_ratings_total || "—"}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                {/* Avaliação Média */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm text-slate-500">Avaliação Média</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-3xl font-bold text-slate-900">
                        {placeSnapshot?.rating || "—"}
                      </p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i <= Math.round(placeSnapshot?.rating || 0)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Tarefas de Hoje */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Tarefas de Hoje</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {taskStats.total} tarefas
                    </span>
                    <Link
                      to="/tasks"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todas →
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentTasks.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Nenhuma tarefa encontrada</p>
                    </div>
                  ) : (
                    recentTasks.slice(0, 6).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate("/tasks")}
                      >
                        {/* Task icon/thumb */}
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <CheckSquare className="h-5 w-5 text-slate-400" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {task.clients?.name || "Cliente"} · {task.frequency === "daily" ? "Diária" : "Semanal"}
                          </p>
                        </div>

                        {/* Date */}
                        <div className="text-xs text-slate-400 whitespace-nowrap">
                          {task.task_date
                            ? new Date(task.task_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                            : "—"}
                        </div>

                        {/* Status badge */}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                            statusColors[task.status] || statusColors.pending
                          }`}
                        >
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ===== RIGHT COL — Últimos Relatórios / Client Card ===== */}
            <div className="xl:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900 italic">Últimos Relatórios</h2>
                  <button className="text-slate-400 hover:text-slate-600">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {featuredClient ? (
                  <>
                    {/* Cover image */}
                    <div className="relative h-32 bg-gradient-to-r from-slate-200 to-slate-100">
                      {placeSnapshot?.photos?.[0] && (
                        <img
                          src={placeSnapshot.photos[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Avatar overlay */}
                      <div className="absolute -bottom-8 left-5">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-slate-200 overflow-hidden flex items-center justify-center text-xl font-bold text-slate-500">
                          <ClientAvatar
                            avatarUrl={(featuredClient as any).avatar_url}
                            clientName={featuredClient.name}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="pt-10 px-5 pb-4">
                      <h3 className="text-base font-semibold text-slate-900">{featuredClient.name}</h3>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-slate-900">
                          {placeSnapshot?.rating || "—"}
                        </span>
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i <= Math.round(placeSnapshot?.rating || 0)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          {placeSnapshot?.user_ratings_total || 0} avaliações
                        </span>
                      </div>

                      {/* Info items */}
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-600">
                            {featuredClient.address || placeSnapshot?.formatted_address || "Endereço não informado"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600">
                            {placeSnapshot?.formatted_phone_number || "(—) —"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-blue-600 truncate">
                            {placeSnapshot?.website || "—"}
                          </span>
                        </div>
                        {featuredClient.google_maps_url && (
                          <div className="flex items-center gap-3 text-sm">
                            <LinkIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <a
                              href={featuredClient.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 truncate hover:underline"
                            >
                              {featuredClient.google_maps_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Nenhum cliente ainda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
