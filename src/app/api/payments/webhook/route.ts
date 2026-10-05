import { NextResponse } from "next/server";
import {
  applyRenewal,
  verifyAndActivate,
  verifyWebhookSignature,
} from "@/lib/payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (reference) {
        const handled = await verifyAndActivate(reference);
        if (!handled) {
          const planCode: string | undefined = event.data?.plan?.plan_code;
          const email: string | undefined = event.data?.customer?.email;
          const amount =
            typeof event.data?.amount === "number"
              ? Math.round(event.data.amount / 100)
              : null;
          if (planCode && email) {
            await applyRenewal(reference, planCode, email, amount);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
}