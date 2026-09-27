"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users,
  FolderKanban,
  Loader2,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Check,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  removalScheduledAt: string | null;
}

interface AdminFeedback {
  id: string;
  category: "BUG" | "SUGGESTION" | "OTHER";
  subject: string;
  message: string;
  page: string | null;
  status: "NEW" | "READ" | "RESOLVED";
  userId: string;
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const feedbackStatusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  READ: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
};

const feedbackCategoryColors: Record<string, string> = {
  BUG: "bg-red-100 text-red-700",
  SUGGESTION: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "users" | "feedback">("projects");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [updatingFeedback, setUpdatingFeedback] = useState<string | null>(null);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<"ALL" | "NEW" | "READ" | "RESOLVED">("ALL");

  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [creatingUser, setCreatingUser] = useState(false);

  const [showRemoveUsers, setShowRemoveUsers] = useState(false);
  const [removalUserIds, setRemovalUserIds] = useState<string[]>([]);
  const [removalMode, setRemovalMode] = useState<"instant" | "scheduled">("instant");
  const [removalDays, setRemovalDays] = useState<number>(7);
  const [removalCustomDate, setRemovalCustomDate] = useState("");
  const [removalSubmitting, setRemovalSubmitting] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const currentUserId = (session?.user as any)?.id;
  const selectableUsers = users.filter((u) => u.id !== currentUserId);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedUserIds.has(u.id));
  const someSelected = selectedUserIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, userRes, feedbackRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/users"),
        fetch("/api/admin/feedback"),
      ]);

      if (
        projRes.status === 401 ||
        projRes.status === 403 ||
        userRes.status === 401 ||
        userRes.status === 403 ||
        feedbackRes.status === 401 ||
        feedbackRes.status === 403
      ) {
        toast.error("Access denied — super admin only");
        router.push("/dashboard");
        return;
      }

      if (projRes.ok) setProjects(await projRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (feedbackRes.ok) setFeedback(await feedbackRes.json());
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, loadData]);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingUser(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
        return;
      }
      toast.success("Role updated");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingUser(null);
    }
  }

  function openRemoveModal(userIds: string[]) {
    setRemovalUserIds(userIds);
    setRemovalMode("instant");
    setRemovalDays(7);
    setRemovalCustomDate("");
    setShowRemoveUsers(true);
  }

  function handleDeleteUser(userId: string, userName: string) {
    openRemoveModal([userId]);
  }

  async function handleBulkDeleteUsers() {
    const count = selectedUserIds.size;
    if (count === 0) return;
    openRemoveModal(Array.from(selectedUserIds));
  }

  async function handleRemoveUsersSubmit() {
    setRemovalSubmitting(true);
    try {
      if (removalMode === "instant") {
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: removalUserIds }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to remove users");
          return;
        }
        const data = await res.json();
        const deletedCount = data.deleted || 0;
        if (deletedCount > 0) {
          toast.success(`${deletedCount} user${deletedCount > 1 ? "s" : ""} removed`);
          setUsers((prev) => prev.filter((u) => !removalUserIds.includes(u.id)));
        }
        if (data.skipped && data.skipped.length > 0) {
          data.skipped.forEach((s: { userId: string; reason: string }) => {
            toast.error(s.reason);
          });
        }
      } else {
        let scheduledFor: string;
        if (removalCustomDate) {
          scheduledFor = new Date(removalCustomDate).toISOString();
        } else {
          const date = new Date();
          date.setDate(date.getDate() + removalDays);
          scheduledFor = date.toISOString();
        }
        const res = await fetch("/api/admin/users/removal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: removalUserIds, scheduledFor }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Failed to schedule removal");
          return;
        }
        const data = await res.json();
        const scheduledCount = data.scheduled || 0;
        if (scheduledCount > 0) {
          toast.success(`${scheduledCount} user${scheduledCount > 1 ? "s" : ""} scheduled for removal`);
          setUsers((prev) =>
            prev.map((u) =>
              removalUserIds.includes(u.id) ? { ...u, removalScheduledAt: scheduledFor } : u
            )
          );
        }
        if (data.skipped && data.skipped.length > 0) {
          data.skipped.forEach((s: { userId: string; reason: string }) => {
            toast.error(s.reason);
          });
        }
      }
      setShowRemoveUsers(false);
      setSelectedUserIds(new Set());
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRemovalSubmitting(false);
    }
  }

  async function handleCancelScheduledRemoval(userId: string) {
    try {
      const res = await fetch("/api/admin/users/removal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel scheduled removal");
        return;
      }
      toast.success("Scheduled removal cancelled");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, removalScheduledAt: null } : u))
      );
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handlePurgeNow(userId: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to purge user");
        return;
      }
      toast.success("User purged");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleToggleUserSelection(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function handleSelectAllUsers() {
    const currentUserId = (session?.user as any)?.id;
    const selectableUsers = users.filter((u) => u.id !== currentUserId);
    if (selectableUsers.every((u) => selectedUserIds.has(u.id))) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(selectableUsers.map((u) => u.id)));
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("All fields are required");
      return;
    }
    setCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
        return;
      }
      const user = await res.json();
      toast.success("User created!");
      setUsers((prev) => [user, ...prev]);
      setShowAddUser(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("USER");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleFeedbackStatusChange(feedbackId: string, newStatus: "NEW" | "READ" | "RESOLVED") {
    setUpdatingFeedback(feedbackId);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: feedbackId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update feedback");
        return;
      }
      toast.success(`Feedback marked as ${newStatus}`);
      setFeedback((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingFeedback(null);
    }
  }

  async function handleDeleteFeedback(feedbackId: string, subject: string) {
    if (!confirm(`Delete feedback "${subject}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/feedback?id=${feedbackId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete feedback");
        return;
      }
      toast.success("Feedback deleted");
      setFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
    } catch {
      toast.error("Something went wrong");
    }
  }

  const filteredFeedback = feedback.filter((f) =>
    feedbackStatusFilter === "ALL" ? true : f.status === feedbackStatusFilter
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0 && users.length === 0 && feedback.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all projects, users, and feedback across the system.
        </p>
      </div>

      <div className="flex border-b border-border">
        {([
          { key: "projects" as const, label: "All Projects", icon: FolderKanban, count: projects.length },
          { key: "users" as const, label: "All Users", icon: Users, count: users.length },
          { key: "feedback" as const, label: "Feedback", icon: MessageSquare, count: feedback.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "projects" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No projects found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Project</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Members</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p>{project.ownerName}</p>
                          <p className="text-xs text-muted-foreground">{project.ownerEmail}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] || ""}`}>
                          {(project.status || "").replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{project.memberCount}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-primary text-sm hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add User
            </button>
          </div>

          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 border border-border">
              <span className="text-sm font-medium">
                {selectedUserIds.size} user{selectedUserIds.size > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={handleBulkDeleteUsers}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedUserIds(new Set())}
                className="border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="p-3 w-12">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAllUsers}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                      <th className="p-3 w-56">Actions</th>
                    </tr>
                  </thead>
<tbody>
                    {users.map((user) => {
                      const isCurrentUser = user.id === (session?.user as any)?.id;
                      return (
                        <tr
                          key={user.id}
                          className={`border-b border-border last:border-0 hover:bg-muted/20 ${
                            selectedUserIds.has(user.id) ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(user.id)}
                              onChange={() => handleToggleUserSelection(user.id)}
                              disabled={isCurrentUser}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="p-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-[10px] font-medium text-primary-foreground">
                                  {user.name?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                            <span className="font-medium">{user.name}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">{user.email}</td>
                          <td className="p-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                user.role === "SUPER_ADMIN"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.role === "SUPER_ADMIN" ? "Super Admin" : "User"}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {user.removalScheduledAt ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                                  Removes {new Date(user.removalScheduledAt).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={() => handleCancelScheduledRemoval(user.id)}
                                  disabled={user.id === (session?.user as any)?.id}
                                  className="p-1.5 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Cancel scheduled removal"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handlePurgeNow(user.id)}
                                  disabled={user.id === (session?.user as any)?.id}
                                  className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Purge now"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  disabled={updatingUser === user.id || user.id === (session?.user as any)?.id}
                                  className="border border-border rounded-lg px-2 py-1 text-sm outline-none disabled:opacity-50"
                                >
                                  <option value="USER">User</option>
                                  <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  disabled={user.id === (session?.user as any)?.id}
                                  className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Remove user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(["ALL", "NEW", "READ", "RESOLVED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFeedbackStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    feedbackStatusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {filteredFeedback.length} of {feedback.length} feedback
            </span>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {filteredFeedback.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No feedback found</p>
                {feedback.length > 0 && (
                  <p className="text-sm mt-1">Try changing the filter</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Subject / Message</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Page</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="p-3 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedback.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feedbackCategoryColors[item.category] || ""}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 max-w-md">
                          <p className="font-medium truncate">{item.subject}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5 line-clamp-2">
                            {item.message}
                          </p>
                        </td>
                        <td className="p-3">
                          <div>
                            <p>{item.User?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{item.User?.email || ""}</p>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {item.page ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.page}</code>
                          ) : (
                            <span className="text-xs">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feedbackStatusColors[item.status] || ""}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {item.status !== "READ" && (
                              <button
                                onClick={() => handleFeedbackStatusChange(item.id, "READ")}
                                disabled={updatingFeedback === item.id}
                                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-30"
                                title="Mark as Read"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {item.status !== "RESOLVED" && (
                              <button
                                onClick={() => handleFeedbackStatusChange(item.id, "RESOLVED")}
                                disabled={updatingFeedback === item.id}
                                className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-30"
                                title="Mark as Resolved"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFeedback(item.id, item.subject)}
                              className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showRemoveUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRemoveUsers(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {removalMode === "instant" ? "Remove Users" : "Schedule User Removal"}
              </h2>
              <button
                onClick={() => setShowRemoveUsers(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                {removalUserIds.length === 1 ? (
                  <>
                    <p className="font-medium">1 user selected</p>
                    <p>Are you sure you want to {removalMode === "instant" ? "remove" : "schedule removal for"} this user?</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{removalUserIds.length} users selected</p>
                    <p>Are you sure you want to {removalMode === "instant" ? "remove" : "schedule removal for"} these users?</p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRemovalMode("instant")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    removalMode === "instant"
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "hover:bg-muted border-border"
                  }`}
                >
                  Remove Now
                </button>
                <button
                  type="button"
                  onClick={() => setRemovalMode("scheduled")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    removalMode === "scheduled"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted border-border"
                  }`}
                >
                  Schedule
                </button>
              </div>

              {removalMode === "scheduled" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select when to remove:</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setRemovalDays(days);
                          setRemovalCustomDate("");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          removalDays === days && !removalCustomDate
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted border-border"
                        }`}
                      >
                        {days} day{days > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={removalCustomDate}
                      onChange={(e) => {
                        setRemovalCustomDate(e.target.value);
                        setRemovalDays(7);
                      }}
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      className="flex-1 border border-input rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">Custom date</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRemoveUsersSubmit}
                  disabled={removalSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    removalMode === "instant"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {removalSubmitting
                    ? removalMode === "instant"
                      ? "Removing..."
                      : "Scheduling..."
                    : removalMode === "instant"
                    ? "Remove Now"
                    : "Schedule Removal"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemoveUsers(false)}
                  className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddUser(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="USER">User</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}