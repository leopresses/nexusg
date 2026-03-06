import { forwardRef } from "react";
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

export const DeleteReportDialog = forwardRef<HTMLDivElement, DeleteReportDialogProps>(
  function DeleteReportDialog({ open, onOpenChange, reportName, onConfirm }, ref) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent ref={ref}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Relatório
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório <strong>"{reportName}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);
