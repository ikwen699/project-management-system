"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard, Crown, Layers, Rocket, Sparkles, X } from "lucide-react";
import { PayButton } from "@/components/billing/PayButton";
import { PRICING, formatNaira } from "@/lib/pricing";

interface Entitlement {
  isFullAccess: boolean;
  plan: "starter" | "business" | "scale";
  planStatus: "active" | "trialing" | "expired";
  isTrial: boolean;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
  projectLimit: number;
  projectCount?: number;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 3600 * 24));
}

export function PlanWidget({
  collapsed = false,
  isAdmin = false,
}: {
  collapsed?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/user/plan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEntitlement(data))
      .catch(() => setEntitlement(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

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
      load();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(null);
    }
  }

  const onStarter =
    entitlement !== null &&
    entitlement.plan === "starter" &&
    !entitlement.isFullAccess;

  let pill: { label: string; className: string } | null = null;
  let title = "";
  let detail = "";

  if (isAdmin) {
    title = "Unlimited";
    detail = "All features unlocked";
    pill = { label: "Admin", className: "bg-primary/15 text-primary" };
  } else if (entitlement) {
    if (entitlement.isTrial) {
      const days = daysUntil(entitlement.trialEndsAt);
      title = "Business trial";
      detail =
        days !== null && days > 0
          ? `${days} day${days === 1 ? "" : "s"} left \u00b7 ends ${formatDate(entitlement.trialEndsAt)}`
          : `Ended ${formatDate(entitlement.trialEndsAt)}`;
      pill = { label: "Trial", className: "bg-primary/15 text-primary" };
    } else if (entitlement.isFullAccess) {
      const label = PRICING[entitlement.plan]?.label ?? "Business";
      title = `${label} plan`;
      detail = entitlement.planExpiresAt
        ? `Renews ${formatDate(entitlement.planExpiresAt)}`
        : "Active";
      pill = {
        label: "Active",
        className: "bg-status-active/15 text-status-active",
      };
    } else if (entitlement.planStatus === "expired") {
      const label = PRICING[entitlement.plan]?.label ?? "Business";
      title = `${label} plan`;
      detail = "Expired \u2014 renew to regain access";
      pill = {
        label: "Expired",
        className: "bg-overdue-bg text-overdue-text",
      };
    } else {
      title = "Starter plan";
      detail = `${
        typeof entitlement.projectCount === "number"
          ? entitlement.projectCount
          : 0
      }/${entitlement.projectLimit} projects used`;
      pill = {
        label: "Free",
        className: "bg-sidebar-accent text-sidebar-fg/70",
      };
    }
  }

  if (loading && !isAdmin) {
    return (
      <div
        className={`rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 ${collapsed ? "flex justify-center" : "space-y-2"}`}
        aria-hidden="true"
      >
        {collapsed ? (
          <CreditCard className="h-5 w-5 animate-pulse text-sidebar-fg/40" />
        ) : (
          <>
            <div className="h-3 w-16 rounded bg-sidebar-fg/10 animate-pulse" />
            <div className="h-4 w-24 rounded bg-sidebar-fg/15 animate-pulse" />
            <div className="h-3 w-32 rounded bg-sidebar-fg/10 animate-pulse" />
          </>
        )}
      </div>
    );
  }

  if (!isAdmin && !entitlement) return null;

  if (collapsed) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center justify-center rounded-lg bg-sidebar-accent p-2.5 text-sidebar-fg/70 hover:text-sidebar-fg transition-colors"
          title={`Plan: ${title}`}
          aria-label={`Current plan: ${title}. Change plan`}
        >
          <CreditCard className="h-5 w-5" />
        </button>
        {modalOpen && (
          <PlanModal
            entitlement={entitlement}
            pending={pending}
            onAction={runAction}
            onClose={() => setModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-fg/50">
            Plan
          </span>
          {pill && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${pill.className}`}
            >
              {pill.label}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm font-semibold text-sidebar-fg">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-sidebar-fg/60">{detail}</p>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-2.5 w-full rounded-lg border border-sidebar-border bg-sidebar-bg px-3 py-1.5 text-xs font-medium text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-fg transition-colors"
        >
          {onStarter ? "View plans" : "Change plan"}
        </button>
      </div>
      {modalOpen && (
        <PlanModal
          entitlement={entitlement}
          pending={pending}
          onAction={runAction}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function PlanModal({
  entitlement,
  pending,
  onAction,
  onClose,
}: {
  entitlement: Entitlement | null;
  pending: string | null;
  onAction: (action: string, successMsg: string) => Promise<void>;
  onClose: () => void;
}) {
  const currentPaid =
    entitlement !== null &&
    entitlement.isFullAccess &&
    !entitlement.isTrial;
  const onStarter =
    entitlement !== null &&
    entitlement.plan === "starter" &&
    !entitlement.isFullAccess;
  const trialUsed = Boolean(entitlement?.trialEndsAt);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Change plan"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Your plan</h2>
            <p className="text-xs text-muted-foreground">
              Switch anytime. Changes apply immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          {/* Starter */}
          <div
            className={`rounded-xl border p-4 ${
              onStarter ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Starter</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNaira(0)} &middot; up to{" "}
                    {entitlement?.projectLimit ?? 3} projects
                  </span>
                  {onStarter && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                      Current
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!onStarter && (
              <button
                type="button"
                disabled={pending !== null}
                onClick={() =>
                  onAction("downgrade", "Switched to the Starter plan")
                }
                className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {pending === "downgrade"
                  ? "Switching..."
                  : "Switch to Starter"}
              </button>
            )}
          </div>

          {/* Trial */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    7-day Business trial
                  </span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                    Free
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {trialUsed
                    ? "Trial already used on this account"
                    : "Full Business access for 7 days"}
                </p>
              </div>
            </div>
            {!trialUsed && !entitlement?.isTrial && (
              <button
                type="button"
                disabled={pending !== null}
                onClick={() =>
                  onAction("start-trial", "Your 7-day trial has started")
                }
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {pending === "start-trial" ? "Starting..." : "Start free trial"}
              </button>
            )}
          </div>

          {/* Business */}
          <div
            className={`rounded-xl border p-4 ${
              currentPaid && entitlement?.plan === "business"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Business</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNaira(PRICING.business.monthly)}/user/mo or{" "}
                    {formatNaira(PRICING.business.annual)}/yr
                  </span>
                  {currentPaid && entitlement?.plan === "business" && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Unlimited projects, reports, automations and priority support
                </p>
              </div>
            </div>
            {!(currentPaid && entitlement?.plan === "business") && (
              <div className="mt-3">
                <PayButton compact />
              </div>
            )}
          </div>

          {/* Scale */}
          <div
            className={`rounded-xl border p-4 ${
              currentPaid && entitlement?.plan === "scale"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Scale</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNaira(PRICING.scale.monthly)}/user/mo or{" "}
                    {formatNaira(PRICING.scale.annual)}/yr
                  </span>
                  {currentPaid && entitlement?.plan === "scale" && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Advanced permissions, custom workflows and dedicated support
                </p>
              </div>
            </div>
            {!(currentPaid && entitlement?.plan === "scale") && (
              <div className="mt-3">
                <PayButton compact plan="scale" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">
            Payments secured by Paystack
          </span>
          <button
            onClick={onClose}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
