import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEntitlement, planLabel } from "@/lib/billing";
import { PayButton } from "@/components/billing/PayButton";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const status = params.status;

  const entitlement = session?.user?.id
    ? await getEntitlement(session.user.id)
    : null;

  if (!entitlement) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Link href="/login" className="text-primary hover:underline">
          Sign in to manage your plan
        </Link>
      </div>
    );
  }

  const trialNote = entitlement.isTrial && entitlement.trialEndsAt
    ? `Trial ends ${new Date(entitlement.trialEndsAt).toLocaleDateString()}`
    : entitlement.planExpiresAt
      ? `Active until ${new Date(entitlement.planExpiresAt).toLocaleDateString()}`
      : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your plan and payments</p>
      </div>

      {status === "success" && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            Payment confirmed! Your Business plan is now active. Refresh the page
            to see your updated access.
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">
            We couldn&apos;t confirm your payment. If you were charged, it will
            be applied automatically shortly — or try again.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-xl font-bold">{planLabel(entitlement.plan)}</p>
            {trialNote && (
              <p className="text-xs text-muted-foreground mt-0.5">{trialNote}</p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              entitlement.isFullAccess
                ? "bg-green-100 text-green-700"
                : entitlement.isTrial
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {entitlement.isFullAccess
              ? "Active"
              : entitlement.isTrial
                ? "Trial"
                : planLabel(entitlement.plan) === "Starter"
                  ? "Free"
                  : "Needs payment"}
          </span>
        </div>
      </div>

      {!entitlement.isFullAccess && (
        <PayButton currentPlan={entitlement.planStatus} />
      )}
    </div>
  );
}