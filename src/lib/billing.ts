import { supabase } from "./supabase";
import type { Plan, PlanStatus } from "@/types";

const FREE_PROJECT_LIMIT = 3;

export interface Entitlement {
  isFullAccess: boolean;
  projectLimit: number;
  plan: Plan;
  planStatus: PlanStatus;
  isTrial: boolean;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
}

const freeEntitlement: Entitlement = {
  isFullAccess: false,
  projectLimit: FREE_PROJECT_LIMIT,
  plan: "starter",
  planStatus: "active",
  isTrial: false,
  trialEndsAt: null,
  planExpiresAt: null,
};

export async function getEntitlement(userId: string): Promise<Entitlement> {
  try {
    const { data: user } = await supabase
      .from("User")
      .select("role, plan, planStatus, planExpiresAt, trialEndsAt")
      .eq("id", userId)
      .single();

    if (!user) return freeEntitlement;

    // The creator always has full access.
    if (user.role === "SUPER_ADMIN") {
      return {
        isFullAccess: true,
        projectLimit: Infinity,
        plan: user.plan || "starter",
        planStatus: "active",
        isTrial: false,
        trialEndsAt: user.trialEndsAt ?? null,
        planExpiresAt: user.planExpiresAt ?? null,
      };
    }

    const now = new Date();
    const plan: Plan = user.plan || "starter";
    const status: PlanStatus = user.planStatus || "active";

    if (plan === "starter") {
      return { ...freeEntitlement, plan, planStatus: "active" };
    }

    // A trial that has run out downgrades to Starter.
    if (
      status === "trialing" &&
      user.trialEndsAt &&
      new Date(user.trialEndsAt) < now
    ) {
      return freeEntitlement;
    }

    // A paid plan whose period has elapsed downgrades to Starter.
    if (
      status === "active" &&
      user.planExpiresAt &&
      new Date(user.planExpiresAt) < now
    ) {
      return freeEntitlement;
    }

    const isFullAccess = status === "active";
    return {
      isFullAccess,
      projectLimit: isFullAccess ? Infinity : FREE_PROJECT_LIMIT,
      plan,
      planStatus: status,
      isTrial: status === "trialing",
      trialEndsAt: user.trialEndsAt ?? null,
      planExpiresAt: user.planExpiresAt ?? null,
    };
  } catch (error) {
    console.error("getEntitlement error:", error);
    return freeEntitlement;
  }
}

export function planLabel(plan: Plan): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}