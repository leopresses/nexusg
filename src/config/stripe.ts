// Stripe price/product mapping - Single source of truth
// These are the Stripe Price IDs for monthly subscriptions (BRL)

export const STRIPE_PRICE_MAP: Record<string, string> = {
  tatico: "price_1T6Y7V1wSF4SiKrjrvUG1SF6",
  pro: "price_1T6Y7n1wSF4SiKrjrLI3SoRS",
  elite: "price_1T6Y831wSF4SiKrjGT9VHvgF",
  agency: "price_1T6Y8H1wSF4SiKrjVYk1kAao",
};

// Reverse mapping: price_id -> plan name
export const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_MAP).map(([plan, priceId]) => [priceId, plan])
);

// Plan limits (duplicated from plans.ts for edge function reference)
export const PLAN_CLIENT_LIMITS: Record<string, number> = {
  starter: 1,
  tatico: 3,
  pro: 6,
  elite: 10,
  agency: 999999,
};
