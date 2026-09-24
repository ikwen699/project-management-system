"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard } from "lucide-react";

export function PayButton({
  currentPlan,
}: {
  currentPlan?: string;
}) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "business", interval }),
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

  const price = interval === "annual" ? "$120" : "$12";

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h2 className="text-lg font-bold mb-4">Upgrade to Business</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {currentPlan === "trialing"
          ? "Your trial ends soon — unlock unlimited projects and full access."
          : "Unlimited projects and every feature. One-time payment per period."}
      </p>

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
          <p className="text-xs text-muted-foreground">$12 / month</p>
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
            $120 / year <span className="text-green-600">(save 17%)</span>
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
        Secure checkout by Paystack. Pay once, covered for the full period.
      </p>
    </div>
  );
}