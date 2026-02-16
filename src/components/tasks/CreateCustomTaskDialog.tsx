import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface CreateCustomTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  selectedClientId?: string;
  onSuccess: () => void;
}

export function CreateCustomTaskDialog({
  open,
  onOpenChange,
  clients,
  selectedClientId,
  onSuccess,
}: CreateCustomTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState(selectedClientId || "");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  // Estilo padrão para os balões azuis
  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !clientId) {
      toast.error("Preencha todos os campos obrigatórios", toastStyle);
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

      const { error } = await supabase.from("tasks").insert({
        client_id: clientId,
        title: title.trim(),
        description: description.trim() || null,
        frequency,
        is_custom: true,
        status: "pending",
        week_start: weekStart.toISOString().split("T")[0],
        task_date: frequency === "daily" ? today.toISOString().split("T")[0] : null,
        checklist: [],
      });

      if (error) throw error;

      toast.success("Tarefa personalizada criada!", toastStyle);
      onSuccess();
      onOpenChange(false);

      // Reset form
      setTitle("");
      setDescription("");
      setFrequency("daily");
    } catch (error) {
      console.error("Error creating custom task:", error);
      toast.error("Erro ao criar tarefa", toastStyle);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal ajustado para Tema Branco Premium */}
      <DialogContent className="sm:max-w-[500px] !bg-white !text-slate-900 border-slate-200 shadow-2xl rounded-[32px] p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            Nova Tarefa Personalizada
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-base">
            Crie uma tarefa específica para este cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="client" className="text-slate-700 font-bold">
              Cliente *
            </Label>
            <Select value={clientId} onValueChange={setClientId} disabled={!!selectedClientId}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200 !bg-white !text-slate-900 shadow-sm focus:ring-blue-500">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent className="!bg-white border-slate-200">
                {clients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id}
                    className="text-slate-700 focus:bg-slate-50 focus:text-blue-600"
                  >
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700 font-bold">
              Título *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Atualizar promoção especial"
              maxLength={100}
              className="h-12 rounded-xl border-slate-200 !bg-white !text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-blue-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 font-bold">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={3}
              maxLength={500}
              className="rounded-xl border-slate-200 !bg-white !text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-blue-600 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-slate-700 font-bold">
              Frequência
            </Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as "daily" | "weekly")}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200 !bg-white !text-slate-900 shadow-sm focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!bg-white border-slate-200">
                <SelectItem value="daily" className="text-slate-700 focus:bg-slate-50 focus:text-blue-600">
                  Diária
                </SelectItem>
                <SelectItem value="weekly" className="text-slate-700 focus:bg-slate-50 focus:text-blue-600">
                  Semanal
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-xl !bg-blue-600 !text-white hover:!bg-blue-700 shadow-lg shadow-blue-200 font-bold"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
