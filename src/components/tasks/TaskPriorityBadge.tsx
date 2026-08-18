"use client";

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
