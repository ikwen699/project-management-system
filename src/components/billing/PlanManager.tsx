"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Crown, Layers, Rocket, Sparkles } from "lucide-react";
import { PayButton } from "./PayButton";
import { PRICING, formatNaira } from "@/lib/pricing";

interface PlanState {
  isFullAccess: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  plan: string;
  projectLimit: number;
  projectCount?: number;
}

export function PlanManager({ plan }: { plan: PlanState }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);

  async function runAction(action: string, successMsg: string) {
    setPending(action);
    try {
      const res = await fetch("/api/user/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not update your plan");
        return;
      }
      toast.success(successMsg);
      setConfirmDowngrade(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(null);
    }
  }

  const onStarter = plan.plan === "starter" && !plan.isFullAccess;
  const trialUsed = Boolean(plan.trialEndsAt);
  const overLimit =
    typeof plan.projectCount === "number" && plan.projectCount > 3;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Starter */}
        <div
          className={`flex flex-col rounded-xl border p-5 ${
            onStarter ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Starter</h3>
            {onStarter && (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                Current
              </span>
            )}
          </div>
          <p className="mb-1 text-2xl font-bold">
            {formatNaira(PRICING.starter.monthly)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <ul className="mb-4 flex-1 space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Up to 3 projects
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Basic task management
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Simple dashboard
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Basic collaboration
            </li>
          </ul>
          {!onStarter && (
            <>
              {confirmDowngrade ? (
                <div className="rounded-lg border border-overdue-text/30 bg-overdue-bg p-3">
                  <p className="mb-2 text-xs text-overdue-text">
                    Downgrading ends Business access immediately. You will be
                    limited to 3 active projects.
                    {overLimit && " You currently have more than 3 projects."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() =>
                        runAction("downgrade", "Downgraded to Starter")
                      }
                      className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {pending === "downgrade"
                        ? "Downgrading..."
                        : "Confirm downgrade"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDowngrade(false)}
                      className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      Keep Business
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDowngrade(true)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Downgrade to Starter
                </button>
              )}
            </>
          )}
        </div>

        {/* Business trial */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Business trial</h3>
            {plan.isTrial && (
              <span className="ml-auto rounded-full bg-status-active/15 px-2 py-0.5 text-[10px] font-medium uppercase text-status-active">
                Active
              </span>
            )}
          </div>
          <p className="mb-1 text-2xl font-bold">
            Free<span className="text-sm font-normal text-muted-foreground">/7 days</span>
          </p>
          <ul className="mb-4 flex-1 space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Full Business access
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Unlimited projects
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Cancel anytime
            </li>
          </ul>
          {trialUsed ? (
            <p className="rounded-lg border border-border bg-surface px-3 py-2 text-center text-xs text-muted-foreground">
              Trial already used on this account
            </p>
          ) : (
            <button
              type="button"
              disabled={pending !== null || plan.isFullAccess}
              onClick={() =>
                runAction("start-trial", "Your 7-day trial has started")
              }
              className="w-full rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {pending === "start-trial" ? "Starting..." : "Start free trial"}
            </button>
          )}
        </div>

        {/* Business paid */}
        <div
          className={`flex flex-col rounded-xl border p-5 ${
            plan.isFullAccess && !plan.isTrial
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Business</h3>
            {plan.isFullAccess && !plan.isTrial && (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                Current
              </span>
            )}
          </div>
          <p className="mb-1 text-2xl font-bold">
            {formatNaira(PRICING.business.monthly)}
            <span className="text-sm font-normal text-muted-foreground">
              /user/mo
            </span>
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            or {formatNaira(PRICING.business.annual)}/year per user
          </p>
          {plan.isFullAccess && !plan.isTrial ? (
            <div className="mt-auto rounded-lg border border-border bg-surface px-3 py-2 text-center text-xs text-muted-foreground">
              Your Business plan is active
            </div>
          ) : (
            <div className="mt-auto">
              <PayButton compact />
            </div>
          )}
        </div>

        {/* Scale */}
        <div
          className={`flex flex-col rounded-xl border p-5 ${
            plan.plan === "scale" && plan.isFullAccess && !plan.isTrial
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Scale</h3>
            {plan.plan === "scale" && plan.isFullAccess && !plan.isTrial && (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                Current
              </span>
            )}
          </div>
          <p className="mb-1 text-2xl font-bold">
            {formatNaira(PRICING.scale.monthly)}
            <span className="text-sm font-normal text-muted-foreground">
              /user/mo
            </span>
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            or {formatNaira(PRICING.scale.annual)}/year per user
          </p>
          {plan.plan === "scale" && plan.isFullAccess && !plan.isTrial ? (
            <div className="mt-auto rounded-lg border border-border bg-surface px-3 py-2 text-center text-xs text-muted-foreground">
              Your Scale plan is active
            </div>
          ) : (
            <div className="mt-auto">
              <PayButton compact plan="scale" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}