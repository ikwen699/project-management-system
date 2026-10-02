export const PLAN_PROMPT_KEY = "xora-plan-prompt";
export const PLAN_PROMPT_SESSION_KEY = "xora-plan-prompt-shown";
export const PLAN_INTENT_KEY = "xora-plan-intent";

export type PlanIntent = "business" | "trial";

export function readPlanIntent(): PlanIntent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(PLAN_INTENT_KEY);
  if (value !== "business" && value !== "trial") return null;
  return value;
}

export function clearPlanIntent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAN_INTENT_KEY);
}