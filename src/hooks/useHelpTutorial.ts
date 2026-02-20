import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook robusto para controlar tutoriais contextuais por página.
 *
 * Regras:
 * - Abre automaticamente APENAS na primeira visita (por usuário + página).
 * - Após fechar → nunca mais abre sozinho.
 * - Só reabre ao clicar manualmente em open().
 * - Persistência via localStorage, chave: tutorial_seen_{pageKey}_{userId}
 * - Aguarda auth estar resolvido antes de qualquer verificação.
 * - Imune a re-renders e ao React StrictMode.
 */
export function useHelpTutorial(pageKey: string) {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Ref para evitar que o efeito abra o tutorial mais de uma vez
  // mesmo que as dependências mudem (ex: StrictMode, re-renders de auth)
  const hasCheckedRef = useRef(false);

  // Chave única por usuário + página
  const storageKey = user?.id ? `tutorial_seen_${pageKey}_${user.id}` : null;

  useEffect(() => {
    // Aguarda auth resolver completamente
    if (isLoading) return;

    // Se não tiver usuário, não faz auto-open (tutoriais são do app logado)
    if (!storageKey) return;

    // Evita re-abrir por re-render/StrictMode
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const hasSeen = localStorage.getItem(storageKey) === "true";
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [isLoading, storageKey]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
    setIsOpen(false);
  }, [storageKey]);

  return { isOpen, open, close };
}

// Limpa todas as chaves de tutorial do usuário (use apenas para reset manual / suporte)
export function clearTutorialHistory(userId?: string) {
  if (!userId) return;

  const prefix = `tutorial_seen_`;
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(prefix) && key.endsWith(`_${userId}`)) {
      localStorage.removeItem(key);
    }
  });
}
