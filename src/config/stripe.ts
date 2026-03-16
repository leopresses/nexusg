// Stripe price/product mapping - Single source of truth
// These are the Stripe Price IDs for monthly subscriptions (BRL)

export const STRIPE_PRICE_MAP: Record<string, string> = {
  tatico: "price_1TBZojEmeysLJoAP0cXWlbj0",
  pro: "price_1TBZqMEmeysLJoAPClGm1VzF",
  elite: "price_1TBZrWEmeysLJoAPsKwVQvvP",
  agency: "price_1TBZsMEmeysLJoAPhQP3SEhf",
};

// Reverse mapping: price_id -> plan name
export const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_MAP).map(([plan, priceId]) => [priceId, plan]),
);

// Plan limits (duplicated from plans.ts for edge function reference)
export const PLAN_CLIENT_LIMITS: Record<string, number> = {
  starter: 1,
  tatico: 3,
  pro: 6,
  elite: 10,
  agency: 999999,
};
