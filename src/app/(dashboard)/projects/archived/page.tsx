"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  taskcount: number;
}

export default function ArchivedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects/archived")
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <h1 className="text-2xl font-bold">Archived Projects</h1>
        <p className="text-muted-foreground">Projects that have been archived</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
          <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No archived projects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/settings`}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow opacity-75 hover:opacity-100"
            >
              <h3 className="font-semibold">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-3">{project.taskcount} tasks</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
