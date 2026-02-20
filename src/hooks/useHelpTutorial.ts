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
  const storageKey = user?.id
    ? `tutorial_seen_${pageKey}_${user.id}`
    : null;

  useEffect(() => {
    // Aguarda auth resolver completamente
    if (isLoading) return;

    // Sem usuário logado, não abre tutorial
    if (!storageKey) return;

    // Garante que a verificação só ocorre UMA vez por montagem do componente,
    // evitando que re-renders (isLoading alternando, StrictMode) reabram o tutorial
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Delay para garantir que o componente está completamente renderizado
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 800);

    return () => clearTimeout(timer);
    // ⚠️ INTENCIONALMENTE não inclui isLoading nas deps:
    // storageKey só tem valor quando user existe (isLoading=false implícito).
    // Incluir isLoading causaria re-execução e reabertura indevida do tutorial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

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
 * Limpa TODAS as chaves de tutorial do localStorage para um usuário específico.
 * Deve ser chamado no logout para evitar que resíduos de sessão afutem novos usuários.
 */
export function clearTutorialHistory(userId?: string) {
  const prefix = userId
    ? `tutorial_seen_`  // filtramos por userId abaixo
    : `tutorial_seen_`;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (userId) {
      // Remove apenas chaves deste usuário específico
      if (key.startsWith(prefix) && key.endsWith(`_${userId}`)) {
        keysToRemove.push(key);
      }
    } else {
      // Remove todas as chaves de tutorial (logout sem userId)
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
