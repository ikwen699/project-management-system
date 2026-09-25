import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getOrgMemberRole,
  getTeamMemberRole,
  isOrgAdmin,
  isSuperAdmin,
} from "@/lib/org-access";
import { normalizeType } from "@/lib/orgs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: organizationId, teamId } = await params;

  const [orgRole, teamRole] = await Promise.all([
    getOrgMemberRole(organizationId, session.user.id),
    getTeamMemberRole(teamId, session.user.id),
  ]);
  const allowed = isSuperAdmin(session) || orgRole === "ADMIN" || teamRole === "LEAD";
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = body.name ? String(body.name).trim() : undefined;
  const type = body.type ? normalizeType(String(body.type)) : undefined;
  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;

  const { error } = await supabase
    .from("Team")
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(description !== undefined ? { description } : {}),
    })
    .eq("id", teamId)
    .eq("organizationId", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Team updated" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: organizationId, teamId } = await params;
  if (
    !isSuperAdmin(session) &&
    !(await isOrgAdmin(organizationId, session.user.id))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase
    .from("Team")
    .delete()
    .eq("id", teamId)
    .eq("organizationId", organizationId);

  return NextResponse.json({ message: "Team deleted" });
}