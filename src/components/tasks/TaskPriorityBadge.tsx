"use client";

import { PRIORITY_CHIP_CLASSES } from "@/lib/chip-colors";

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: PRIORITY_CHIP_CLASSES.LOW },
  MEDIUM: { label: "Medium", className: PRIORITY_CHIP_CLASSES.MEDIUM },
  HIGH: { label: "High", className: PRIORITY_CHIP_CLASSES.HIGH },
  URGENT: { label: "Urgent", className: PRIORITY_CHIP_CLASSES.URGENT },
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
