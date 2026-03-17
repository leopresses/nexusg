import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { safeStorage } from "@/lib/safeStorage";

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

  const hasCheckedRef = useRef(false);

  const storageKey = user?.id
    ? `tutorial_seen_${pageKey}_${user.id}`
    : null;

  useEffect(() => {
    if (isLoading) return;
    if (!storageKey) return;
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const timer = setTimeout(() => {
      const hasSeen = safeStorage.getItem(storageKey);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (storageKey) {
      safeStorage.setItem(storageKey, "true");
    }
  }, [storageKey]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return { isOpen, open, close };
}

/**
 * Limpa TODAS as chaves de tutorial do localStorage para um usuário específico.
 */
export function clearTutorialHistory(userId?: string) {
  const prefix = "tutorial_seen_";
  const keysToRemove: string[] = [];

  for (let i = 0; i < safeStorage.length; i++) {
    const key = safeStorage.key(i);
    if (!key) continue;
    if (userId) {
      if (key.startsWith(prefix) && key.endsWith(`_${userId}`)) {
        keysToRemove.push(key);
      }
    } else {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((k) => safeStorage.removeItem(k));
}
