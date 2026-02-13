import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

  const navigate = useNavigate();
  const { getStatsForClient } = useClientTasks();

  const fetchClients = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

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
