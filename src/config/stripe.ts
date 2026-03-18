// ============================================================
// Stripe Integration — Single Source of Truth (Frontend)
// ============================================================
// Price IDs are PUBLIC identifiers (not secrets).
// The STRIPE_SECRET_KEY lives securely in edge function env vars.
// No publishable key is needed: checkout uses server-side redirect.
// ============================================================

/**
 * Stripe Price IDs mapped by plan.
 * - starter has NO Stripe integration (null).
 * - Paid plans map to their respective Stripe Price IDs.
 *
 * ⚠️  If you change a price_id here, also update the edge functions:
 *     supabase/functions/create-checkout-session/index.ts
 *     supabase/functions/stripe-webhook/index.ts
 */
export const STRIPE_PRICE_IDS: Record<string, string | null> = {
  starter: null,
  tatico: "price_1TBZojEmeysLJoAP0cXWlbj0",
  pro: "price_1TBZqMEmeysLJoAPClGm1VzF",
  elite: "price_1TBZrWEmeysLJoAPsKwVQvvP",
  agency: "price_1TBZsMEmeysLJoAPhQP3SEhf",
};

/** @deprecated Use STRIPE_PRICE_IDS instead */
export const STRIPE_PRICE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_IDS).filter(([, v]) => v !== null),
) as Record<string, string>;

// Reverse mapping: price_id -> plan name (excludes starter)
export const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_IDS)
    .filter(([, v]) => v !== null)
    .map(([plan, priceId]) => [priceId as string, plan]),
);

// Plan limits (mirrors plans.ts — used by edge functions as reference)
export const PLAN_CLIENT_LIMITS: Record<string, number> = {
  starter: 1,
  tatico: 3,
  pro: 6,
  elite: 10,
  agency: 999999,
};

/**
 * Helper: check if a plan has Stripe checkout enabled.
 */
export function isPaidPlan(planId: string): boolean {
  return STRIPE_PRICE_IDS[planId] !== null && STRIPE_PRICE_IDS[planId] !== undefined;
}
