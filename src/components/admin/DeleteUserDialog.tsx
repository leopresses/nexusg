import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const confirmWord = "EXCLUIR";

  const handleConfirm = () => {
    if (confirmText === confirmWord) {
      onConfirm();
      setConfirmText("");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText("");
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Usuário
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir o usuário <strong>"{userName}"</strong>?
              </p>
              <p className="text-destructive font-medium">
                Esta ação irá:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Desativar a conta do usuário</li>
                <li>Remover acesso ao sistema</li>
                <li>Manter dados históricos para auditoria</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="confirm">
                  Digite <strong>{confirmWord}</strong> para confirmar:
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder={confirmWord}
                  className="mt-2"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmText !== confirmWord}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Usuário
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
