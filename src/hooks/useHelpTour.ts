/**
 * useHelpTour.ts
 * Hook for per-user, per-page help tour state.
 *
 * Rules:
 * - Opens automatically ONLY on first visit (hasSeen === false).
 * - close() marks as seen → never reopens automatically.
 * - open() is manual → does NOT mark as seen.
 * - Reacts to login/logout (different users get independent state).
 * - React StrictMode safe (useRef guard prevents double-fire).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getHelpSeen, setHelpSeen } from "@/lib/helpTourStorage";

interface UseHelpTourReturn {
  isOpen: boolean;
  hasSeen: boolean;
  open: () => void;
  close: () => void;
}

export function useHelpTour(pageKey: string): UseHelpTourReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  // Guard: ensures automatic open fires exactly once per mount,
  // even under React StrictMode double-invocation.
  const hasAutoOpenedRef = useRef(false);

  // 1. Resolve current user id (and subscribe to auth changes)
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const newUid = session?.user?.id ?? null;
        setUserId((prev) => {
          // Reset the auto-open guard when user changes
          if (prev !== newUid) {
            hasAutoOpenedRef.current = false;
            setIsOpen(false);
          }
          return newUid;
        });
        setReady(true);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Computed storage key changes when userId or pageKey changes
  const storageKey = useMemo(
    () => ({ userId: userId ?? "anon", pageKey }),
    [userId, pageKey]
  );

  // 3. When ready + storageKey known → check persistence & maybe auto-open
  useEffect(() => {
    if (!ready) return;

    const seen = getHelpSeen(storageKey.userId, storageKey.pageKey);
    setHasSeen(seen);

    // Auto-open only once per mount and only if not seen
    if (!seen && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      setIsOpen(true);
    } else if (seen) {
      setIsOpen(false);
    }
  }, [storageKey, ready]);

  // Manual open — does NOT mark as seen
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close — marks as seen permanently
  const close = useCallback(() => {
    setHelpSeen(storageKey.userId, storageKey.pageKey);
    setHasSeen(true);
    setIsOpen(false);
  }, [storageKey]);

  return { isOpen, hasSeen, open, close };
}
