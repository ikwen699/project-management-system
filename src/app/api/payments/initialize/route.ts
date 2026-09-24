import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  PAYSTACK_API,
  PAYSTACK_CURRENCY,
  appBaseUrl,
  priceFor,
} from "@/lib/payments";
import type { BillingInterval, Plan } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan = "business", interval = "monthly" } = await request.json();

    if (plan !== "business" && plan !== "scale") {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }
    if (interval !== "monthly" && interval !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing interval" },
        { status: 400 }
      );
    }

    const amount = priceFor(plan as Plan, interval as BillingInterval);
    const reference = "XORA-" + crypto.randomUUID();
    const expiresAt = new Date();
    if (interval === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { error: paymentError } = await supabase
      .from("Payment")
      .insert({
        id: crypto.randomUUID(),
        userId: session.user.id,
        txRef: reference,
        amount,
        currency: PAYSTACK_CURRENCY,
        interval,
        status: "pending",
        plan,
        planExpiresAt: expiresAt.toISOString(),
      });

    if (paymentError) throw paymentError;

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Paystack is not configured" },
        { status: 500 }
      );
    }

    const psRes = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: Math.round(amount * 100),
        currency: PAYSTACK_CURRENCY,
        reference,
        callback_url: `${appBaseUrl()}/api/payments/callback`,
        metadata: {
          userId: session.user.id,
          plan,
          interval,
          txRef: reference,
        },
      }),
    });

    const data = await psRes.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Payment could not be initialized" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("Initialize payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}