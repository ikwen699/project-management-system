"use client";

import { Calendar } from "lucide-react";

interface TaskDeadlineProps {
  deadline: string | null;
  completedAt?: string | null;
}

export function TaskDeadline({ deadline, completedAt }: TaskDeadlineProps) {
  if (!deadline) return null;

  const date = new Date(deadline);
  const now = new Date();
  const isOverdue = date < now && !completedAt;
  const isDueSoon =
    !isOverdue &&
    date.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;

  let className = "text-xs text-muted-foreground";
  if (isOverdue) className = "text-xs text-red-600 font-medium";
  else if (isDueSoon) className = "text-xs text-amber-600 font-medium";

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <Calendar className="h-3 w-3" />
      {date.toLocaleDateString()}
    </span>
  );
}
