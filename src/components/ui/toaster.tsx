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
            // AJUSTE: Fundo azul sólido (!bg-blue-600) e texto branco para máximo contraste
            className="!bg-blue-600 !text-white border-none shadow-2xl rounded-2xl p-5"
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm font-bold text-white">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs text-blue-50/90 font-medium">{description}</ToastDescription>
              )}
            </div>
            {action}
            {/* Ajustado: Botão de fechar branco para visibilidade no fundo azul */}
            <ToastClose className="text-white/70 hover:text-white transition-colors" />
          </Toast>
        );
      })}
      {/* Posicionamento do Viewport */}
      <ToastViewport className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-[380px]" />
    </ToastProvider>
  );
}
