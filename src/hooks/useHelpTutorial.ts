import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Controle de tutoriais contextuais.
 *
 * Regras:
 * - Abre apenas na primeira visita por usuário + página.
 * - Após aparecer uma vez → nunca mais abre sozinho.
 * - Pode reabrir manualmente via open().
 * - Persistência por usuário + página.
 */
export function useHelpTutorial(pageKey: string) {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const hasCheckedRef = useRef(false);

  const storageKey = user?.id ? `tutorial_seen_${pageKey}_${user.id}` : null;

  useEffect(() => {
    if (isLoading) return;
    if (!storageKey) return;
    if (hasCheckedRef.current) return;

    hasCheckedRef.current = true;

    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem(storageKey);

      // 🔥 NOVO: marca como visto imediatamente ao abrir
      if (!hasSeen) {
        setIsOpen(true);
        localStorage.setItem(storageKey, "true");
      }
    }, 600);

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

/**
 * Limpa histórico de tutorial (opcional para logout)
 */
export function clearTutorialHistory(userId?: string) {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (userId) {
      if (key.startsWith("tutorial_seen_") && key.endsWith(`_${userId}`)) {
        keysToRemove.push(key);
      }
    } else {
      if (key.startsWith("tutorial_seen_")) {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
