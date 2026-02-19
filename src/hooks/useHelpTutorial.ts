import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook reutilizável para controlar tutoriais contextuais por página.
 * - Abre automaticamente na primeira visita do usuário à página.
 * - Persiste o estado "já visto" por user + rota no localStorage.
 * - Permite reabrir manualmente via `open()`.
 */
export function useHelpTutorial(pageKey: string) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const storageKey = `help_seen:${user?.id ?? "anon"}:${pageKey}`;

  useEffect(() => {
    // Aguarda um momento para não disputar com o render inicial
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [storageKey]);

  const close = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, "true");
  };

  const open = () => {
    setIsOpen(true);
  };

  return { isOpen, open, close };
}
