// Stripe price/product mapping - Single source of truth (frontend)
// Price IDs are publishable identifiers (not secrets).
// Edge functions maintain their own copy since they can't import from src/.
// When updating price IDs here, also update:
//   - supabase/functions/create-checkout-session/index.ts (PRICE_MAP)
//   - supabase/functions/stripe-webhook/index.ts (PRICE_TO_PLAN)

export const STRIPE_PRICE_IDS: Record<string, string | null> = {
  starter: null, // Free plan — no Stripe checkout
  tatico: "price_1T6Y7V1wSF4SiKrjrvUG1SF6",
  pro: "price_1T6Y7n1wSF4SiKrjrLI3SoRS",
  elite: "price_1T6Y831wSF4SiKrjGT9VHvgF",
  agency: "price_1T6Y8H1wSF4SiKrjVYk1kAao",
};

// Convenience alias used by Pricing page (non-null entries only)
export const STRIPE_PRICE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_IDS).filter(([, v]) => v !== null) as [string, string][]
);

// Reverse mapping: price_id -> plan name
export const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_MAP).map(([plan, priceId]) => [priceId, plan])
);
