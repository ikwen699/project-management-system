import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getOrgMemberRole, isOrgAdmin, isSuperAdmin } from "@/lib/org-access";
import { normalizeType } from "@/lib/orgs";
import type { OrganizationWithDetails } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  const myRole = await getOrgMemberRole(organizationId, session.user.id);
  const { data: org } = await supabase
    .from("Organization")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }
  if (!isSuperAdmin(session) && !myRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [membersRes, teamsRes, invitesRes, projectsRes] = await Promise.all([
    supabase
      .from("OrganizationMember")
      .select("id, role, joinedAt, userId, User(id, name, email, avatar)")
      .eq("organizationId", organizationId)
      .order("joinedAt", { ascending: true }),
    supabase
      .from("Team")
      .select("*")
      .eq("organizationId", organizationId)
      .order("createdAt", { ascending: true }),
    supabase
      .from("Invite")
      .select("*")
      .eq("organizationId", organizationId)
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false }),
    supabase
      .from("Project")
      .select("id, name, status, endDate, isArchived")
      .eq("organizationId", organizationId)
      .order("createdAt", { ascending: false }),
  ]);

  const members = (membersRes.data || []).map((m: any) => {
    const user = Array.isArray(m.User) ? m.User[0] : m.User;
    return {
      id: m.id,
      organizationId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      userName: user?.name || "",
      userEmail: user?.email || "",
      userAvatar: user?.avatar || null,
    };
  });

  const teams = await Promise.all(
    (teamsRes.data || []).map(async (team: any) => {
      const teamMembers = await supabase
        .from("TeamMember")
        .select("id, role, joinedAt, userId, User(id, name, email, avatar)")
        .eq("teamId", team.id)
        .order("joinedAt", { ascending: true });
      return {
        ...team,
        members: (teamMembers.data || []).map((tm: any) => {
          const user = Array.isArray(tm.User) ? tm.User[0] : tm.User;
          return {
            id: tm.id,
            teamId: tm.teamId,
            userId: tm.userId,
            role: tm.role,
            joinedAt: tm.joinedAt,
            userName: user?.name || "",
            userEmail: user?.email || "",
            userAvatar: user?.avatar || null,
          };
        }),
        memberCount: (teamMembers.data || []).length,
      };
    })
  );

  const detail: OrganizationWithDetails = {
    ...org,
    myRole,
    memberCount: members.length,
    teams,
    members,
    pendingInvites: invitesRes.data || [],
    projects: projectsRes.data || [],
  };

  return NextResponse.json({ organization: detail });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  if (!isSuperAdmin(session) && !(await isOrgAdmin(organizationId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = body.name ? String(body.name).trim() : undefined;
  const type = body.type ? normalizeType(String(body.type)) : undefined;
  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;

  const { error } = await supabase
    .from("Organization")
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(description !== undefined ? { description } : {}),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Organisation updated" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  if (!isSuperAdmin(session) && !(await isOrgAdmin(organizationId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("Organization")
    .delete()
    .eq("id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Organisation deleted" });
}