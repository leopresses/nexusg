/**
 * Text sanitization utilities for PDF generation.
 * Ensures only clean, human-readable strings reach the PDF renderer.
 */

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const MULTI_SPACES = /\s{2,}/g;

// Characters considered "normal" for PT-BR text
const LEGIBLE_PATTERN = /^[a-zA-Z0-9À-ÿ \t\n.,:;()\-\/@&#+°ºª!?'"–—…%$€£¥•·\u00A0]+$/;

/**
 * Returns true if the string looks like garbage / encoded data.
 * Heuristic: if more than 30% of chars are outside the legible set, reject.
 */
function looksCorrupted(s: string): boolean {
  if (s.length === 0) return false;
  if (s.length > 2000) return true; // suspiciously long for a single field
  let bad = 0;
  for (const ch of s) {
    if (!/[a-zA-Z0-9À-ÿ .,:;()\-\/@&#+°ºª!?'"–—…%$€£¥•·\u00A0\t\n]/.test(ch)) {
      bad++;
    }
  }
  return bad / s.length > 0.3;
}

/**
 * Safely extract a readable string from an unknown value.
 * Returns the sanitized string or the fallback.
 */
export function safeText(
  value: unknown,
  fallback = 'Não disponível',
  maxLen = 500
): string {
  if (value === null || value === undefined) return fallback;

  let str: string;

  if (typeof value === 'string') {
    str = value;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    str = String(value);
  } else {
    // Objects/arrays — don't dump raw JSON into the PDF
    return fallback;
  }

  // Strip control characters
  str = str.replace(CONTROL_CHARS, '');
  // Collapse whitespace
  str = str.replace(MULTI_SPACES, ' ').trim();

  if (str.length === 0) return fallback;
  if (looksCorrupted(str)) return fallback;

  return str.slice(0, maxLen);
}

/**
 * Safely extract a number, returning fallback if not a finite number.
 */
export function safeNumber(value: unknown, fallback: number | null = null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

/**
 * Safely extract a URL string – rejects javascript:/data:/vbscript: schemes.
 */
export function safeUrl(value: unknown, fallback = ''): string {
  const str = safeText(value, '', 2000);
  if (!str) return fallback;
  const lower = str.toLowerCase().trim();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return fallback;
  }
  return str;
}
