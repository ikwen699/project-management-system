"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Crown, Rocket, Sparkles } from "lucide-react";
import {
  PLAN_PROMPT_KEY,
  PLAN_PROMPT_SESSION_KEY,
  clearPlanIntent,
  readPlanIntent,
  type PlanIntent,
} from "@/lib/plan-intent";

interface PlanState {
  isFullAccess: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  projectLimit: number;
}

function markChosen() {
  window.localStorage.setItem(PLAN_PROMPT_KEY, "chosen");
  clearPlanIntent();
}

function markSkipped() {
  // Skipped is not final: the prompt returns on the next login.
  window.localStorage.setItem(PLAN_PROMPT_KEY, "skipped");
  window.sessionStorage.setItem(PLAN_PROMPT_SESSION_KEY, "1");
}

export function PlanPromptModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [intent, setIntent] = useState<PlanIntent | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem(PLAN_PROMPT_KEY) === "chosen") return;
    if (window.sessionStorage.getItem(PLAN_PROMPT_SESSION_KEY)) return;

    let cancelled = false;
    fetch("/api/user/plan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PlanState | null) => {
        if (cancelled) return;
        // Paid plans and active trials have already made a choice.
        if (!data || data.isFullAccess || data.isTrial) {
          if (data?.isFullAccess || data?.isTrial) markChosen();
          return;
        }

        setPlan(data);
        setIntent(readPlanIntent());
        window.sessionStorage.setItem(PLAN_PROMPT_SESSION_KEY, "1");
        setOpen(true);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const chooseStarter = useCallback(async () => {
    setPending("starter");
    try {
      const res = await fetch("/api/user/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "choose-starter" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save your choice");
        return;
      }
      markChosen();
      toast.success("Starter plan selected");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(null);
    }
  }, [router]);

  const chooseTrial = useCallback(async () => {
    setPending("trial");
    try {
      const res = await fetch("/api/user/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-trial" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not start your trial");
        return;
      }
      markChosen();
      toast.success("Your 7-day Business trial has started");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(null);
    }
  }, [router]);

  const chooseBusiness = useCallback(() => {
    markChosen();
    setOpen(false);
    router.push("/settings/billing?upgrade=business");
  }, [router]);

  const trialUsed = Boolean(plan?.trialEndsAt);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-prompt-title"
      onClick={() => {
        markSkipped();
        setOpen(false);
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 id="plan-prompt-title" className="text-lg font-bold">
            Choose your plan
          </h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Pick what fits you today. You can change or cancel anytime from
          Settings &rarr; Billing.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            disabled={pending !== null}
            onClick={chooseStarter}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
              intent === null
                ? "border-primary bg-primary/5"
                : "border-input hover:border-primary/50"
            }`}
          >
            <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold">Starter — Free</span>
                <span className="text-xs text-muted-foreground">
                  {plan?.projectLimit ?? 3} projects
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Basic task management and a simple dashboard
              </span>
            </span>
            {pending === "starter" && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
          </button>

          <button
            type="button"
            disabled={pending !== null || trialUsed}
            onClick={chooseTrial}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              intent === "trial"
                ? "border-primary bg-primary/5"
                : "border-input hover:border-primary/50"
            }`}
          >
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  7-day Business trial
                </span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                  Free
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {trialUsed
                  ? "You already used your free trial on this account"
                  : "Full Business access for 7 days, then decide"}
              </span>
            </span>
            {pending === "trial" && (
              <span className="text-xs text-muted-foreground">Starting...</span>
            )}
          </button>

          <button
            type="button"
            disabled={pending !== null}
            onClick={chooseBusiness}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
              intent === "business"
                ? "border-primary bg-primary/5"
                : "border-input hover:border-primary/50"
            }`}
          >
            <Crown className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold">Business</span>
                <span className="text-xs text-muted-foreground">
                  $12/month or $120/year
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Unlimited projects, reports, automations and priority support
              </span>
            </span>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              markSkipped();
              setOpen(false);
            }}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Decide later
          </button>
          <span className="text-xs text-muted-foreground">
            You can change plans in Settings &rarr; Billing
          </span>
        </div>
      </div>
    </div>
  );
}