"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown } from "lucide-react";

interface Task {
  id: string;
  title: string;
  priority: string;
  deadline: string | null;
  columnName: string;
  assigneeName: string | null;
  estimatedHours: number | null;
  timeSpent: number | null;
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function ListPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"title" | "priority" | "deadline">("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tasks`)
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false); });
  }, [projectId]);

  function toggleSort(field: "title" | "priority" | "deadline") {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  const sorted = [...tasks].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "priority") {
      return ((priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)) * dir;
    }
    if (sortField === "deadline") {
      const aDate = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDate = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return (aDate - bDate) * dir;
    }
    return a.title.localeCompare(b.title) * dir;
  });

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/projects/${projectId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </Link>
        <h1 className="text-2xl font-bold">List View</h1>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {[
                { key: "title" as const, label: "Title" },
                { key: "priority" as const, label: "Priority" },
                { key: "deadline" as const, label: "Deadline" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left px-4 py-3 text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Est.</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Spent</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => (
              <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority] || ""}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {task.deadline ? (
                    <span className={new Date(task.deadline) < new Date() ? "text-red-600" : ""}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{task.columnName}</td>
                <td className="px-4 py-3 text-sm">
                  {task.estimatedHours != null ? (
                    <span>{task.estimatedHours}h</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {task.timeSpent != null && task.timeSpent > 0 ? (
                    <span>{task.timeSpent >= 60 ? `${Math.floor(task.timeSpent / 60)}h ${task.timeSpent % 60}m` : `${task.timeSpent}m`}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{task.assigneeName || <span className="text-muted-foreground">Unassigned</span>}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No tasks yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
