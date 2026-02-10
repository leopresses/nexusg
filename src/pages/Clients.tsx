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
  MoreVertical,
  Building2,
  Pencil,
  Trash2,
  Unlink,
  ListTodo,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { getBusinessTypeLabel } from "@/config/plans";
import { useIsMobile } from "@/hooks/use-mobile";
import { useClientTasks } from "@/hooks/useClientTasks";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { PlaceSearchDialog } from "@/components/places/PlaceSearchDialog";
import { toast } from "sonner";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

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

export default function Clients() {
  const { profile, signOut, isAdmin, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [linkingClient, setLinkingClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeDialogOpen, setPlaceDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const clientIds = clients.map((c) => c.id);
  const { getStatsForClient } = useClientTasks(clientIds);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Fetch tasks for selected client
  useEffect(() => {
    if (selectedClient) {
      fetchClientTasks(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        setClients(data);
        if (!selectedClient && data.length > 0) setSelectedClient(data[0]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientTasks = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      setClientTasks(data || []);
    } catch {
      setClientTasks([]);
    }
  };

  const handleUnlinkPlace = async (client: Client) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ place_id: null, google_maps_url: null, place_snapshot: null, place_last_sync_at: null })
        .eq("id", client.id);
      if (error) throw error;
      toast.success("Place ID removido com sucesso!");
      fetchClients();
    } catch {
      toast.error("Erro ao remover Place ID");
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getBusinessTypeLabel(c.business_type).toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "active") return matchesSearch && c.is_active;
    if (filter === "inactive") return matchesSearch && !c.is_active;
    return matchesSearch;
  });

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  const isActive = (href: string) =>
    location.pathname === href || (href !== "/dashboard" && location.pathname.startsWith(href));
  const userName = profile?.full_name || "Usuário";

  const getPlaceSnapshot = (client: Client): any => (client as any).place_snapshot || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const placeSnapshot = selectedClient ? getPlaceSnapshot(selectedClient) : null;

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
            </Link>
          ))}
        </nav>
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
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <div className="h-10 w-[320px] md:w-[420px] max-w-full rounded-full bg-white border border-slate-200 shadow-sm px-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 relative">
              <Bell className="h-5 w-5 text-slate-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5 text-slate-500" />
            </button>
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold ml-1">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
            <button
              onClick={() => navigate("/onboarding")}
              className="h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </button>
          </div>

          {/* Main Grid: List + Detail */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* LEFT — Client List */}
            <div className="xl:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                {/* Filters header */}
                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-2">
                    {(["all", "active", "inactive"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          filter === f
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Client rows */}
                <div className="divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-10 text-center">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">
                        {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
                      </p>
                    </div>
                  ) : (
                    filteredClients.map((client) => {
                      const snapshot = getPlaceSnapshot(client);
                      const isSelected = selectedClient?.id === client.id;

                      return (
                        <div
                          key={client.id}
                          className={`flex items-center gap-4 py-3.5 px-5 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50/60 ring-1 ring-inset ring-blue-200"
                              : "hover:bg-slate-50"
                          }`}
                          onClick={() => setSelectedClient(client)}
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-lg font-bold text-slate-400 flex-shrink-0">
                            <ClientAvatar
                              avatarUrl={client.avatar_url}
                              clientName={client.name}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{client.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {getBusinessTypeLabel(client.business_type)}
                            </p>
                          </div>

                          {/* Rating */}
                          {snapshot?.rating && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-xs font-medium text-slate-700">{snapshot.rating}</span>
                            </div>
                          )}

                          {/* Status badge */}
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                              client.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {client.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — Client Detail */}
            <div className="xl:col-span-7">
              {selectedClient ? (
                <div className="space-y-6">
                  {/* Detail card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Cover */}
                    <div className="relative h-40 bg-gradient-to-r from-slate-200 to-slate-100">
                      {placeSnapshot?.photos?.[0] && (
                        <img src={placeSnapshot.photos[0]} alt="" className="w-full h-full object-cover" />
                      )}
                      {/* Avatar overlay */}
                      <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-500 shadow-sm">
                          <ClientAvatar
                            avatarUrl={selectedClient.avatar_url}
                            clientName={selectedClient.name}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="pt-14 px-6 pb-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">{selectedClient.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-500">
                              <Building2 className="h-3.5 w-3.5 inline mr-1" />
                              {getBusinessTypeLabel(selectedClient.business_type)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                selectedClient.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {selectedClient.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingClient(selectedClient); setEditDialogOpen(true); }}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setDeletingClient(selectedClient); setDeleteDialogOpen(true); }}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rating */}
                      {placeSnapshot?.rating && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i <= Math.round(placeSnapshot.rating)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{placeSnapshot.rating}</span>
                          {placeSnapshot.user_ratings_total && (
                            <span className="text-xs text-slate-500">
                              ({placeSnapshot.user_ratings_total} avaliações)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Details list */}
                      <div className="space-y-3 text-sm">
                        {selectedClient.address && (
                          <div className="flex items-start gap-3 text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>{selectedClient.address}</span>
                          </div>
                        )}
                        {placeSnapshot?.formatted_phone_number && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span>{placeSnapshot.formatted_phone_number}</span>
                          </div>
                        )}
                        {placeSnapshot?.website && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <a
                              href={placeSnapshot.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {placeSnapshot.website}
                            </a>
                          </div>
                        )}
                        {selectedClient.google_maps_url && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <LinkIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <a
                              href={selectedClient.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              Ver no Google Maps
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Place ID actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                        {selectedClient.place_id ? (
                          <>
                            <button
                              onClick={() => { setLinkingClient(selectedClient); setPlaceDialogOpen(true); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                            >
                              <LinkIcon className="h-3 w-3 inline mr-1" />
                              Trocar Place ID
                            </button>
                            <button
                              onClick={() => handleUnlinkPlace(selectedClient)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
                            >
                              <Unlink className="h-3 w-3 inline mr-1" />
                              Remover Place ID
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setLinkingClient(selectedClient); setPlaceDialogOpen(true); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                          >
                            <LinkIcon className="h-3 w-3 inline mr-1" />
                            Vincular Google Place ID
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/tasks?client=${selectedClient.id}`)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
                        >
                          <ListTodo className="h-3 w-3 inline mr-1" />
                          Ver Tarefas
                        </button>
                        <button
                          onClick={() => navigate("/reports")}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
                        >
                          <FileText className="h-3 w-3 inline mr-1" />
                          Gerar Relatório
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tasks card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <h3 className="text-base font-semibold text-slate-900">Tarefas Recentes</h3>
                      <button
                        onClick={() => navigate(`/tasks?client=${selectedClient.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Ver todas →
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {clientTasks.length === 0 ? (
                        <div className="p-8 text-center">
                          <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Nenhuma tarefa encontrada</p>
                        </div>
                      ) : (
                        clientTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <CheckSquare className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                              <p className="text-xs text-slate-500">
                                {task.task_date
                                  ? new Date(task.task_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                                  : "—"}
                              </p>
                            </div>
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
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20">
                  <Users className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 text-sm">Selecione um cliente para ver detalhes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={editingClient}
        onSuccess={() => { fetchClients(); if (editingClient?.id === selectedClient?.id) fetchClients(); }}
      />
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={deletingClient}
        onSuccess={() => { fetchClients(); if (deletingClient?.id === selectedClient?.id) setSelectedClient(null); }}
      />
      <PlaceSearchDialog
        open={placeDialogOpen}
        onOpenChange={setPlaceDialogOpen}
        clientId={linkingClient?.id || ""}
        clientName={linkingClient?.name || ""}
        clientAddress={linkingClient?.address || ""}
        currentPlaceId={linkingClient?.place_id}
        onSuccess={fetchClients}
      />
    </div>
  );
}
