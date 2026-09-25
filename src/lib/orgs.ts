export const ORG_TYPES = [
  "Business",
  "Marketing",
  "Sales",
  "Software",
  "Education",
  "Healthcare",
  "Media",
  "Design",
  "Support",
  "Finance",
] as const;

export const TEAM_SUGGESTIONS = [
  "Operations",
  "Engineering",
  "Sales",
  "Marketing",
  "Design",
  "Support",
  "Finance",
  "HR",
  "Product",
  "Research",
] as const;

export function normalizeType(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Other";
  return trimmed;
}