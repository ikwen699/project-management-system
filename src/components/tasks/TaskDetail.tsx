"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Trash2,
  Calendar,
  User,
  Clock,
  Play,
  Square,
  Plus,
  Paperclip,
  Upload,
  File,
  Download,
  Loader2,
  Timer,
} from "lucide-react";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import toast from "react-hot-toast";

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  userName: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  fileUrl: string;
  userName: string;
  createdAt: string;
}

interface TaskDetailProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    deadline: string | null;
    columnName?: string;
    assigneeId: string | null;
    assigneeName: string | null;
    estimatedHours?: number | null;
    timeSpent?: number | null;
  };
  columns: { id: string; name: string }[];
  members: { userId: string; userName: string }[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function TaskDetail({
  task,
  columns,
  members,
  onClose,
  onSaved,
  onDeleted,
}: TaskDetailProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [deadline, setDeadline] = useState(
    task.deadline ? task.deadline.split("T")[0] : ""
  );
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [estimatedHours, setEstimatedHours] = useState(
    task.estimatedHours?.toString() || ""
  );
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"details" | "time" | "files">("details");

  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeLoading, setTimeLoading] = useState(false);
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // File state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTimeEntries = useCallback(async () => {
    setTimeLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/time`);
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(data);
        const running = data.find((e: TimeEntry) => !e.endTime);
        setRunningEntry(running || null);
      }
    } catch {
      toast.error("Failed to load time entries");
    } finally {
      setTimeLoading(false);
    }
  }, [task.id]);

  const loadAttachments = useCallback(async () => {
    setFileLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments`);
      if (res.ok) {
        setAttachments(await res.json());
      }
    } catch {
      toast.error("Failed to load files");
    } finally {
      setFileLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    if (activeTab === "time") loadTimeEntries();
    if (activeTab === "files") loadAttachments();
  }, [activeTab, loadTimeEntries, loadAttachments]);

  // Timer tick
  useEffect(() => {
    if (runningEntry) {
      const start = new Date(runningEntry.startTime).getTime();
      setElapsed(Math.floor((Date.now() - start) / 60000));
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 60000));
      }, 30000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsed(0);
    }
  }, [runningEntry]);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          deadline: deadline || null,
          assigneeId: assigneeId || null,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }
      toast.success("Task updated");
      setEditing(false);
      onSaved();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Task deleted");
      onDeleted();
      onClose();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleStartTimer() {
    try {
      const res = await fetch(`/api/tasks/${task.id}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Working on task" }),
      });
      if (!res.ok) {
        toast.error("Failed to start timer");
        return;
      }
      toast.success("Timer started");
      loadTimeEntries();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleStopTimer() {
    if (!runningEntry) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/time`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: runningEntry.id }),
      });
      if (!res.ok) {
        toast.error("Failed to stop timer");
        return;
      }
      toast.success("Timer stopped");
      setRunningEntry(null);
      loadTimeEntries();
      onSaved();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleManualEntry() {
    if (!manualStart || !manualEnd) {
      toast.error("Start and end times are required");
      return;
    }
    try {
      const res = await fetch(`/api/tasks/${task.id}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: new Date(manualStart).toISOString(),
          endTime: new Date(manualEnd).toISOString(),
          description: manualDesc || null,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to add entry");
        return;
      }
      toast.success("Time entry added");
      setShowManualForm(false);
      setManualStart("");
      setManualEnd("");
      setManualDesc("");
      loadTimeEntries();
      onSaved();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/time?entryId=${entryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Entry deleted");
      loadTimeEntries();
      onSaved();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
        return;
      }
      toast.success("File uploaded");
      loadAttachments();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("File deleted");
      loadAttachments();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="text-sm text-primary hover:underline"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-lg"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Estimated Hours</label>
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
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border">
              <h3 className="text-xl font-semibold mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{task.columnName || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{task.assigneeName || "Unassigned"}</span>
                </div>
                {task.estimatedHours != null && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Est: {task.estimatedHours}h</span>
                  </div>
                )}
                {task.timeSpent != null && task.timeSpent > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Spent: {formatDuration(task.timeSpent)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-b border-border">
              {(["details", "time", "files"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "details" && "Details"}
                  {tab === "time" && (
                    <span className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Time
                    </span>
                  )}
                  {tab === "files" && (
                    <span className="flex items-center justify-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" /> Files
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "details" && (
                <div className="space-y-3">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-sm text-destructive hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Task
                  </button>
                </div>
              )}

              {activeTab === "time" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Time Tracking</h4>
                    <div className="flex gap-2">
                      {!runningEntry ? (
                        <button
                          onClick={handleStartTimer}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <Play className="h-3.5 w-3.5" /> Start Timer
                        </button>
                      ) : (
                        <button
                          onClick={handleStopTimer}
                          className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <Square className="h-3.5 w-3.5" /> Stop ({formatDuration(elapsed)})
                        </button>
                      )}
                      <button
                        onClick={() => setShowManualForm(!showManualForm)}
                        className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Manual
                      </button>
                    </div>
                  </div>

                  {showManualForm && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Start</label>
                          <input
                            type="datetime-local"
                            value={manualStart}
                            onChange={(e) => setManualStart(e.target.value)}
                            className="w-full border border-input rounded-lg px-2 py-1.5 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">End</label>
                          <input
                            type="datetime-local"
                            value={manualEnd}
                            onChange={(e) => setManualEnd(e.target.value)}
                            className="w-full border border-input rounded-lg px-2 py-1.5 text-sm outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <input
                          type="text"
                          value={manualDesc}
                          onChange={(e) => setManualDesc(e.target.value)}
                          placeholder="What did you work on?"
                          className="w-full border border-input rounded-lg px-2 py-1.5 text-sm outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleManualEntry}
                          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90"
                        >
                          Add Entry
                        </button>
                        <button
                          onClick={() => setShowManualForm(false)}
                          className="border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Time Spent</span>
                    <span className="font-semibold">{formatDuration(task.timeSpent || 0)}</span>
                  </div>

                  {timeLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Loading...
                    </div>
                  ) : timeEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No time entries yet. Start a timer or add a manual entry.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {timeEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white border border-border rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {entry.userName}
                                {entry.description && (
                                  <span className="text-muted-foreground font-normal">
                                    {" — "}{entry.description}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(entry.startTime).toLocaleString()}{" "}
                                {entry.endTime
                                  ? `→ ${new Date(entry.endTime).toLocaleString()}`
                                  : "(running)"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {entry.endTime
                                  ? formatDuration(entry.duration)
                                  : formatDuration(elapsed)}
                              </span>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Attachments</h4>
                    <label className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5" /> Upload File
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={fileLoading}
                      />
                    </label>
                  </div>

                  {fileLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Loading...
                    </div>
                  ) : attachments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No files attached. Click Upload to add a file.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="bg-white border border-border rounded-lg p-3 flex items-center gap-3"
                        >
                          <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(att.fileSize)} · {att.userName} ·{" "}
                              {new Date(att.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
