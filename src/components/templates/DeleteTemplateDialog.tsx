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
import type { Database } from "@/integrations/supabase/types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
  onConfirm: () => void;
}

export function DeleteTemplateDialog({ 
  open, 
  onOpenChange, 
  template, 
  onConfirm 
}: DeleteTemplateDialogProps) {
  if (!template) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Template</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o template "{template.title}"? 
            Esta ação não pode ser desfeita. <strong>Todas as tarefas pendentes</strong> criadas 
            a partir deste template serão excluídas. Tarefas em andamento ou concluídas 
            não serão afetadas.
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
