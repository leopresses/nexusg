import { Zap, Crown, Rocket, Building, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlanConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  price: string;
  priceValue: number;
  period: string;
  description: string;
  clientsLimit: string;
  clientsLimitValue: number;
  features: string[];
  highlighted: boolean;
}

// Official plans configuration - Single source of truth
export const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: "Grátis",
    priceValue: 0,
    period: "",
    description: "Perfeito para começar a gerenciar seu primeiro cliente.",
    clientsLimit: "1 cliente",
    clientsLimitValue: 1,
    features: ["1 cliente", "White-label (sua marca)", "Relatórios avançados", "API de integração"],
    highlighted: false,
  },
  {
    id: "tatico",
    name: "Tático",
    icon: Target,
    price: "R$ 49,90",
    priceValue: 49.90,
    period: "/mês",
    description: "Ideal para profissionais que gerenciam múltiplos clientes.",
    clientsLimit: "Até 3 clientes",
    clientsLimitValue: 3,
    features: ["Até 3 clientes", "Tudo do Starter", "Suporte por Whatsapp"],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: "R$ 197,00",
    priceValue: 197,
    period: "/mês",
    description: "Para gestores que precisam de recursos avançados.",
    clientsLimit: "Até 6 clientes",
    clientsLimitValue: 6,
    features: ["Até 6 clientes", "Tudo do Tático", "Suporte prioritário"],
    highlighted: false,
  },
  {
    id: "elite",
    name: "Elite",
    icon: Rocket,
    price: "R$ 297,00",
    priceValue: 297,
    period: "/mês",
    description: "Para agências que precisam de máxima capacidade.",
    clientsLimit: "Até 10 clientes",
    clientsLimitValue: 10,
    features: ["Até 10 clientes", "Tudo do Pro"],
    highlighted: true,
  },
  {
    id: "agency",
    name: "Agency",
    icon: Building,
    price: "R$ 497,00",
    priceValue: 497,
    period: "/mês",
    description: "Solução completa para grandes operações.",
    clientsLimit: "Clientes ilimitados",
    clientsLimitValue: 999999,
    features: ["Clientes ilimitados", "Tudo do Elite"],
    highlighted: false,
  },
];

// Simple plan array for landing/demo pages
export const SIMPLE_PLANS = PLANS.map((p) => ({
  name: p.name,
  clients: p.clientsLimit,
  price: p.price + (p.period ? p.period : ""),
  popular: p.highlighted,
}));

// Plan limits map for quick lookup
export const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  tatico: 3,
  pro: 6,
  elite: 10,
  agency: 999999,
};

// Plan labels for display
export const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  tatico: "Tático",
  pro: "Pro",
  elite: "Elite",
  agency: "Agency",
};

// Business type translations for PT-BR
export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurante",
  store: "Loja",
  service: "Serviço",
  other: "Outros",
  cafe_service: "Cafeteria / Serviços",
  barbershop_salon: "Barbearia / Salão",
};

// Helper function to get plan limit
export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? 1;
}

// Helper function to get plan label
export function getPlanLabel(plan: string): string {
  return PLAN_LABELS[plan] ?? plan;
}

// Helper function to format client limit for display
export function formatClientLimit(limit: number): string {
  if (limit >= 999999) return "Ilimitado";
  return `${limit} cliente${limit > 1 ? "s" : ""}`;
}

// Helper to get business type label
export function getBusinessTypeLabel(type: string): string {
  return BUSINESS_TYPE_LABELS[type] ?? "Outros";
}

// WHATSAPP contact number for upgrades
export const WHATSAPP_NUMBER = "5535991553748";
