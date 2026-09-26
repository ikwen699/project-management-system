"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  UserPlus,
  Mail,
  X,
  FolderKanban,
  Check,
  Shield,
  Loader2,
  ArrowUpRight,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface TeamMemberView {
  userId: string;
  role: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
}

interface TeamView {
  id: string;
  name: string;
  type: string;
  members: TeamMemberView[];
  memberCount: number;
}

interface OrgMemberView {
  userId: string;
  role: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  teamRole: string;
  teamId: string | null;
  token: string;
  createdAt: string;
  expiresAt: string | null;
}

interface OrgDetail {
  id: string;
  name: string;
  type: string;
  description: string | null;
  ownerId: string;
  myRole: string | null;
  memberCount: number;
  members: OrgMemberView[];
  teams: TeamView[];
  pendingInvites: PendingInvite[];
  projects: { id: string; name: string; status: string }[];
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviteTeamRole, setInviteTeamRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    token: string;
    message: string;
  } | null>(null);

  const [newTeamName, setNewTeamName] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);

  const isAdmin = org?.myRole === "ADMIN";

  const loadData = useCallback(async () => {
    fetch(`/api/organizations/${organizationId}`)
      .then((r) => r.json())
      .then((data) => setOrg(data.organization || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced email search scoped to Xora users (exact matches always).
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!inviteEmail || inviteEmail.trim().length < 2 || !inviteOpen) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      fetch(
        `/api/users/search?email=${encodeURIComponent(inviteEmail.trim())}&organizationId=${organizationId}`
      )
        .then((r) => r.json())
        .then((data) => setSearchResults(Array.isArray(data.users) ? data.users : []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [inviteEmail, inviteOpen, organizationId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const invitedEmail = inviteEmail.trim();
    if (!invitedEmail) {
      toast.error("Enter an email address");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitedEmail,
          role: inviteRole,
          teamId: inviteTeamId || null,
          teamRole: inviteTeamRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add member");
        return;
      }
      toast.success(data.message || "Member added");
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInviteTeamRole("MEMBER");
      setInviteTeamId("");
      setSearchResults([]);
      loadData();
      if (data.token) {
        // Unknown email: show the shareable invite link instead of closing.
        setInviteResult({
          email: invitedEmail,
          token: data.token,
          message: data.message || "",
        });
      } else {
        setInviteOpen(false);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setInviteLoading(false);
    }
  }

  function buildInviteLink(token: string) {
    if (typeof window === "undefined") return `/invite?token=${token}`;
    return `${window.location.origin}/invite?token=${token}`;
  }

  async function copyInviteLink(token: string) {
    try {
      await navigator.clipboard.writeText(buildInviteLink(token));
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  function openInvite() {
    setInviteResult(null);
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteResult(null);
    setInviteOpen(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamLoading(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create team");
        return;
      }
      toast.success("Team created");
      setNewTeamName("");
      loadData();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTeamLoading(false);
    }
  }

  async function handleSetTeamRole(
    teamId: string,
    userId: string,
    teamRole: string
  ) {
    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/teams/${teamId}/members`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, teamRole }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
        return;
      }
      toast.success("Team role updated");
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRemoveFromTeam(teamId: string, userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/teams/${teamId}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove");
        return;
      }
      toast.success("Removed from team");
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm("Delete this team?")) return;
    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/teams/${teamId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete team");
        return;
      }
      toast.success("Team deleted");
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleSetOrgRole(userId: string, role: string) {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
        return;
      }
      toast.success("Role updated");
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remove this member from the organisation?")) return;
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
        return;
      }
      toast.success("Member removed");
      loadData();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteOrg() {
    if (
      !confirm(
        "Delete this organisation? Teams, memberships and invites will be removed. Linked projects are kept."
      )
    )
      return;
    try {
      const res = await fetch(`/api/organizations/${organizationId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Organisation deleted");
      router.push("/organizations");
    } catch {
      toast.error("Something went wrong");
    }
  }

  const isOwner = (userId: string) => org?.ownerId === userId;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Organisation</h1>
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Organisation not found or you don&apos;t have access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/organizations"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Organisations
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{org.name}</h1>
            {org.myRole && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted font-medium">
                {org.myRole === "ADMIN" ? (
                  <Shield className="h-3 w-3 text-primary" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {org.myRole}
              </span>
            )}
            {org.type && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {org.type}
              </span>
            )}
          </div>
          {org.description && (
            <p className="text-muted-foreground text-sm mt-1">{org.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openInvite}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Invite Member
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleDeleteOrg}
              className="flex items-center gap-1.5 border border-destructive text-destructive px-3 py-2 rounded-lg text-sm font-medium hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {org.projects.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Linked Projects ({org.projects.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {org.projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{p.name}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Teams ({org.teams.length})</h2>
          {isAdmin && (
            <form onSubmit={handleCreateTeam} className="flex items-center gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="New team name..."
                className="border border-input rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={teamLoading || !newTeamName.trim()}
                className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
          )}
        </div>

        {org.teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No teams yet. Create a team to organise your members.
          </div>
        ) : (
          <div className="space-y-4">
            {org.teams.map((team) => (
              <div key={team.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.memberCount} members {team.type ? `· ${team.type}` : ""}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-1.5 hover:bg-muted rounded text-destructive"
                      aria-label={`Delete ${team.name} team`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {team.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {team.members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between py-1"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            {m.userAvatar ? (
                              <img
                                src={m.userAvatar}
                                alt=""
                                className="h-7 w-7 rounded-full"
                              />
                            ) : (
                              <span className="text-[10px] font-medium text-primary-foreground">
                                {m.userName?.charAt(0) || "?"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {m.userEmail}
                            </p>
                          </div>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium ml-2">
                            {m.role === "LEAD" ? "Task head" : "Member"}
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleSetTeamRole(
                                  team.id,
                                  m.userId,
                                  m.role === "LEAD" ? "MEMBER" : "LEAD"
                                )
                              }
                              className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                              title={
                                m.role === "LEAD"
                                  ? "Make member"
                                  : "Make task head"
                              }
                            >
                              {m.role === "LEAD"
                                ? "Make member"
                                : "Make lead"}
                            </button>
                            <button
                              onClick={() => handleRemoveFromTeam(team.id, m.userId)}
                              className="p-1 hover:bg-muted rounded text-destructive"
                              aria-label="Remove from team"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <button
            onClick={openInvite}
            className="mt-4 flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <UserPlus className="h-4 w-4" /> Add a member to a team
          </button>
        )}
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold mb-4">
          Members ({org.memberCount})
        </h2>
        <div className="divide-y divide-border">
          {org.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  {m.userAvatar ? (
                    <img src={m.userAvatar} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-xs font-medium text-primary-foreground">
                      {m.userName?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.userEmail}</p>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium ml-2">
                  {m.role}
                </span>
              </div>
              {isAdmin && !isOwner(m.userId) && (
                <>
                  <button
                    onClick={() =>
                      handleSetOrgRole(
                        m.userId,
                        m.role === "ADMIN" ? "MEMBER" : "ADMIN"
                      )
                    }
                    className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    {m.role === "ADMIN" ? "Make member" : "Make admin"}
                  </button>
                  <button
                    onClick={() => handleRemoveMember(m.userId)}
                    className="ml-2 p-1.5 hover:bg-muted rounded text-destructive"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {(isAdmin && org.pendingInvites.length > 0) ? (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">
            Pending Invites ({org.pendingInvites.length})
          </h2>
          <div className="divide-y divide-border">
            {org.pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited{" "}
                      {inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString()
                        : ""}{" "}
                      ·{" "}
                      {inv.role === "ADMIN" ? "Admin" : "Member"}
                      {inv.teamId ? " · team" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                  <button
                    type="button"
                    onClick={() => copyInviteLink(inv.token)}
                    title="Copy invite link"
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeInvite}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Invite Member</h2>
              <button
                onClick={closeInvite}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {inviteResult ? (
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-800 min-w-0">
                    <p className="font-medium break-all">
                      Invite created for {inviteResult.email}
                    </p>
                    <p className="mt-0.5 text-emerald-700 break-words">
                      {inviteResult.message}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Invite link — share it with {inviteResult.email}
                  </label>
                  <input
                    readOnly
                    value={buildInviteLink(inviteResult.token)}
                    onFocus={(e) => e.target.select()}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-muted/50 outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Works for 7 days. Send it via WhatsApp, Slack, email —
                    whatever you use.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => copyInviteLink(inviteResult.token)}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                  >
                    <Link2 className="h-4 w-4" />
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={closeInvite}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleInvite} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                {searching && (
                  <p className="text-xs text-muted-foreground mt-1">Searching…</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setInviteEmail(u.email)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <span className="flex-1 truncate">
                          <span className="font-medium">{u.name}</span>
                          <span className="text-muted-foreground"> · {u.email}</span>
                        </span>
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Org role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Team</label>
                  <select
                    value={inviteTeamId}
                    onChange={(e) => setInviteTeamId(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">No team</option>
                    {org.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {inviteTeamId && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Team role
                  </label>
                  <select
                    value={inviteTeamRole}
                    onChange={(e) => setInviteTeamRole(e.target.value)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="LEAD">Task head (Lead)</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {inviteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Send Invite
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Existing Xora users are added instantly; others get a shareable
                invite link.
              </p>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}