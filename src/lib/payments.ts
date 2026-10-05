import { createHmac } from "crypto";
import { supabase } from "./supabase";
import { PRICING, priceFor } from "./pricing";
import type { BillingInterval, Plan } from "@/types";

export { PRICING, priceFor };

export const PAYSTACK_API = "https://api.paystack.co";
export const PAYSTACK_CURRENCY = "NGN";

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

export function planCodeFor(
  plan: Plan,
  interval: BillingInterval
): string | null {
  const suffix = interval === "annual" ? "ANNUAL" : "MONTHLY";
  const code = process.env[`PAYSTACK_PLAN_${plan.toUpperCase()}_${suffix}`];
  return code && code.startsWith("PLN_") ? code : null;
}

export function planForPlanCode(
  code: string
): { plan: Plan; interval: BillingInterval } | null {
  for (const plan of ["business", "scale"] as const) {
    for (const interval of ["monthly", "annual"] as const) {
      if (planCodeFor(plan, interval) === code) return { plan, interval };
    }
  }
  return null;
}

export async function fetchPlanAmount(
  planCode: string
): Promise<number | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;
  try {
    const res = await fetch(
      `${PAYSTACK_API}/plan/${encodeURIComponent(planCode)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const body = await res.json();
    if (!body?.status || !body.data?.amount) return null;
    const major = Math.round(Number(body.data.amount) / 100);
    return major > 0 ? major : null;
  } catch (error) {
    console.error("fetchPlanAmount error:", error);
    return null;
  }
}

/**
 * Activates/extends a plan for a subscription renewal charge (webhook fires
 * charge.success for every recurring payment). Idempotent: a Payment row is
 * inserted with the renewal reference first — a duplicate reference means the
 * renewal was already processed.
 */
export async function applyRenewal(
  reference: string,
  planCode: string,
  customerEmail: string,
  amountMajor: number | null
): Promise<boolean> {
  const mapping = planForPlanCode(planCode);
  if (!mapping) return false;

  try {
    const existing = await supabase
      .from("Payment")
      .select("id")
      .eq("txRef", reference)
      .maybeSingle();
    if (existing.data) return false;

    const email = customerEmail.trim().toLowerCase();
    let userRes = await supabase
      .from("User")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    if (!userRes.data) {
      userRes = await supabase
        .from("User")
        .select("id, email")
        .eq("email", customerEmail)
        .maybeSingle();
    }
    if (userRes.error || !userRes.data) {
      console.error(
        "applyRenewal: no user for customer email",
        customerEmail
      );
      return false;
    }
    const userId = userRes.data.id;

    const { data: userData } = await supabase
      .from("User")
      .select("planExpiresAt")
      .eq("id", userId)
      .maybeSingle();

    const now = new Date();
    const current = userData?.planExpiresAt
      ? new Date(userData.planExpiresAt)
      : null;
    const base =
      current && current.getTime() > now.getTime() ? current : now;
    const expiresAt = addPeriod(base, mapping.interval).toISOString();

    const { error: insertError } = await supabase
      .from("Payment")
      .insert({
        id: crypto.randomUUID(),
        userId,
        txRef: reference,
        amount: amountMajor ?? priceFor(mapping.plan, mapping.interval),
        currency: PAYSTACK_CURRENCY,
        interval: mapping.interval,
        status: "successful",
        plan: mapping.plan,
        planExpiresAt: expiresAt,
      });

    if (insertError) {
      if (insertError.code === "23505") return true;
      console.error("applyRenewal payment insert error:", insertError);
      return false;
    }

    const { error: userError } = await supabase
      .from("User")
      .update({
        plan: mapping.plan,
        planStatus: "active",
        planExpiresAt: expiresAt,
        trialEndsAt: null,
      })
      .eq("id", userId);

    if (userError) {
      console.error("applyRenewal user update error:", userError);
      return false;
    }

    console.log(
      `applyRenewal: ${mapping.plan}/${mapping.interval} extended to ${expiresAt} for user ${userId}`
    );
    return true;
  } catch (error) {
    console.error("applyRenewal error:", error);
    return false;
  }
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