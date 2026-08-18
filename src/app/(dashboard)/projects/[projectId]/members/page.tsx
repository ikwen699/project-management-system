"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Member {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
}

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);

  function loadMembers() {
    fetch(`/api/projects/${projectId}/members`)
      .then((r) => r.json())
      .then((data) => { setMembers(data); setLoading(false); });
  }

  useEffect(() => { loadMembers(); }, [projectId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Member added!");
      setEmail("");
      loadMembers();
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
      loadMembers();
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
        <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Team Members</h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {member.userName.charAt(0)}
                  </span>
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
