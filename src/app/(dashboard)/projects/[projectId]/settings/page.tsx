"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Archive, ArchiveRestore } from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isArchived: boolean;
  startDate: string | null;
  endDate: string | null;
  ownerId: string;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setName(data.name);
        setDescription(data.description || "");
        setStatus(data.status);
        setStartDate(data.startDate ? data.startDate.split("T")[0] : "");
        setEndDate(data.endDate ? data.endDate.split("T")[0] : "");
        setLoading(false);
      });
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, status, startDate: startDate || null, endDate: endDate || null }),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      toast.success("Project updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!confirm(project?.isArchived ? "Restore this project?" : "Archive this project? It will be hidden from your project list.")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/archive`, { method: "PUT" });
      if (!res.ok) { toast.error("Failed"); return; }
      toast.success(project?.isArchived ? "Project restored!" : "Project archived!");
      router.push(project?.isArchived ? `/projects/${projectId}` : "/projects");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project? This will permanently delete all tasks, columns, and data. This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed"); return; }
      toast.success("Project deleted");
      router.push("/projects");
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/projects/${projectId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </Link>
        <h1 className="text-2xl font-bold">Project Settings</h1>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Project</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Project Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <button onClick={handleArchive} className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors w-full justify-center">
            {project?.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {project?.isArchived ? "Restore Project" : "Archive Project"}
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 border border-destructive text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/5 transition-colors w-full justify-center">
            <Trash2 className="h-4 w-4" />
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}
