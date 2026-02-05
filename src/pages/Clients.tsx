import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Link as LinkIcon,
  MapPin,
  Pencil,
  Phone,
  Search,
  Star,
  Trash2,
  Unlink,
  Globe,
  ListTodo,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { ClientAvatar } from "@/components/clients/ClientAvatar";
import { ClientTaskProgress } from "@/components/clients/ClientTaskProgress";
import { useClientTasks } from "@/hooks/useClientTasks";

import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { PlaceSearchDialog } from "@/components/places/PlaceSearchDialog";
import { getBusinessTypeLabel } from "@/config/plans";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

type FilterTab = "all" | "active" | "inactive";

function clampText(v?: string | null) {
  return (v || "").trim();
}

function getSnapshot(client: Client): any {
  return (client as any).place_snapshot || null;
}

function getClientActive(client: Client) {
  // seu schema atual usa `is_active`
  // se no futuro virar `status`, você pode ajustar aqui.
  return !!(client as any).is_active;
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rounded;
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? "text-amber-400" : "text-slate-200"}`}
            fill={filled ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<FilterTab>("all");
  const [q, setQ] = useState("");

  const [selectedId, setSelectedId] = useState<string>(() => params.get("selected") || "");
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedId) || null,
    [clients, selectedId]
  );

  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // dialogs
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [linkingClient, setLinkingClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeDialogOpen, setPlaceDialogOpen] = useState(false);

  const clientIds = useMemo(() => clients.map((c) => c.id), [clients]);
  const { getStatsForClient, isLoading: statsLoading } = useClientTasks(clientIds);

  useEffect(() => {
    void fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sincroniza selected com querystring
  useEffect(() => {
    const fromUrl = params.get("selected") || "";
    if (fromUrl && fromUrl !== selectedId) setSelectedId(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // seleciona o primeiro cliente automaticamente
  useEffect(() => {
    if (!selectedId && clients.length > 0) {
      const first = clients[0].id;
      setSelectedId(first);
      setParams({ selected: first }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);

  // carrega tarefas recentes do cliente selecionado
  useEffect(() => {
    if (!selectedClient) {
      setRecentTasks([]);
      return;
    }
    void fetchRecentTasks(selectedClient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentTasks = async (clientId: string) => {
    setTasksLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecentTasks(data || []);
    } catch (e) {
      console.error(e);
      setRecentTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = q.trim().toLowerCase();

    return clients.filter((c) => {
      const active = getClientActive(c);
      const passTab =
        tab === "all" ? true : tab === "active" ? active : !active;

      const passQuery =
        !query ||
        c.name.toLowerCase().includes(query) ||
        getBusinessTypeLabel(c.business_type).toLowerCase().includes(query) ||
        (c.address || "").toLowerCase().includes(query);

      return passTab && passQuery;
    });
  }, [clients, tab, q]);

  const selectClient = (id: string) => {
    setSelectedId(id);
    setParams({ selected: id }, { replace: true });
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setEditDialogOpen(true);
  };

  const openDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const openLink = (client: Client) => {
    setLinkingClient(client);
    setPlaceDialogOpen(true);
  };

  const unlinkPlace = async (client: Client) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          place_id: null,
          google_maps_url: null,
          place_snapshot: null,
          place_last_sync_at: null,
        } as any)
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Place ID removido com sucesso!");
      await fetchClients();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover Place ID");
    }
  };

  const headerActions = (
    <Button
      className="rounded-xl bg-[#2D62F1] hover:bg-[#2457E6] text-white"
      onClick={() => navigate("/onboarding")}
    >
      Novo Cliente
    </Button>
  );

  if (isLoading) {
    return (
      <AppLayout headerActions={headerActions}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#2D62F1]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerActions={headerActions}>
      <div c
