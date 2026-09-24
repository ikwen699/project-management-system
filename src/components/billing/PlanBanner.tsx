"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

interface PlanStatus {
  isFullAccess: boolean;
  projectLimit: number;
  plan: "starter" | "business" | "scale";
  planStatus: "active" | "trialing" | "expired";
  isTrial: boolean;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
  projectCount?: number;
  daysLeft?: number | null;
}

export function PlanBanner() {
  const [plan, setPlan] = useState<PlanStatus | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return setPlan(null);
        const daysLeft =
          data.trialEndsAt && data.isTrial
            ? Math.ceil(
                (new Date(data.trialEndsAt).getTime() - Date.now()) /
                  (1000 * 3600 * 24)
              )
            : null;
        setPlan({ ...data, daysLeft });
      })
      .catch(() => setPlan(null));
  }, []);

  if (!plan) return null;

  if (plan.isFullAccess) return null;

  const daysLeft = plan.daysLeft ?? null;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-blue-600 p-1.5 text-white">
          {plan.isTrial ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
        </span>
        <div>
          {plan.isTrial && daysLeft !== null && daysLeft > 0 ? (
            <p className="text-sm font-semibold text-blue-900">
              Business trial — {daysLeft} day{daysLeft === 1 ? "" : "s"} left
            </p>
          ) : (
            <p className="text-sm font-semibold text-blue-900">
              You&apos;re on the free Starter plan
            </p>
          )}
          <p className="text-sm text-blue-800">
            {typeof plan.projectCount === "number" && (
              <span className="font-medium">
                {plan.projectCount}/{plan.projectLimit} projects used
                {plan.projectLimit > 0 ? " — " : ""}
              </span>
            )}
            Upgrade to Business for unlimited projects and full access.
          </p>
        </div>
      </div>
      <Link
        href="/settings/billing"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        {plan.isTrial ? "Upgrade" : "Upgrade to Business"}
      </Link>
    </div>
  );
}