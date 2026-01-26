import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Users,
  Crown,
  UserCog,
  Loader2,
  Search,
  MoreVertical,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];
type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

interface UserWithRole extends Profile {
  email?: string;
  roles: AppRole[];
}

const planColors: Record<SubscriptionPlan, string> = {
  starter: "bg-muted text-muted-foreground",
  pro: "bg-primary/20 text-primary border-primary/30",
  elite: "bg-accent/20 text-accent border-accent/30",
  agency: "bg-success/20 text-success border-success/30",
};

const planLabels: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
  agency: "Agency",
};

export default function AdminUsersPlans() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles (admin can see all via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
        toast.success("Permissão de admin removida");
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
        toast.success("Permissão de admin concedida");
      }

      fetchUsers();
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast.error("Erro ao alterar permissões");
    }
  };

  const updateUserPlan = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      // Get new clients_limit based on plan
      const newLimit = newPlan === 'starter' ? 1 
        : newPlan === 'pro' ? 3 
        : newPlan === 'elite' ? 10 
        : 999999; // agency = unlimited

      const { error } = await supabase
        .from("profiles")
        .update({ plan: newPlan, clients_limit: newLimit })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success(`Plano alterado para ${planLabels[newPlan]}`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Erro ao alterar plano");
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout title="Usuários & Planos" subtitle="Gerencie usuários, permissões e planos">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Usuários & Planos" 
      subtitle="Gerencie usuários, permissões e planos"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-muted-foreground">Total de Usuários</span>
            </div>
            <div className="text-3xl font-bold">{users.length}</div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <span className="text-muted-foreground">Administradores</span>
            </div>
            <div className="text-3xl font-bold">
              {users.filter((u) => u.roles.includes("admin")).length}
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-success" />
              </div>
              <span className="text-muted-foreground">Planos Pagos</span>
            </div>
            <div className="text-3xl font-bold">
              {users.filter((u) => u.plan !== "starter").length}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <motion.div 
          className="rounded-xl bg-card border border-border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Plano</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const isAdmin = user.roles.includes("admin");

                  return (
                    <tr key={user.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {user.full_name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name || "Sem nome"}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{user.user_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline"
                          className={isAdmin 
                            ? "bg-accent/20 text-accent border-accent/30" 
                            : "bg-muted text-muted-foreground"
                          }
                        >
                          {isAdmin ? (
                            <><Shield className="h-3 w-3 mr-1" /> Admin</>
                          ) : (
                            <><UserCog className="h-3 w-3 mr-1" /> Usuário</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline"
                          className={planColors[user.plan]}
                        >
                          {planLabels[user.plan]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline"
                          className="bg-success/20 text-success border-success/30"
                        >
                          Ativo
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => toggleAdminRole(user.user_id, isAdmin)}
                            >
                              {isAdmin ? "Remover Admin" : "Tornar Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateUserPlan(user.user_id, "starter")}
                              disabled={user.plan === "starter"}
                            >
                              Plano Starter
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateUserPlan(user.user_id, "pro")}
                              disabled={user.plan === "pro"}
                            >
                              Plano Pro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateUserPlan(user.user_id, "elite")}
                              disabled={user.plan === "elite"}
                            >
                              Plano Elite
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateUserPlan(user.user_id, "agency")}
                              disabled={user.plan === "agency"}
                            >
                              Plano Agency
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum usuário encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar sua busca.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
