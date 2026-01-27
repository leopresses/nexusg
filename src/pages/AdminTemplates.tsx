import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TaskTemplate | null>(null);
  const [isSendingTasks, setIsSendingTasks] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .order("created_at", { ascending: false });

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
      const { error } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", deletingTemplate.id);

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
      const { error } = await supabase.rpc('generate_weekly_tasks_for_all_clients');
      
      if (error) throw error;
      
      toast.success("Templates sincronizados para todos os clientes ativos!");
    } catch (error) {
      console.error("Error sending tasks:", error);
      toast.error("Erro ao sincronizar templates");
    } finally {
      setIsSendingTasks(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = templates.filter((t) => t.is_active).length;

  if (isLoading) {
    return (
      <AppLayout title="Templates de Tarefas" subtitle="Gerencie os templates do método">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          >
            {isSendingTasks ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Sincronizar para Todos
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
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
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className="text-muted-foreground">Total de Templates</span>
            </div>
            <div className="text-3xl font-bold">{templates.length}</div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-success" />
              </div>
              <span className="text-muted-foreground">Templates Ativos</span>
            </div>
            <div className="text-3xl font-bold">{activeCount}</div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Templates Inativos</span>
            </div>
            <div className="text-3xl font-bold">{templates.length - activeCount}</div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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
            
            return (
              <div 
                key={template.id}
                className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{template.title}</h3>
                      <Badge 
                        variant="outline"
                        className={template.is_active 
                          ? "bg-success/20 text-success border-success/30" 
                          : "bg-muted text-muted-foreground"
                        }
                      >
                        {template.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {checklist.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListChecks className="h-4 w-4" />
                        <span>{checklist.length} itens no checklist</span>
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
            <div className="rounded-xl bg-card border border-border p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum template encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Tente ajustar sua busca." 
                  : "Crie seu primeiro template de tarefa."
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
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
    </AppLayout>
  );
}
