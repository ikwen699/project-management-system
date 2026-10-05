"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard } from "lucide-react";
import { PRICING, formatNaira } from "@/lib/pricing";

export function PayButton({
  compact = false,
  plan = "business",
}: {
  compact?: boolean;
  plan?: "business" | "scale";
}) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  const pricing = PRICING[plan];

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not start payment");
        return;
      }

      window.location.href = data.authorization_url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const price = formatNaira(
    interval === "annual" ? pricing.annual : pricing.monthly
  );

  return (
    <div className={compact ? "" : "bg-card rounded-xl border border-border p-6"}>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
            interval === "monthly"
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50"
          }`}
        >
          <p className="text-sm font-semibold">Monthly</p>
          <p className="text-xs text-muted-foreground">
            {formatNaira(pricing.monthly)} / month
          </p>
        </button>
        <button
          type="button"
          onClick={() => setInterval("annual")}
          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
            interval === "annual"
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50"
          }`}
        >
          <p className="text-sm font-semibold">Annual</p>
          <p className="text-xs text-muted-foreground">
            {formatNaira(pricing.annual)} / year
          </p>
        </button>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <CreditCard className="h-4 w-4" />
        {loading ? "Redirecting to Paystack..." : `Pay ${price} with Paystack`}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secure checkout by Paystack. Renews automatically — cancel anytime.
      </p>
    </div>
  );
}
