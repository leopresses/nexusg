import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  MoreVertical,
  MapPin,
  Building2,
  Loader2,
  Search,
  ListTodo,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Unlink,
  Star,
  HelpCircle,
  X,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ClientTaskProgress } from "@/components/clients/ClientTaskProgress";
import { useClientTasks } from "@/hooks/useClientTasks";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { PlaceSearchDialog } from "@/components/places/PlaceSearchDialog";
import { useAuth } from "@/hooks/useAuth";
import { ClientAvatar } from "@/components/clients/ClientAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getBusinessTypeLabel } from "@/config/plans";
import { useHelpTutorial } from "@/hooks/useHelpTutorial";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeDialogOpen, setPlaceDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [linkingClient, setLinkingClient] = useState<Client | null>(null);

  const { isOpen: showTutorial, open: openTutorial, close: closeTutorial } = useHelpTutorial("/clients");

  const navigate = useNavigate();

  const clientIds = useMemo(() => clients.map((c) => c.id), [clients]);
  const { getStatsForClient } = useClientTasks(clientIds);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const handleClientClick = (clientId: string) => {
    navigate(`/tasks?client=${clientId}`);
  };

  const handleEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditDialogOpen(true);
  };

  const handleDelete = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleLinkPlace = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setLinkingClient(client);
    setPlaceDialogOpen(true);
  };

  const handleUnlinkPlace = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("clients")
        .update({ place_id: null, place_snapshot: null } as any)
        .eq("id", client.id);

      if (error) throw error;
      toast.success("Place ID removido com sucesso!");
      fetchClients();
    } catch (error) {
      console.error("Error unlinking place:", error);
      toast.error("Erro ao remover Place ID");
    }
  };

  const getPlaceSnapshot = (client: Client): any => {
    return (client as any).place_snapshot || null;
  };

  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true;
    return client.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <AppLayout title="Meus Clientes" subtitle="Gerencie todos os seus clientes em um só lugar">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 !bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Carregando clientes…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Meus Clientes"
      subtitle="Gerencie todos os seus clientes em um só lugar"
      headerActions={
        <div className="flex items-center gap-2 relative">
          {/* Botão de Ajuda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openTutorial}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
            title="Como funciona?"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Botão Principal Azul */}
          <Button onClick={() => navigate("/onboarding")} variant="default" className="rounded-xl shadow-md font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cliente
          </Button>

          {/* Tutorial Bubble */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-14 z-50 w-80 bg-blue-600 text-white p-5 rounded-2xl shadow-xl shadow-blue-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm">Gerencie sua Carteira</h3>
                  </div>
                  <button
                    onClick={closeTutorial}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-sm text-blue-50">
                  <ul className="space-y-2 list-none">
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        1
                      </span>
                      <span>Cadastre empresas clicando no botão "Adicionar Cliente".</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        2
                      </span>
                      <span>
                        Conecte o <strong>Google Places ID</strong> para sincronizar avaliações e dados.
                      </span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        3
                      </span>
                      <span>Clique em um cliente para ver suas tarefas específicas.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeTutorial}
                    className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    Entendi <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Seta do balão apontando para cima (perto dos botões) */}
                <div className="absolute -top-2 right-12 w-4 h-4 bg-blue-600 rotate-45 transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-full !bg-white !text-slate-900 border border-slate-200 shadow-sm focus-visible:ring-blue-600 placeholder:text-slate-500"
          />
        </div>

        {filteredClients.length === 0 ? (
          <motion.div
            className="rounded-2xl !bg-white border border-slate-200 shadow-sm p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-slate-900">
              {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Tente ajustar sua busca para encontrar o cliente desejado."
                : "Adicione seu primeiro cliente para começar a gerenciar seus negócios de forma eficiente."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate("/onboarding")}
                variant="default"
                className="rounded-xl shadow-md font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {filteredClients.map((client, index) => {
              const stats = getStatsForClient(client.id);
              const placeSnapshot = getPlaceSnapshot(client);
              const hasPlaceId = !!(client as any).place_id;

              return (
                <motion.div
                  key={client.id}
                  className="rounded-2xl !bg-white !text-slate-900 border border-slate-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleClientClick(client.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl !bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-lg overflow-hidden group-hover:border-blue-200 transition-colors">
                        <ClientAvatar avatarUrl={(client as any).avatar_url} clientName={client.name} />
                      </div>
                      <div>
                        <h3 className="font-bold group-hover:text-blue-600 transition-colors text-slate-900 line-clamp-1">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Building2 className="h-3 w-3" />
                          <span className="capitalize">{getBusinessTypeLabel(client.business_type)}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-xl border-slate-200 !bg-white shadow-xl min-w-[180px]"
                      >
                        <DropdownMenuItem
                          onClick={(e) => handleEdit(client, e as any)}
                          className="font-medium text-slate-600 focus:text-blue-600 focus:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>

                        {hasPlaceId ? (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => handleLinkPlace(client, e as any)}
                              className="font-medium text-slate-600 focus:text-blue-600 focus:bg-blue-50"
                            >
                              <LinkIcon className="h-4 w-4 mr-2" /> Trocar Place ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleUnlinkPlace(client, e as any)}
                              className="font-medium text-slate-600 focus:text-amber-600 focus:bg-amber-50"
                            >
                              <Unlink className="h-4 w-4 mr-2" /> Desvincular
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => handleLinkPlace(client, e as any)}
                            className="font-medium text-slate-600 focus:text-blue-600 focus:bg-blue-50"
                          >
                            <LinkIcon className="h-4 w-4 mr-2" /> Conectar Google
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(client, e as any)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 font-medium"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {client.address && (
                    <div className="flex items-start gap-2 text-sm text-slate-500 mb-4 h-10">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-400" />
                      <span className="line-clamp-2 leading-tight">{client.address}</span>
                    </div>
                  )}

                  {hasPlaceId && placeSnapshot && (
                    <div className="mb-4 p-2.5 rounded-xl !bg-blue-50 border border-blue-100 flex items-center gap-2.5">
                      <div className="bg-white p-1 rounded-lg border border-blue-100 shadow-sm">
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-blue-700 font-bold flex-1 truncate">
                        {placeSnapshot.name || "Google Vinculado"}
                      </span>
                      {placeSnapshot.rating && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-white px-1.5 py-0.5 rounded border border-amber-100">
                          {placeSnapshot.rating} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-4 p-3 rounded-xl !bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ListTodo className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Progresso Semanal
                      </span>
                    </div>
                    <ClientTaskProgress
                      pending={stats.pending}
                      inProgress={stats.in_progress}
                      completed={stats.completed}
                      total={stats.total}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Badge
                      variant="outline"
                      className={
                        client.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }
                    >
                      {client.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-[10px] font-medium text-slate-400">
                      Desde {new Date(client.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={editingClient}
        onSuccess={fetchClients}
      />

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={deletingClient}
        onSuccess={fetchClients}
      />

      <PlaceSearchDialog
        open={placeDialogOpen}
        onOpenChange={setPlaceDialogOpen}
        clientId={linkingClient?.id || ""}
        clientName={linkingClient?.name || ""}
        clientAddress={linkingClient?.address || ""}
        currentPlaceId={(linkingClient as any)?.place_id}
        onSuccess={fetchClients}
      />
    </AppLayout>
  );
}
