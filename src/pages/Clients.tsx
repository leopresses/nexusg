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

type Client = Database["public"]["Tables"]["clients"]["Row"];

const businessTypeLabels: Record<string, string> = {
  restaurant: "Restaurante",
  store: "Loja",
  service: "Serviço",
  other: "Outro",
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const clientIds = clients.map(c => c.id);
  const { getStatsForClient, isLoading: isLoadingTasks } = useClientTasks(clientIds);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    businessTypeLabels[client.business_type]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClientClick = (clientId: string) => {
    navigate(`/tasks?client=${clientId}`);
  };

  if (isLoading) {
    return (
      <AppLayout title="Meus Clientes" subtitle="Gerencie todos os seus clientes em um só lugar">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Meus Clientes" 
      subtitle="Gerencie todos os seus clientes em um só lugar"
      headerActions={
        <Button onClick={() => navigate("/onboarding")}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <motion.div 
            className="rounded-xl bg-card border border-border p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? "Tente ajustar sua busca para encontrar o cliente desejado."
                : "Adicione seu primeiro cliente para começar a gerenciar seus negócios de forma eficiente."
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate("/onboarding")}>
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
              
              return (
                <motion.div
                  key={client.id}
                  className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleClientClick(client.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl gradient-neon flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{businessTypeLabels[client.business_type]}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {client.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}

                  {/* Task Progress Section */}
                  <div className="mb-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ListTodo className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tarefas da Semana</span>
                    </div>
                    <ClientTaskProgress
                      pending={stats.pending}
                      inProgress={stats.in_progress}
                      completed={stats.completed}
                      total={stats.total}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Badge 
                      variant="outline"
                      className={client.is_active 
                        ? "bg-success/20 text-success border-success/30" 
                        : "bg-muted text-muted-foreground"
                      }
                    >
                      {client.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
