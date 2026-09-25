import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  addUserToOrgAndTeam,
  getOrgMemberRole,
  isOrgAdmin,
  isSuperAdmin,
} from "@/lib/org-access";
import { sendInviteEmail } from "@/lib/email";
import { notifyOrgInviteSent } from "@/lib/notifications";
import type { OrgRole, TeamRole } from "@/types";

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
  if (!isSuperAdmin(session) && !myRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: members, error } = await supabase
    .from("OrganizationMember")
    .select("id, role, joinedAt, userId, User(id, name, email, avatar)")
    .eq("organizationId", organizationId)
    .order("joinedAt", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  const result = (members || []).map((m: any) => {
    const user = m.User || {};
    return {
      id: m.id,
      organizationId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      userName: user.name || "",
      userEmail: user.email || "",
      userAvatar: user.avatar || null,
    };
  });

  return NextResponse.json({ members: result });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  if (
    !isSuperAdmin(session) &&
    !(await isOrgAdmin(organizationId, session.user.id))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const teamId = body.teamId ? String(body.teamId) : null;
  const orgRole: OrgRole = body.role === "ADMIN" ? "ADMIN" : "MEMBER";
  const teamRole: TeamRole = body.teamRole === "LEAD" ? "LEAD" : "MEMBER";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  if (teamId) {
    const { data: team } = await supabase
      .from("Team")
      .select("id")
      .eq("id", teamId)
      .eq("organizationId", organizationId)
      .maybeSingle();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 400 });
    }
  }

  const { data: existingUser } = await supabase
    .from("User")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    await addUserToOrgAndTeam({
      organizationId,
      teamId,
      userId: existingUser.id,
      role: orgRole,
      teamRole,
    });
    const { data: org } = await supabase
      .from("Organization")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();
    await notifyOrgInviteSent(
      existingUser.id,
      org?.name || "your organisation",
      session.user.id
    );
    return NextResponse.json(
      { message: `${email} is already a user and was added as a member.` },
      { status: 201 }
    );
  }

  const { data: org } = await supabase
    .from("Organization")
    .select("name, type")
    .eq("id", organizationId)
    .maybeSingle();
  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: inviteError } = await supabase.from("Invite").insert({
    id: crypto.randomUUID(),
    organizationId,
    teamId,
    email,
    role: orgRole,
    teamRole,
    invitedById: session.user.id,
    token,
    expiresAt,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const ok = await sendInviteEmail({
    to: email,
    token,
    organizationName: org.name,
    inviterName: session.user.name || "A teammate",
  });
  if (!ok) {
    console.error("Failed to send invite email for", email);
  }

  return NextResponse.json(
    {
      message: ok
        ? `We emailed an invite to ${email}.`
        : `Invite created for ${email}, but the email could not be sent.`,
    },
    { status: 201 }
  );
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
  if (
    !isSuperAdmin(session) &&
    !(await isOrgAdmin(organizationId, session.user.id))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const role: OrgRole = body.role === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("OrganizationMember")
    .select("id, role")
    .eq("organizationId", organizationId)
    .eq("userId", userId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const { count } = await supabase
      .from("OrganizationMember")
      .select("id", { count: "exact", head: true })
      .eq("organizationId", organizationId)
      .eq("role", "ADMIN");
    if ((count || 0) <= 1) {
      return NextResponse.json(
        { error: "An organisation must keep at least one admin" },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("OrganizationMember")
    .update({ role })
    .eq("organizationId", organizationId)
    .eq("userId", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Role updated" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  if (
    !isSuperAdmin(session) &&
    !(await isOrgAdmin(organizationId, session.user.id))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId || "");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data: org } = await supabase
    .from("Organization")
    .select("ownerId")
    .eq("id", organizationId)
    .maybeSingle();

  if (org?.ownerId === userId) {
    return NextResponse.json(
      { error: "The organisation owner cannot be removed" },
      { status: 400 }
    );
  }

  await supabase
    .from("TeamMember")
    .delete()
    .eq("userId", userId)
    .in(
      "teamId",
      (
        await supabase.from("Team").select("id").eq("organizationId", organizationId)
      ).data?.map((t: any) => t.id) || []
    );

  const { error } = await supabase
    .from("OrganizationMember")
    .delete()
    .eq("organizationId", organizationId)
    .eq("userId", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: "Member removed" });
}