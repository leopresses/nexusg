import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Crown,
  UserCog,
  Loader2,
  Search,
  MoreVertical,
  Mail,
  UserPlus,
  Trash2,
  HelpCircle,
  X,
  ArrowRight,
  Settings,
} from "lucide-react";
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
  starter: "bg-slate-100 text-slate-700 border-slate-200",
  tatico: "bg-blue-50 text-blue-700 border-blue-200",
  pro: "bg-indigo-50 text-indigo-700 border-indigo-200",
  elite: "bg-emerald-50 text-emerald-700 border-emerald-200",
  agency: "bg-violet-50 text-violet-700 border-violet-200",
};

const planLabels = PLAN_LABELS;

export default function AdminUsersPlans() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Estado para o tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const response = await supabase.functions.invoke("admin-list-users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        const status = (response.error as any)?.status;
        if (status === 401) {
          setError("Sessão expirada. Faça login novamente.");
          toast.error("Sessão expirada. Faça login novamente.");
        } else if (status === 403) {
          setError("Acesso restrito a administradores.");
          toast.error("Acesso restrito a administradores.");
        } else {
          throw response.error;
        }
        return;
      }

      const usersWithRoles: UserWithRole[] = response.data?.users || [];
      if (isMountedRef.current) setUsers(usersWithRoles);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Erro ao carregar usuários. Tente novamente.");
      toast.error("Erro ao carregar usuários");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Check tutorial on load
    const hasSeenTutorial = localStorage.getItem("admin_users_tutorial_seen");
    let t: number | undefined;
    if (!hasSeenTutorial) {
      t = window.setTimeout(() => {
        if (isMountedRef.current) setShowTutorial(true);
      }, 1000);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [fetchUsers]);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("admin_users_tutorial_seen", "true");
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      const { error } = await supabase.rpc("admin_manage_role", {
        _target_user_id: userId,
        _role: "admin",
        _operation: currentlyAdmin ? "revoke" : "grant",
      });
      if (error) throw error;
      toast.success(currentlyAdmin ? "Permissão de admin removida" : "Permissão de admin concedida");
      fetchUsers();
    } catch (error: any) {
      console.error("Error toggling admin:", error);
      const msg = error?.message?.includes("Cannot modify your own roles")
        ? "Você não pode alterar suas próprias permissões"
        : "Erro ao alterar permissões";
      toast.error(msg);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: SubscriptionPlan) => {
    try {
      const newLimit = PLAN_LIMITS[newPlan] || 1;
      const { error } = await supabase.rpc("admin_update_user_plan", {
        _user_id: userId,
        _plan: newPlan,
        _clients_limit: newLimit,
      });

      if (error) throw error;
      toast.success(`Plano alterado para ${planLabels[newPlan]}`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Erro ao alterar plano");
    }
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase.rpc("admin_update_user_plan", {
        _user_id: userToDelete.user_id,
        _plan: "starter" as SubscriptionPlan,
        _clients_limit: 0,
      });

      if (error) throw error;
      await supabase.from("user_roles").delete().eq("user_id", userToDelete.user_id).eq("role", "admin");

      toast.success("Usuário desativado com sucesso");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const regularUsers = users.filter((u) => !u.roles.includes("admin"));
  const adminUsers = users.filter((u) => u.roles.includes("admin"));

  const filterUsers = useCallback(
    (list: UserWithRole[]) => {
      return list.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(normalizedQuery) ||
          user.email?.toLowerCase().includes(normalizedQuery) ||
          user.user_id.toLowerCase().includes(normalizedQuery),
      );
    },
    [normalizedQuery],
  );

  const filteredRegularUsers = useMemo(() => filterUsers(regularUsers), [filterUsers, regularUsers]);
  const filteredAdminUsers = useMemo(() => filterUsers(adminUsers), [filterUsers, adminUsers]);

  if (error && !isLoading) {
    return (
      <AppLayout title="Usuários & Planos" subtitle="Gerencie usuários, permissões e planos">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-16 w-16 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-slate-900">Erro ao carregar</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setIsLoading(true);
              fetchUsers();
            }}
            className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700"
          >
            Tentar novamente
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout title="Usuários & Planos" subtitle="Gerencie usuários, permissões e planos">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600">Carregando usuários...</p>
        </div>
      </AppLayout>
    );
  }

  const renderUserTable = (userList: UserWithRole[], showAdminActions: boolean) => (
    <motion.div
      className="rounded-xl !bg-white border border-slate-200 overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Usuário</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Tipo</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Plano</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Limite</th>
              <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Status</th>
              <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {userList.map((user) => {
              const isAdmin = user.roles.includes("admin");
              const isDisabled = user.clients_limit === 0;

              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        <span className="font-bold text-blue-700">
                          {(user.email?.charAt(0) || user.full_name?.charAt(0) || "U").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1 text-slate-900">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="truncate max-w-[200px]">{user.email || user.user_id}</span>
                        </div>
                        <div className="text-sm text-slate-500">{user.full_name || "Sem nome"}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={
                        isAdmin
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }
                    >
                      {isAdmin ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </>
                      ) : (
                        <>
                          <UserCog className="h-3 w-3 mr-1" /> Usuário
                        </>
                      )}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant="outline" className={planColors[user.plan] || planColors.starter}>
                      {planLabels[user.plan] || user.plan}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{formatClientLimit(user.clients_limit)}</span>
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={
                        isDisabled
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {isDisabled ? "Desativado" : "Ativo"}
                    </Badge>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-48">
                        {showAdminActions ? (
                          <DropdownMenuItem
                            onClick={() => toggleAdminRole(user.user_id, true)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover Admin
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => toggleAdminRole(user.user_id, false)}>
                              <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                              Tornar Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        <DropdownMenuItem
                          onClick={() => updateUserPlan(user.user_id, "starter")}
                          disabled={user.plan === "starter"}
                        >
                          Plano {planLabels.starter}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => updateUserPlan(user.user_id, "tatico" as SubscriptionPlan)}
                          disabled={user.plan === "tatico"}
                        >
                          Plano {planLabels.tatico}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => updateUserPlan(user.user_id, "pro")}
                          disabled={user.plan === "pro"}
                        >
                          Plano {planLabels.pro}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => updateUserPlan(user.user_id, "elite")}
                          disabled={user.plan === "elite"}
                        >
                          Plano {planLabels.elite}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => updateUserPlan(user.user_id, "agency")}
                          disabled={user.plan === "agency"}
                        >
                          Plano {planLabels.agency}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Usuário
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

      {userList.length === 0 && (
        <div className="p-12 text-center bg-white">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 mb-1">Nenhum usuário encontrado</h3>
          <p className="text-sm text-slate-500">Tente ajustar sua busca.</p>
        </div>
      )}
    </motion.div>
  );

  return (
    <AppLayout
      title="Usuários & Planos"
      subtitle="Gerencie usuários, permissões e planos"
      headerActions={
        <div className="relative">
          {/* Botão de Ajuda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTutorial(true)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
            title="Como gerenciar usuários?"
          >
            <HelpCircle className="h-5 w-5" />
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
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm">Gestão de Usuários</h3>
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
                      <span>Use as abas para alternar entre Usuários e Administradores.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        2
                      </span>
                      <span>No menu de ações (três pontos), altere o plano de qualquer usuário.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        3
                      </span>
                      <span>Promova usuários a Admin para dar acesso total ao sistema.</span>
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

                {/* Seta do balão */}
                <div className="absolute -top-2 right-3 w-4 h-4 bg-blue-600 rotate-45 transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-slate-600 font-medium text-sm">Total de Usuários</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{users.length}</div>
          </div>

          <div className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-slate-600 font-medium text-sm">Administradores</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{adminUsers.length}</div>
          </div>

          <div className="rounded-2xl !bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Crown className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-slate-600 font-medium text-sm">Planos Pagos</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{users.filter((u) => u.plan !== "starter").length}</div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar usuários por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl !bg-white !text-slate-900 border border-slate-200 shadow-sm focus-visible:ring-blue-600 placeholder:text-slate-400"
          />
        </div>

        {/* Tabs for Users and Admins */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="!bg-slate-100 border border-slate-200 rounded-xl p-1 h-auto">
            {/* ABAS AJUSTADAS PARA AZUL AO ESTAR ATIVAS */}
            <TabsTrigger
              value="users"
              className="gap-2 rounded-lg px-4 py-2 font-medium text-slate-600 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white transition-all shadow-sm"
            >
              <UserCog className="h-4 w-4" />
              Usuários ({regularUsers.length})
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="gap-2 rounded-lg px-4 py-2 font-medium text-slate-600 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white transition-all shadow-sm"
            >
              <Shield className="h-4 w-4" />
              Administradores ({adminUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">{renderUserTable(filteredRegularUsers, false)}</TabsContent>
          <TabsContent value="admins">{renderUserTable(filteredAdminUsers, true)}</TabsContent>
        </Tabs>
      </div>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={userToDelete?.full_name || "Usuário"}
        onConfirm={confirmDeleteUser}
      />
    </AppLayout>
  );
}
