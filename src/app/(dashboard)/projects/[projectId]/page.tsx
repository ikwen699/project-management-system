"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Calendar,
  User,
  Users,
  X,
  Check,
  Loader2,
  Archive,
  ArchiveRestore,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

interface Member {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  position: number;
  columnId: string;
  projectId: string;
  assigneeId: string | null;
  completedAt: string | null;
  columnName: string;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  estimatedHours: number | null;
  timeSpent: number | null;
}

interface Progress {
  totalTasks: number;
  completedTasks: number;
  assignedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  progress: number;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isArchived: boolean;
  startDate: string | null;
  endDate: string | null;
  ownerId: string;
  taskCount: number;
  memberCount: number;
  members: Member[];
  columns: { id: string; name: string }[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const columnColors: Record<string, string> = {
  "To Do": "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Review: "bg-yellow-100 text-yellow-700",
  Done: "bg-green-100 text-green-700",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingProject, setEditingProject] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskColumnId, setTaskColumnId] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskMenuId, setTaskMenuId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [proj, prog, taskList, memList] = await Promise.all([
        fetch(`/api/projects/${projectId}`).then((r) => r.json()),
        fetch(`/api/projects/${projectId}/progress`).then((r) => r.json()),
        fetch(`/api/projects/${projectId}/tasks`).then((r) => r.json()),
        fetch(`/api/projects/${projectId}/members`).then((r) => r.json()),
      ]);
      setProject(proj);
      setProgress(prog);
      setTasks(Array.isArray(taskList) ? taskList : []);
      setMembers(Array.isArray(memList) ? memList : []);
    } catch {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openEditProject() {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditStatus(project.status);
    setEditStartDate(project.startDate ? project.startDate.split("T")[0] : "");
    setEditEndDate(project.endDate ? project.endDate.split("T")[0] : "");
    setEditingProject(true);
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          status: editStatus,
          startDate: editStartDate || null,
          endDate: editEndDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
        return;
      }
      toast.success("Project updated!");
      setEditingProject(false);
      loadData();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject() {
    if (
      !confirm(
        "Delete this project? This will permanently delete all tasks, columns, and data. This cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Project deleted");
      router.push("/projects");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleArchiveProject() {
    if (
      !confirm(
        project?.isArchived
          ? "Restore this project?"
          : "Archive this project? It will be hidden from your project list."
      )
    )
      return;
    try {
      const res = await fetch(`/api/projects/${projectId}/archive`, {
        method: "PUT",
      });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success(project?.isArchived ? "Project restored!" : "Project archived!");
      if (project?.isArchived) {
        loadData();
      } else {
        router.push("/projects");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  function openCreateTask() {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("MEDIUM");
    setTaskDeadline("");
    setTaskColumnId(project?.columns?.[0]?.id || "");
    setTaskAssigneeId("");
    setTaskEstimatedHours("");
    setShowTaskForm(true);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreatingTask(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          priority: taskPriority,
          deadline: taskDeadline || null,
          columnId: taskColumnId,
          assigneeId: taskAssigneeId || null,
          estimatedHours: taskEstimatedHours ? parseFloat(taskEstimatedHours) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create task");
        return;
      }
      toast.success("Task created!");
      setShowTaskForm(false);
      loadData();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Task deleted");
      setSelectedTask(null);
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleQuickStatusChange(taskId: string, newColumnId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: newColumnId }),
      });
      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }
      toast.success("Task updated");
      setTaskMenuId(null);
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Project not found
      </div>
    );
  }

  const owner = project.members?.find((m) => m.role === "OWNER");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  statusColors[project.status] || ""
                }`}
              >
                {(project.status || "").replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              {owner && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Owner: {owner.userName}
                </span>
              )}
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Start:{" "}
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              )}
              {project.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Due:{" "}
                  {new Date(project.endDate).toLocaleDateString()}
                </span>
              )}
              <Link href={`/projects/${projectId}/members`} className="hover:underline">
                {project.memberCount} members
              </Link>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress?.progress || 0}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary rounded-full h-2.5 transition-all"
              style={{ width: `${progress?.progress || 0}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span>{progress?.completedTasks || 0} completed</span>
            <span>{progress?.totalTasks || 0} total</span>
            {progress?.overdueTasks ? (
              <span className="text-red-600">
                {progress.overdueTasks} overdue
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openEditProject}
            className="flex items-center gap-1.5 bg-white border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Project
          </button>
          <button
            onClick={openCreateTask}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
          <Link
            href={`/projects/${projectId}/board`}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Board View
          </Link>
          <Link
            href={`/projects/${projectId}/members`}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Users className="h-3.5 w-3.5" /> Members
          </Link>
          <button
            onClick={handleArchiveProject}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {project.isArchived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {project.isArchived ? "Restore" : "Archive"}
          </button>
          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-1.5 border border-destructive text-destructive px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            Tasks ({tasks.length})
          </h2>
        </div>
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No tasks yet</p>
            <button
              onClick={openCreateTask}
              className="text-sm text-primary hover:underline"
            >
              Create your first task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Task
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Assignee
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Priority
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Due
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Est.
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Spent
                  </th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            task.completedAt
                              ? "bg-green-500"
                              : task.priority === "URGENT"
                              ? "bg-red-500"
                              : task.priority === "HIGH"
                              ? "bg-orange-500"
                              : "bg-blue-400"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            task.completedAt
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {task.assigneeName || (
                        <span className="text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          columnColors[task.columnName] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {task.columnName}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          priorityColors[task.priority] || ""
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-3 text-sm">
                      {task.estimatedHours != null ? (
                        <span>{task.estimatedHours}h</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      {task.timeSpent != null && task.timeSpent > 0 ? (
                        <span>{task.timeSpent >= 60 ? `${Math.floor(task.timeSpent / 60)}h ${task.timeSpent % 60}m` : `${task.timeSpent}m`}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskMenuId(
                              taskMenuId === task.id ? null : task.id
                            );
                          }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {taskMenuId === task.id && (
                          <div className="absolute right-0 top-8 z-20 bg-white border border-border rounded-lg shadow-lg py-1 w-40">
                            {project.columns?.map((col) => (
                              <button
                                key={col.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (col.id !== task.columnId) {
                                    handleQuickStatusChange(task.id, col.id);
                                  } else {
                                    setTaskMenuId(null);
                                  }
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 ${
                                  col.id === task.columnId
                                    ? "font-medium text-primary"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    col.id === task.columnId
                                      ? "bg-primary"
                                      : "bg-gray-300"
                                  }`}
                                />
                                {col.name}
                                {col.id === task.columnId && (
                                  <Check className="h-3 w-3 ml-auto" />
                                )}
                              </button>
                            ))}
                            <hr className="my-1 border-border" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskMenuId(null);
                                handleDeleteTask(task.id);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 flex items-center gap-2"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditingProject(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Edit Project</h2>
              <button
                onClick={() => setEditingProject(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(false)}
                  className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTaskForm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Create Task</h2>
              <button
                onClick={() => setShowTaskForm(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
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
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Column
                  </label>
                  <select
                    value={taskColumnId}
                    onChange={(e) => setTaskColumnId(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {project.columns?.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName}
                      </option>
                    ))}
                  </select>
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
                  value={taskEstimatedHours}
                  onChange={(e) => setTaskEstimatedHours(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creatingTask ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                    </span>
                  ) : (
                    "Create Task"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedTask(null)}
          />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <h3 className="text-xl font-semibold">{selectedTask.title}</h3>
              {selectedTask.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description}
                </p>
              )}
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Status</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      columnColors[selectedTask.columnName] || "bg-gray-100"
                    }`}
                  >
                    {selectedTask.columnName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Priority</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      priorityColors[selectedTask.priority] || ""
                    }`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Due</span>
                  <span>
                    {selectedTask.deadline
                      ? new Date(selectedTask.deadline).toLocaleDateString()
                      : "None"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-20">Assignee</span>
                  <select
                    value={selectedTask.assigneeId || ""}
                    onChange={async (e) => {
                      const newAssigneeId = e.target.value || null;
                      try {
                        const res = await fetch(`/api/tasks/${selectedTask.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ assigneeId: newAssigneeId }),
                        });
                        if (!res.ok) {
                          toast.error("Failed to update assignee");
                          return;
                        }
                        const assigneeMember = members.find((m) => m.userId === newAssigneeId);
                        setSelectedTask({
                          ...selectedTask,
                          assigneeId: newAssigneeId,
                          assigneeName: assigneeMember?.userName || null,
                        });
                        toast.success("Assignee updated");
                        loadData();
                      } catch {
                        toast.error("Something went wrong");
                      }
                    }}
                    className="border border-border rounded-lg px-2 py-1 text-sm outline-none flex-1"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTask.estimatedHours != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-20">Est.</span>
                    <span>{selectedTask.estimatedHours}h</span>
                  </div>
                )}
                {selectedTask.timeSpent != null && selectedTask.timeSpent > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-20">Spent</span>
                    <span>{selectedTask.timeSpent >= 60 ? `${Math.floor(selectedTask.timeSpent / 60)}h ${selectedTask.timeSpent % 60}m` : `${selectedTask.timeSpent}m`}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium mb-1.5">
                  Change Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {project.columns?.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => {
                        if (col.id !== selectedTask.columnId) {
                          handleQuickStatusChange(selectedTask.id, col.id);
                          setSelectedTask({
                            ...selectedTask,
                            columnId: col.id,
                            columnName: col.name,
                          });
                        }
                      }}
                      className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                        col.id === selectedTask.columnId
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-border" />

              <button
                onClick={() => {
                  if (
                    confirm(
                      "Delete this task? This cannot be undone."
                    )
                  ) {
                    handleDeleteTask(selectedTask.id);
                  }
                }}
                className="flex items-center gap-2 text-sm text-destructive hover:underline"
              >
                <Trash2 className="h-4 w-4" /> Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
