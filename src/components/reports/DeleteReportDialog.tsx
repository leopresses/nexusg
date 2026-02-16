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
import { Trash2 } from "lucide-react";

interface DeleteReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName: string;
  onConfirm: () => void;
}

export function DeleteReportDialog({ open, onOpenChange, reportName, onConfirm }: DeleteReportDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Ajustado: !bg-white e !text-slate-900 para garantir o tema claro e rounded-3xl para o estilo premium */}
      <AlertDialogContent className="!bg-white !text-slate-900 border-slate-200 shadow-2xl rounded-[32px] p-8 border">
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            {/* Ícone com vermelho vibrante para indicar ação crítica */}
            <Trash2 className="h-6 w-6 text-red-600" />
            Excluir Relatório
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 text-base leading-relaxed">
            Tem certeza que deseja excluir o relatório <strong className="text-slate-900">"{reportName}"</strong>? Esta
            ação não pode ser desfeita e os dados serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          {/* Botão Cancelar com estilo clean */}
          <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium">
            Cancelar
          </AlertDialogCancel>
          {/* Botão Excluir forçado para vermelho sólido (tema branco) */}
          <AlertDialogAction
            onClick={onConfirm}
            className="h-12 px-8 rounded-xl !bg-red-600 !text-white hover:!bg-red-700 shadow-lg shadow-red-100 transition-all border-0 font-bold"
          >
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
