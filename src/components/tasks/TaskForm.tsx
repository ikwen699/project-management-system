"use client";

import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { UserSelect } from "@/components/ui/UserSelect";

interface Column {
  id: string;
  name: string;
}

interface Member {
  userId: string;
  userName: string;
}

interface TeamOption {
  id: string;
  name: string;
  memberCount?: number;
}

interface TaskFormProps {
  projectId: string;
  columns: Column[];
  members: Member[];
  teams?: TeamOption[];
  initialColumnId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialPriority?: string;
  initialDeadline?: string;
  initialAssigneeId?: string;
  initialEstimatedHours?: string;
  initialTeamId?: string;
  taskId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskForm({
  projectId,
  columns,
  members,
  teams = [],
  initialColumnId,
  initialTitle = "",
  initialDescription = "",
  initialPriority = "MEDIUM",
  initialDeadline = "",
  initialAssigneeId = "",
  initialEstimatedHours = "",
  initialTeamId = "",
  taskId,
  onClose,
  onSaved,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState(initialPriority);
  const [deadline, setDeadline] = useState(initialDeadline);
  const [columnId, setColumnId] = useState(initialColumnId || columns[0]?.id || "");
  const [teamId, setTeamId] = useState(initialTeamId);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [assigneeId, setAssigneeId] = useState(initialAssigneeId);
  const [estimatedHours, setEstimatedHours] = useState(initialEstimatedHours);
  const [loading, setLoading] = useState(false);

  function handleTeamChange(nextTeamId: string) {
    setTeamId(nextTeamId);
    setAssigneeId("");
    if (!nextTeamId) {
      setTeamMemberIds([]);
      return;
    }
    setTeamLoading(true);
    fetch(`/api/teams/${nextTeamId}/members`)
      .then((r) => r.json())
      .then((data: { members: { userId: string }[] }) => {
        const ids = Array.isArray(data.members)
          ? data.members.map((m) => m.userId)
          : [];
        setTeamMemberIds(ids);
      })
      .catch(() => setTeamMemberIds([]))
      .finally(() => setTeamLoading(false));
  }

  const assigneeOptions =
    teams.length > 0 && teamId
      ? members.filter((m) => teamMemberIds.includes(m.userId))
      : members;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);

    try {
      const url = taskId ? `/api/tasks/${taskId}` : `/api/projects/${projectId}/tasks`;
      const method = taskId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          deadline: deadline || null,
          columnId,
          assigneeId: assigneeId || null,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          teamId: teamId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save task");
        return;
      }

      toast.success(taskId ? "Task updated!" : "Task created!");
      onSaved();
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {taskId ? "Edit Task" : "Create Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Column</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {teams.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Team</label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Assignee
                {teamLoading && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    loading…
                  </span>
                )}
              </label>
              <UserSelect
                users={assigneeOptions}
                value={assigneeId}
                onChange={setAssigneeId}
                placeholder="Unassigned"
              />
              {teams.length > 0 && teamId && assigneeOptions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No members in this team yet.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Estimated Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="e.g. 8"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : taskId ? "Save Changes" : "Create Task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
