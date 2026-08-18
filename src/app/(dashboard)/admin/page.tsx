"use client";

import { useEffect, useState, useCallback } from "react";
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
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "users">("projects");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [creatingUser, setCreatingUser] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, userRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/users"),
      ]);

      if (projRes.status === 401 || projRes.status === 403 || userRes.status === 401 || userRes.status === 403) {
        toast.error("Access denied — super admin only");
        router.push("/");
        return;
      }

      if (projRes.ok) setProjects(await projRes.json());
      if (userRes.ok) setUsers(await userRes.json());
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

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete user");
        return;
      }
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      toast.error("Something went wrong");
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

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0 && users.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all projects and users across the system.
        </p>
      </div>

      <div className="flex border-b border-border">
        {([
          { key: "projects" as const, label: "All Projects", icon: FolderKanban, count: projects.length },
          { key: "users" as const, label: "All Users", icon: Users, count: users.length },
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

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                      <th className="p-3 w-56">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
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
                          </div>
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
                              title="Delete user"
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
