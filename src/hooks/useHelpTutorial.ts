// src/hooks/useHelpTutorial.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type UseHelpTutorialReturn = {
  isOpen: boolean;
  open: () => void; // abre manualmente (não marca como visto)
  close: () => void; // fecha e marca como visto
  resetSeen: () => void; // opcional: para testes/admin
  hasSeen: boolean;
};

/**
 * Persistência por usuário + página:
 *  tutorial_seen:<userId>:<pageKey>
 *
 * Regras:
 * - Abre automaticamente SOMENTE se ainda não viu.
 * - Ao fechar, marca como visto (persistente).
 * - Ao clicar no ícone de ajuda, abre manualmente mesmo já tendo visto.
 * - Não depende de estado em memória; resiste a refresh, logout/login.
 */
export function useHelpTutorial(pageKey: string): UseHelpTutorialReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const [ready, setReady] = useState(false);

  // Buscar user id (e reagir a login/logout)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setReady(true);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // sempre que logar/deslogar, atualiza userId
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const storageKey = useMemo(() => {
    // se não tiver userId, usa "anon" (mas em app autenticado, normalmente terá)
    const uid = userId ?? "anon";
    return `tutorial_seen:${uid}:${pageKey}`;
  }, [userId, pageKey]);

  // Ler persistência e decidir abertura automática
  useEffect(() => {
    if (!ready) return;

    const raw = localStorage.getItem(storageKey);
    const seen = raw === "1";

    setHasSeen(seen);

    // Abre automaticamente somente se NÃO viu ainda
    // (e fecha caso esteja aberto e trocou de usuário)
    if (!seen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [storageKey, ready]);

  const open = useCallback(() => {
    // abertura manual NÃO marca como visto
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    // fechar deve marcar como visto
    try {
      localStorage.setItem(storageKey, "1");
      setHasSeen(true);
    } catch {
      // se falhar storage, ao menos fecha
    }
    setIsOpen(false);
  }, [storageKey]);

  const resetSeen = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setHasSeen(false);
    setIsOpen(true);
  }, [storageKey]);

  return { isOpen, open, close, resetSeen, hasSeen };
}
