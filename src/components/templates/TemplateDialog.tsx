import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { ChecklistItem } from "@/pages/AdminTemplates";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
  onSuccess: () => void;
}

export function TemplateDialog({ open, onOpenChange, template, onSuccess }: TemplateDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setChecklist((template.checklist as unknown as ChecklistItem[]) || []);
    } else {
      setTitle("");
      setDescription("");
      setChecklist([]);
    }
    setNewItem("");
  }, [template, open]);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    setChecklist([
      ...checklist,
      {
        id: crypto.randomUUID(),
        text: newItem.trim(),
        completed: false,
      },
    ]);
    setNewItem("");
  };

  const handleRemoveItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from("task_templates")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            checklist: JSON.parse(JSON.stringify(checklist)),
          })
          .eq("id", template.id);

        if (error) throw error;
        toast.success("Template atualizado com sucesso");
      } else {
        // Create new template
        const { error } = await supabase
          .from("task_templates")
          .insert([{
            title: title.trim(),
            description: description.trim() || null,
            checklist: JSON.parse(JSON.stringify(checklist)),
            created_by: user?.id,
          }]);

        if (error) throw error;
        toast.success("Template criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erro ao salvar template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template" : "Novo Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Responder avaliações do Google"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta tarefa..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-3">
            <Label>Checklist</Label>
            
            {checklist.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {checklist.map((item, index) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 group"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">{item.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Adicionar item ao checklist..."
                maxLength={150}
              />
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleAddItem}
                disabled={!newItem.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Pressione Enter ou clique no botão + para adicionar
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {template ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
