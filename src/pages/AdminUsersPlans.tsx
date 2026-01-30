import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Crown, UserCog, Loader2, Search, MoreVertical, Mail, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { PLAN_LABELS, PLAN_LIMITS, formatClientLimit } from "@/config/plans";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];
type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

interface UserWithRole extends Profile {
  email?: string;
  roles: AppRole[];
}

const planColors: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  tatico: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  pro: "bg-primary/20 text-primary border-primary/30",
  elite: "bg-accent/20 text-accent border-accent/30",
  agency: "bg-success/20 text-success border-success border-success/30",
};

const planLabels = PLAN_LABELS;

export default function AdminUsersPlans() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);

  const fetchUsers = async (token?: string) => {
    try {
      setIsLoading(true);

      // Se não veio token, tenta pegar de novo
      let authToken = token;
      if (!authToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData.session?.access_token || undefined;
      }

      // Se ainda não tem token, não falha definitivo — só aguarda onAuthStateChange disparar
      if (!authToken) return;

      const response = await supabase.functions.invoke("admin-list-users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.error) throw response.error;

      const usersWithRoles: UserWithRole[] = response.data?.users || [];
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);

      // Mensagens mais úteis
      const msg =
        error?.message?.includes("Unauthorized") || error?.status === 401
          ? "Acesso negado (faça login novamente)."
          : "Erro ao carregar usuários (verifique Edge Function / permissões).";

      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Ponto-chave: espera a sessão existir e refaz quando o auth muda
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      // tenta com a sessão atual
      await fetchUsers(data.session?.access_token);

      // se não tiver sessão ainda, o listener abaixo vai chamar quando tiver
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.access_token) {
        await fetchUsers(session.access_token);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
        toast.success("Permissão de admin removida");
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
        toast.success("Permissão de admin adicionada");
      }
      await fetchUsers(); // atualiza lista
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error("Erro ao atualizar permissão");
    }
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleUserDeleted = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const name = (user.full_name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const adminUsers = filteredUsers.filter((u) => u.roles?.includes("admin"));
  const normalUsers = filteredUsers.filter((u) => !u.roles?.includes("admin"));

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.roles?.includes("admin")).length;
  const paidPlans = users.filter((u) => u.subscription_plan && u.subscription_plan !== "starter").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Usuários & Planos</h1>
            <p className="text-muted-foreground">Gerencie usuários, administradores e planos</p>
          </div>

          <Button onClick={() => fetchUsers()} variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Atualizar
          </Button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total de Usuários</div>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Administradores</div>
              <div className="text-2xl font-bold">{totalAdmins}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Planos Pagos</div>
              <div className="text-2xl font-bold">{paidPlans}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários ({normalUsers.length})</TabsTrigger>
            <TabsTrigger value="admins">Administradores ({adminUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable
              users={normalUsers}
              isLoading={isLoading}
              onToggleAdmin={toggleAdminRole}
              onDeleteUser={openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="admins">
            <UsersTable
              users={adminUsers}
              isLoading={isLoading}
              onToggleAdmin={toggleAdminRole}
              onDeleteUser={openDeleteDialog}
            />
          </TabsContent>
        </Tabs>

        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          user={userToDelete}
          onSuccess={handleUserDeleted}
        />
      </div>
    </AppLayout>
  );
}

function UsersTable({
  users,
  isLoading,
  onToggleAdmin,
  onDeleteUser,
}: {
  users: UserWithRole[];
  isLoading: boolean;
  onToggleAdmin: (userId: string, currentlyAdmin: boolean) => void;
  onDeleteUser: (user: UserWithRole) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <div className="text-lg font-semibold">Nenhum usuário encontrado</div>
        <div className="text-sm text-muted-foreground">Tente ajustar sua busca</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-4">Usuário</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Plano</th>
              <th className="p-4">Limite</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isAdmin = user.roles?.includes("admin");
              const plan = (user.subscription_plan || "starter") as any;
              const planLabel = planLabels?.[plan as keyof typeof planLabels] || plan;
              const limit = PLAN_LIMITS?.[plan as keyof typeof PLAN_LIMITS] ?? 1;

              return (
                <tr key={user.id} className="border-t border-border/60">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                        {(user.full_name || user.email || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.full_name || "Sem nome"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {user.email || "sem email"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <Badge variant="outline" className="gap-1">
                      <UserCog className="h-3 w-3" />
                      {isAdmin ? "Admin" : "Usuário"}
                    </Badge>
                  </td>

                  <td className="p-4">
                    <Badge className={`border ${planColors?.[plan] || "bg-muted"}`}>{planLabel}</Badge>
                  </td>

                  <td className="p-4">{formatClientLimit(limit)}</td>

                  <td className="p-4">
                    <Badge variant="outline" className="text-success border-success/30">
                      Ativo
                    </Badge>
                  </td>

                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onToggleAdmin(user.user_id || user.id, isAdmin)}
                          className="gap-2"
                        >
                          {isAdmin ? <Shield className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          {isAdmin ? "Remover Admin" : "Tornar Admin"}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => onDeleteUser(user)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir usuário
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
    </div>
  );
}
