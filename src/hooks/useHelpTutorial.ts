import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook reutilizável para controlar tutoriais contextuais por página.
 * - Abre automaticamente na primeira visita do usuário à página.
 * - Persiste o estado "já visto" por user + rota no localStorage.
 * - Permite reabrir manualmente via `open()`.
 * - Aguarda o carregamento do auth para evitar falsos positivos com "anon".
 */
export function useHelpTutorial(pageKey: string) {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const storageKey = user?.id
    ? `help_seen:${user.id}:${pageKey}`
    : null;

  useEffect(() => {
    // Não faz nada enquanto auth ainda está carregando
    if (isLoading) return;
    // Sem usuário logado, não abre tutorial
    if (!storageKey) return;

    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [storageKey, isLoading]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
  }, [storageKey]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return { isOpen, open, close };
}
