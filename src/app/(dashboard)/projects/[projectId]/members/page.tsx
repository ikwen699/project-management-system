"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserSelect } from "@/components/ui/UserSelect";

interface Member {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: string;
}

interface AllUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);

  const loadData = useCallback(async () => {
    const [mems, users] = await Promise.all([
      fetch(`/api/projects/${projectId}/members`).then((r) => r.json()),
      fetch(`/api/users`).then((r) => r.json()),
    ]);
    setMembers(mems);
    setAllUsers(users);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const memberUserIds = new Set(members.map((m) => m.userId));
  const availableUsers = allUsers
    .filter((u) => !memberUserIds.has(u.id))
    .map((u) => ({ userId: u.id, userName: u.name, userEmail: u.email, userAvatar: u.avatar }));

  async function handleAddMember() {
    if (!selectedUserId) {
      toast.error("Select a user to add");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Member added!");
      setSelectedUserId("");
      loadData();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) { toast.error("Failed to remove member"); return; }
      toast.success("Member removed");
      loadData();
    } catch {
      toast.error("Failed to remove member");
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
        <h1 className="text-2xl font-bold">Members</h1>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Add Member</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <UserSelect
              users={availableUsers}
              value={selectedUserId}
              onChange={setSelectedUserId}
              placeholder="Search for a user..."
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={handleAddMember}
            disabled={inviting || !selectedUserId}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Team Members</h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  {member.userAvatar ? (
                    <img src={member.userAvatar} alt="" className="h-9 w-9 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-primary-foreground">
                      {member.userName?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.userName}</p>
                  <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded-full">{member.role}</span>
                {member.role !== "OWNER" && (
                  <button onClick={() => removeMember(member.userId)} className="p-1 hover:bg-muted rounded" aria-label="Remove member">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
