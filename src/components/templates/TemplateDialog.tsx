import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { ChecklistItem } from "@/pages/AdminTemplates";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type BusinessType = Database["public"]["Enums"]["business_type"];

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
  onSuccess: () => void;
}

const businessTypeLabels: Record<BusinessType, string> = {
  restaurant: "Restaurante",
  store: "Loja",
  service: "Serviço",
  other: "Outro",
  cafe_service: "Café/Serviços",
  barbershop_salon: "Barbearia/Salão",
};

export function TemplateDialog({ open, onOpenChange, template, onSuccess }: TemplateDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [targetClientTypes, setTargetClientTypes] = useState<BusinessType[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setFrequency(((template as any).frequency as "daily" | "weekly") || "weekly");
      setTargetClientTypes(((template as any).target_client_types as BusinessType[]) || []);
      setChecklist((template.checklist as unknown as ChecklistItem[]) || []);
    } else {
      setTitle("");
      setDescription("");
      setFrequency("weekly");
      setTargetClientTypes([]);
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

  const handleToggleClientType = (type: BusinessType) => {
    setTargetClientTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      const templateData = {
        title: title.trim(),
        description: description.trim() || null,
        checklist: JSON.parse(JSON.stringify(checklist)),
        frequency,
        target_client_types: targetClientTypes.length > 0 ? targetClientTypes : null,
      };

      if (template) {
        const { error } = await supabase.from("task_templates").update(templateData).eq("id", template.id);

        if (error) throw error;
        toast.success("Template atualizado com sucesso");
      } else {
        const { error } = await supabase.from("task_templates").insert([
          {
            ...templateData,
            created_by: user?.id,
          },
        ]);

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
      <DialogContent
        className={[
          // Mantém layout/tamanho, só deixa premium e claro
          "max-w-lg max-h-[90vh] overflow-y-auto",
          // Visual SaaS 2026 (claro, glass, elegante)
          "bg-white/95 backdrop-blur-xl",
          "border border-slate-200/80",
          "shadow-[0_20px_70px_-20px_rgba(15,23,42,0.35)]",
          "rounded-2xl",
          // Micro-interações suaves
          "transition-transform duration-200 will-change-transform",
        ].join(" ")}
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900">{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-800">
              Título *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Responder avaliações do Google"
              maxLength={100}
              className={[
                "h-11",
                "bg-white",
                "border-slate-200",
                "text-slate-900",
                "placeholder:text-slate-400",
                "focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/40",
                "transition-shadow",
              ].join(" ")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-800">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta tarefa..."
              rows={3}
              maxLength={500}
              className={[
                "bg-white",
                "border-slate-200",
                "text-slate-900",
                "placeholder:text-slate-400",
                "focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/40",
                "transition-shadow",
              ].join(" ")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-slate-800">
                Frequência
              </Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as "daily" | "weekly")}>
                <SelectTrigger
                  className={[
                    "h-11",
                    "bg-white",
                    "border-slate-200",
                    "text-slate-900",
                    "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40",
                    "transition-shadow",
                  ].join(" ")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl rounded-xl">
                  <SelectItem value="daily" className="cursor-pointer">
                    Diária
                  </SelectItem>
                  <SelectItem value="weekly" className="cursor-pointer">
                    Semanal
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-800">Tipos de Cliente (deixe vazio para todos)</Label>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(businessTypeLabels) as BusinessType[]).map((type) => (
                <div
                  key={type}
                  className={[
                    "flex items-center space-x-2",
                    "rounded-xl px-2 py-2",
                    "border border-transparent",
                    "hover:bg-slate-50",
                    "hover:border-slate-200/80",
                    "transition-colors",
                  ].join(" ")}
                >
                  <Checkbox
                    id={`type-${type}`}
                    checked={targetClientTypes.includes(type)}
                    onCheckedChange={() => handleToggleClientType(type)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium leading-none text-slate-700 select-none"
                  >
                    {businessTypeLabels[type]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-800">Checklist</Label>

            {checklist.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={[
                      "flex items-center gap-2 p-2 rounded-xl",
                      "bg-slate-50",
                      "border border-slate-200/70",
                      "group",
                      "transition-colors",
                      "hover:bg-white",
                    ].join(" ")}
                  >
                    <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="flex-1 text-sm truncate text-slate-800">{item.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={[
                        "h-7 w-7",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity",
                        "hover:bg-red-50",
                      ].join(" ")}
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
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
                className={[
                  "h-11",
                  "bg-white",
                  "border-slate-200",
                  "text-slate-900",
                  "placeholder:text-slate-400",
                  "focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/40",
                ].join(" ")}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className={[
                  "h-11 px-4",
                  "bg-slate-100",
                  "text-slate-900",
                  "border border-slate-200",
                  "hover:bg-slate-200/70",
                  "transition-colors",
                ].join(" ")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-500">Pressione Enter ou clique no botão + para adicionar</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className={["border-slate-200", "text-slate-900", "hover:bg-slate-50", "transition-colors"].join(" ")}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className={[
                "bg-blue-600 hover:bg-blue-700",
                "text-white",
                "shadow-[0_10px_30px_-15px_rgba(37,99,235,0.9)]",
                "transition-all duration-200",
                "hover:translate-y-[-1px]",
                "active:translate-y-0",
              ].join(" ")}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {template ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
