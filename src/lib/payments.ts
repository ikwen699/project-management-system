import { createHmac } from "crypto";
import { supabase } from "./supabase";
import type { BillingInterval, Plan } from "@/types";

export const PAYSTACK_API = "https://api.paystack.co";
export const PAYSTACK_CURRENCY = "USD";

export const PRICING: Record<
  Plan,
  { label: string; monthly: number; annual: number }
> = {
  starter: { label: "Starter", monthly: 0, annual: 0 },
  business: { label: "Business", monthly: 12, annual: 120 },
  scale: { label: "Scale", monthly: 25, annual: 0 },
};

export function priceFor(
  plan: Plan,
  interval: BillingInterval
): number {
  return interval === "annual"
    ? PRICING[plan].annual || PRICING[plan].monthly * 12
    : PRICING[plan].monthly;
}

export function appBaseUrl(): string {
  const envUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return "http://localhost:3000";
}

function addPeriod(date: Date, interval: BillingInterval): Date {
  const d = new Date(date);
  if (interval === "annual") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const expected = createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

/**
 * Verifies a Paystack transaction (by reference) against the stored PENDING
 * Payment row and, when successful and the amounts match, activates the user's
 * plan. Idempotent — safe to call from both the return URL and the webhook.
 */
export async function verifyAndActivate(reference: string): Promise<boolean> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  try {
    const res = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const body = await res.json();

    if (!body.status || !body.data) return false;
    const tx = body.data;

    if (tx.status !== "success") return false;

    const payment = await supabase
      .from("Payment")
      .select("id, userId, amount, interval, plan, status")
      .eq("txRef", reference)
      .maybeSingle();

    if (payment.error || !payment.data) return false;
    const p = payment.data;

    if (payment.data.status === "successful") return true;

    // Paystack `amount` is in the currency's smallest unit (cents).
    if (tx.amount !== Math.round(Number(p.amount) * 100)) return false;

    const plan: Plan = p.plan || "business";
    const interval: BillingInterval = p.interval || "monthly";
    const expiresAt = addPeriod(new Date(), interval).toISOString();

    await supabase
      .from("Payment")
      .update({ status: "successful" })
      .eq("txRef", reference);

    await supabase
      .from("User")
      .update({
        plan,
        planStatus: "active",
        planExpiresAt: expiresAt,
        trialEndsAt: null,
      })
      .eq("id", payment.data.userId);

    return true;
  } catch (error) {
    console.error("verifyAndActivate error:", error);
    return false;
  }
}