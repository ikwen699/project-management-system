export const STATUS_CHIP_CLASSES: Record<string, string> = {
  PLANNING: "bg-status-planning/15 text-status-planning",
  ACTIVE: "bg-status-active/15 text-status-active",
  ON_HOLD: "bg-status-on-hold/15 text-status-on-hold",
  COMPLETED: "bg-status-completed/15 text-status-completed",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
};

export const PRIORITY_CHIP_CLASSES: Record<string, string> = {
  LOW: "bg-priority-low/15 text-priority-low",
  MEDIUM: "bg-priority-medium/15 text-priority-medium",
  HIGH: "bg-priority-high/15 text-priority-high",
  URGENT: "bg-priority-urgent/15 text-priority-urgent",
};

export const FALLBACK_CHIP_CLASS = "bg-muted text-muted-foreground";

export function statusChipClass(status?: string | null) {
  if (!status) return FALLBACK_CHIP_CLASS;
  return STATUS_CHIP_CLASSES[status] ?? FALLBACK_CHIP_CLASS;
}

export function priorityChipClass(priority?: string | null) {
  if (!priority) return FALLBACK_CHIP_CLASS;
  return PRIORITY_CHIP_CLASSES[priority] ?? FALLBACK_CHIP_CLASS;
}

export const PRIORITY_RAIL_CLASSES: Record<string, string> = {
  LOW: "border-l-priority-low",
  MEDIUM: "border-l-priority-medium",
  HIGH: "border-l-priority-high",
  URGENT: "border-l-priority-urgent",
};

export function priorityRailClass(priority?: string | null) {
  if (!priority) return "border-l-priority-medium";
  return PRIORITY_RAIL_CLASSES[priority] ?? "border-l-priority-medium";
}

export const COLUMN_CHIP_CLASSES: Record<string, string> = {
  "To Do": "bg-muted text-muted-foreground",
  "In Progress": "bg-status-active/15 text-status-active",
  Review: "bg-warning/15 text-warning",
  Done: "bg-status-completed/15 text-status-completed",
};

export function columnChipClass(columnName?: string | null) {
  if (!columnName) return FALLBACK_CHIP_CLASS;
  return COLUMN_CHIP_CLASSES[columnName] ?? "bg-primary/15 text-primary";
}
