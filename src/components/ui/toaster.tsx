import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            // AJUSTE: Forçando fundo branco, texto escuro e bordas suaves globalmente
            className="!bg-white !text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-4"
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm font-bold text-slate-900">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs text-slate-600 font-medium">{description}</ToastDescription>
              )}
            </div>
            {action}
            {/* Ajustado: Botão de fechar com cor discreta */}
            <ToastClose className="text-slate-400 hover:text-slate-900 transition-colors" />
          </Toast>
        );
      })}
      <ToastViewport className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-[420px]" />
    </ToastProvider>
  );
}
