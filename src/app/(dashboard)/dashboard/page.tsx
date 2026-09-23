"use client";

import { useEffect, useState } from "react";
import { FolderKanban, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface Metrics {
  totalProjects: number;
  taskCompletionRate: number;
  onTimeCompletion: number;
  overdueTasks: number;
  totalTasks: number;
  completedTasks: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  endDate: string | null;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/metrics").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([metricsData, projectsData]) => {
        setMetrics(metricsData);
        setProjects(Array.isArray(projectsData) ? projectsData.slice(0, 5) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Projects", value: metrics?.totalProjects ?? 0, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Task Completion", value: `${metrics?.taskCompletionRate ?? 0}%`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "On-Time Rate", value: `${metrics?.onTimeCompletion ?? 0}%`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Overdue Tasks", value: metrics?.overdueTasks ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  const statusColor: Record<string, string> = {
    PLANNING: "bg-gray-100 text-gray-700",
    ACTIVE: "bg-green-100 text-green-700",
    ON_HOLD: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here&apos;s an overview of your projects.</p>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <CardSkeleton />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.bg} ${card.color} p-3 rounded-lg`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <Link href="/projects" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No projects yet</p>
                <a href="/projects/new" className="mt-2 inline-block text-primary hover:underline text-sm font-medium">Create your first project</a>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {project.endDate ? `Due ${new Date(project.endDate).toLocaleDateString()}` : "No deadline"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[project.status] || ""}`}>{project.status.replace("_", " ")}</span>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{project.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
