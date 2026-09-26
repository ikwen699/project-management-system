import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("email") || searchParams.get("q") || "")
    .trim()
    .toLowerCase()
    .replace(/[%_,()"]/g, "");
  const teamId = searchParams.get("teamId");
  const organizationId = searchParams.get("organizationId");

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // If scoped to an org/team, only ever return users already in that group,
  // plus exact matches that may be invited from the directory of Xora users.
  let orgMembersUserIds: string[] | null = null;
  if (teamId) {
    const { data: team } = await supabase
      .from("Team")
      .select("organizationId")
      .eq("id", teamId)
      .maybeSingle();
    if (team) {
      const res = await supabase
        .from("OrganizationMember")
        .select("userId")
        .eq("organizationId", team.organizationId);
      orgMembersUserIds = (res.data || []).map((r: any) => r.userId);
    }
  } else if (organizationId) {
    const res = await supabase
      .from("OrganizationMember")
      .select("userId")
      .eq("organizationId", organizationId);
    orgMembersUserIds = (res.data || []).map((r: any) => r.userId);
  }

  const { data: users, error } = await supabase
    .from("User")
    .select("id, name, email, avatar")
    .or(`name.ilike."%${q}%",email.ilike."%${q}%"`)
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  // Invite flow (org scope): suggest Xora users who are NOT in the org yet.
  if (organizationId && !teamId) {
    const candidates = (users || [])
      .filter((u: any) => !orgMembersUserIds!.includes(u.id))
      .slice(0, 10);
    return NextResponse.json({ users: candidates });
  }

  // Team scope: only existing org members (assignee pickers); exact matches
  // are always safe to suggest (own teammates / Xora users).
  if (orgMembersUserIds) {
    const exact = (users || []).filter((u: any) => u.email === q);
    const allowed = (users || []).filter((u: any) =>
      orgMembersUserIds!.includes(u.id)
    );
    const merged = [...exact, ...allowed.filter((u: any) => u.email !== q)];
    return NextResponse.json({ users: merged.slice(0, 10) });
  }

  return NextResponse.json({ users: (users || []).slice(0, 10) });
}
