/**
 * helpTourStorage.ts
 * Persists help tour "seen" state per user + page in localStorage.
 * Key format: help_seen:<userId>:<pageKey>
 */

const PREFIX = "help_seen:";

function buildKey(userId: string, pageKey: string): string {
  return `${PREFIX}${userId}:${pageKey}`;
}

export function getHelpSeen(userId: string, pageKey: string): boolean {
  try {
    const val = localStorage.getItem(buildKey(userId, pageKey));
    return val === "true";
  } catch {
    return false;
  }
}

export function setHelpSeen(userId: string, pageKey: string): void {
  try {
    localStorage.setItem(buildKey(userId, pageKey), "true");
  } catch {
    // silent fail — storage unavailable
  }
}

export function resetHelpSeen(userId: string, pageKey: string): void {
  try {
    localStorage.removeItem(buildKey(userId, pageKey));
  } catch {
    // silent fail
  }
}

/**
 * Clear all help tour history for a specific user (call on logout).
 * If userId is omitted, clears ALL users' history.
 */
export function clearAllHelpSeen(userId?: string): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      if (!userId) {
        keysToRemove.push(key);
      } else {
        // key = help_seen:<userId>:<pageKey>
        if (key.startsWith(`${PREFIX}${userId}:`)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // silent fail
  }
}
