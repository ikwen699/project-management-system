import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getOrgMemberRole,
  getTeamMemberRole,
  isSuperAdmin,
} from "@/lib/org-access";
import type { TeamRole } from "@/types";

async function assertRole(
  session: any,
  organizationId: string,
  teamId: string
): Promise<boolean> {
  if (isSuperAdmin(session)) return true;
  const [orgRole, teamRole] = await Promise.all([
    getOrgMemberRole(organizationId, session.user.id),
    getTeamMemberRole(teamId, session.user.id),
  ]);
  return orgRole === "ADMIN" || teamRole === "LEAD";
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: organizationId, teamId } = await params;
  if (!(await assertRole(session, organizationId, teamId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const teamRole: TeamRole = body.teamRole === "LEAD" ? "LEAD" : "MEMBER";

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("TeamMember")
    .select("id, role")
    .eq("teamId", teamId)
    .eq("userId", userId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Member not in team" }, { status: 404 });
  }

  if (target.role === "LEAD" && teamRole !== "LEAD") {
    const { count } = await supabase
      .from("TeamMember")
      .select("id", { count: "exact", head: true })
      .eq("teamId", teamId)
      .eq("role", "LEAD");
    if ((count || 0) <= 1) {
      return NextResponse.json(
        { error: "A team must keep at least one lead" },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("TeamMember")
    .update({ role: teamRole })
    .eq("teamId", teamId)
    .eq("userId", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Team role updated" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: organizationId, teamId } = await params;
  if (!(await assertRole(session, organizationId, teamId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId || "");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("TeamMember")
    .select("id, role")
    .eq("teamId", teamId)
    .eq("userId", userId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Member not in team" }, { status: 404 });
  }

  if (target.role === "LEAD") {
    const { count } = await supabase
      .from("TeamMember")
      .select("id", { count: "exact", head: true })
      .eq("teamId", teamId)
      .eq("role", "LEAD");
    if ((count || 0) <= 1) {
      return NextResponse.json(
        { error: "A team must keep at least one lead" },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("TeamMember")
    .delete()
    .eq("teamId", teamId)
    .eq("userId", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Removed from team" });
}