"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Archive } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Project {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
}

const statusColor: Record<string, string> = {
  PLANNING: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
          <Link href="/projects/archived" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Archive className="h-4 w-4" />
            Archived
          </Link>
          <Link href="/projects/new" className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No projects yet</p>
          <Link href="/projects/new" className="mt-2 inline-block text-primary hover:underline text-sm font-medium">
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.startDate ? `Started ${new Date(project.startDate).toLocaleDateString()}` : "No start date"}
                    {project.endDate ? ` · Due ${new Date(project.endDate).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[project.status] || ""}`}>{(project.status || "").replace("_", " ")}</span>
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
  );
}
