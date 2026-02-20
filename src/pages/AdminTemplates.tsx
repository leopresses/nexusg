import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Loader2,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  CheckSquare,
  ListChecks,
  Send,
  Calendar,
  CalendarDays,
  Tag,
  Workflow,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { TemplateDialog } from "@/components/templates/TemplateDialog";
import { DeleteTemplateDialog } from "@/components/templates/DeleteTemplateDialog";
import { useHelpTour } from "@/hooks/useHelpTour";
import { HelpFab } from "@/components/help/HelpFab";
import { HelpModal } from "@/components/help/HelpModal";

const HELP_STEPS = [
  { text: "Crie templates que serão transformados em tarefas para todos os clientes ativos." },
  { text: "Defina se a tarefa deve se repetir diariamente ou semanalmente." },
  { text: "Use \"Sincronizar\" para distribuir novos templates imediatamente para todos os clientes." },
  { text: "Edite ou exclua templates pelo menu (⋮) de cada card." },
];

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type BusinessType = Database["public"]["Enums"]["business_type"];

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const businessTypeLabels: Record<BusinessType, string> = {
  restaurant: "Restaurante",
  store: "Loja",
  service: "Serviço",
  other: "Outro",
  cafe_service: "Café/Serviços",
  barbershop_salon: "Barbearia/Salão",
};

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TaskTemplate | null>(null);
  const [isSendingTasks, setIsSendingTasks] = useState(false);

  const { isOpen, open, close } = useHelpTour("admin-templates");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = (template: TaskTemplate) => {
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTemplate) return;

    try {
      // First, delete all pending tasks associated with this template
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("template_id", deletingTemplate.id)
        .eq("status", "pending");

      if (tasksError) {
        console.error("Error deleting associated tasks:", tasksError);
        // Continue with template deletion even if task deletion fails
      }

      // Then delete the template itself
      const { error } = await supabase.from("task_templates").delete().eq("id", deletingTemplate.id);

      if (error) throw error;
      toast.success("Template e tarefas pendentes excluídos com sucesso");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erro ao excluir template");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
    }
  };

  const toggleActive = async (template: TaskTemplate) => {
    try {
      const { error } = await supabase
        .from("task_templates")
        .update({ is_active: !template.is_active })
        .eq("id", template.id);

      if (error) throw error;
      toast.success(template.is_active ? "Template desativado" : "Template ativado");
      fetchTemplates();
    } catch (error) {
      console.error("Error toggling template:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const sendTasksToAllUsers = async () => {
    setIsSendingTasks(true);
    try {
      const { error } = await supabase.rpc("generate_weekly_tasks_for_all_clients");

      if (error) throw error;

      toast.success("Templates sincronizados para todos os clientes ativos!");
    } catch (error) {
      console.error("Error sending tasks:", error);
      toast.error("Erro ao sincronizar templates");
    } finally {
      setIsSendingTasks(false);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = templates.filter((t) => t.is_active).length;
  const dailyCount = templates.filter((t) => (t as any).frequency === "daily").length;
  const weeklyCount = templates.filter((t) => (t as any).frequency !== "daily").length;

  if (isLoading) {
    return (
      <AppLayout title="Templates de Tarefas" subtitle="Gerencie os templates do método">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Templates de Tarefas"
      subtitle="Gerencie os templates do método"
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={sendTasksToAllUsers}
            disabled={isSendingTasks}
            className="h-10 rounded-xl !bg-white !text-slate-700 border !border-slate-200 hover:!bg-slate-50"
          >
            {isSendingTasks ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
            ) : (
              <Send className="h-4 w-4 mr-2 text-blue-600" />
            )}
            Sincronizar
          </Button>
          <Button onClick={handleCreate} className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-slate-600">Total</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{templates.length}</div>
          </div>

          <div className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-slate-600">Ativos</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{activeCount}</div>
          </div>

          <div className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-slate-600">Diários</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{dailyCount}</div>
          </div>

          <div className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-slate-600">Semanais</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{weeklyCount}</div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl !bg-white !text-slate-900 border border-slate-200 shadow-sm
            focus-visible:ring-2 focus-visible:ring-blue-500 placeholder:text-slate-500"
          />
        </div>

        {/* Templates List */}
        <motion.div
          className="grid gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {filteredTemplates.map((template) => {
            const checklist = (template.checklist as unknown as ChecklistItem[]) || [];
            const frequency = (template as any).frequency || "weekly";
            const targetTypes = ((template as any).target_client_types as BusinessType[]) || [];

            return (
              <div
                key={template.id}
                className="rounded-xl !bg-white border border-slate-200 p-5 shadow-sm hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg truncate text-slate-900">{template.title}</h3>

                      <Badge
                        variant="outline"
                        className={
                          template.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }
                      >
                        {template.is_active ? "Ativo" : "Inativo"}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          frequency === "daily"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {frequency === "daily" ? (
                          <>
                            <Calendar className="h-3 w-3 mr-1" /> Diária
                          </>
                        ) : (
                          <>
                            <CalendarDays className="h-3 w-3 mr-1" /> Semanal
                          </>
                        )}
                      </Badge>
                    </div>

                    {template.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.description}</p>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      {checklist.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <ListChecks className="h-4 w-4" />
                          <span>{checklist.length} itens</span>
                        </div>
                      )}

                      {targetTypes.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Tag className="h-4 w-4" />
                          <span>{targetTypes.map((t) => businessTypeLabels[t]).join(", ")}</span>
                        </div>
                      )}

                      {targetTypes.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Tag className="h-4 w-4" />
                          <span>Todos os tipos</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-700 hover:!bg-slate-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => toggleActive(template)}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        {template.is_active ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDelete(template)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="rounded-xl !bg-white border border-slate-200 p-12 text-center shadow-sm">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-medium mb-2 text-slate-900">Nenhum template encontrado</h3>
              <p className="text-sm text-slate-600 mb-4">
                {searchQuery ? "Tente ajustar sua busca." : "Crie seu primeiro template de tarefa."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate} className="h-10 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSuccess={fetchTemplates}
      />

      <DeleteTemplateDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        template={deletingTemplate}
        onConfirm={confirmDelete}
      />
      <HelpFab onOpen={open} />
      <HelpModal
        isOpen={isOpen}
        onClose={close}
        title="Templates de Tarefas"
        subtitle="Automatize a geração de tarefas para seus clientes."
        steps={HELP_STEPS}
      />
    </AppLayout>
  );
}
