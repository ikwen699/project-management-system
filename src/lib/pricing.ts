import type { BillingInterval, Plan } from "@/types";

export const PRICING: Record<
  Plan,
  { label: string; monthly: number; annual: number }
> = {
  starter: { label: "Starter", monthly: 0, annual: 0 },
  business: { label: "Business", monthly: 15000, annual: 150000 },
  scale: { label: "Scale", monthly: 20000, annual: 300000 },
};

export function priceFor(
  plan: Plan,
  interval: BillingInterval
): number {
  return interval === "annual"
    ? PRICING[plan].annual || PRICING[plan].monthly * 12
    : PRICING[plan].monthly;
}

export function formatNaira(amount: number): string {
  return `\u20a6${amount.toLocaleString("en-NG")}`;
}
