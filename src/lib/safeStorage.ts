/**
 * Safe localStorage wrapper that never throws.
 * Handles private browsing, full storage, and disabled cookies.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage full or blocked - silently ignore
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently ignore
    }
  },

  get length(): number {
    try {
      return localStorage.length;
    } catch {
      return 0;
    }
  },

  key(index: number): string | null {
    try {
      return localStorage.key(index);
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Silently ignore
    }
  },
};

export const safeSessionStorage = {
  clear(): void {
    try {
      sessionStorage.clear();
    } catch {
      // Silently ignore
    }
  },
};
