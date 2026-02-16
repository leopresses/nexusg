import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess: () => void;
}

export function DeleteClientDialog({ open, onOpenChange, client, onSuccess }: DeleteClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!client) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", client.id);

      if (error) throw error;

      toast.success("Cliente excluído com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Erro ao excluir cliente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Ajustado: !bg-white, texto slate-900 e bordas claras */}
      <AlertDialogContent className="!bg-white !text-slate-900 border-slate-200 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 font-bold">Excluir Cliente</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Tem certeza que deseja excluir o cliente <strong className="text-slate-900">{client?.name}</strong>? Esta
            ação não pode ser desfeita e todas as tarefas associadas serão removidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          {/* Ajustado: Estilo do botão cancelar para o tema claro */}
          <AlertDialogCancel
            disabled={isLoading}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
          >
            Cancelar
          </AlertDialogCancel>

          {/* Ajustado: Botão de ação com tom destrutivo sólido */}
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="!bg-red-600 !text-white hover:!bg-red-700 rounded-xl shadow-sm border-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Excluir Cliente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
