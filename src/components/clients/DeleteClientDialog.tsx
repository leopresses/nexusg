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

  // Estilo centralizado para os balões azuis
  const toastStyle = {
    className: "!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-4 font-bold",
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!client) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", client.id);

      if (error) throw error;

      // LINHA AJUSTADA: Balão azul de alto contraste
      toast.success("Cliente excluído com sucesso!", toastStyle);

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Erro ao excluir cliente", toastStyle);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Container garantido no tema branco com respiro premium */}
      <AlertDialogContent className="!bg-white !text-slate-900 border-slate-200 shadow-2xl rounded-[32px] p-8 border">
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-600" />
            Excluir Cliente
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 text-base leading-relaxed">
            Tem certeza que deseja excluir o cliente <strong className="text-slate-900">{client?.name}</strong>? Esta
            ação não pode ser desfeita e todas as tarefas associadas serão removidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            disabled={isLoading}
            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="h-12 px-8 rounded-xl !bg-red-600 !text-white hover:!bg-red-700 shadow-lg shadow-red-100 transition-all border-0 font-bold"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
