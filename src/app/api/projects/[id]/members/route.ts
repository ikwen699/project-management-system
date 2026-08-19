import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { notifyMemberAdded } from "@/lib/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: members, error } = await supabase
      .from("ProjectMember")
      .select("*, User!inner(name, email, avatar)")
      .eq("projectId", id)
      .order("joinedAt", { ascending: true });

    if (error) throw error;

    const formatted = members?.map((m: any) => ({
      ...m,
      userName: m.User?.name,
      userEmail: m.User?.email,
      userAvatar: m.User?.avatar,
      User: undefined,
    })) || [];

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("List members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const isSuperAdmin = (session.user as any).role === "SUPER_ADMIN";

    const { data: membership } = await supabase
      .from("ProjectMember")
      .select("role")
      .eq("projectId", id)
      .eq("userId", session.user.id)
      .single();

    if (!isSuperAdmin && (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role, userId: directUserId } = await request.json();

    if (!email && !directUserId) {
      return NextResponse.json({ error: "Email or userId is required" }, { status: 400 });
    }

    let userId = directUserId;

    if (!userId && email) {
      const { data: existingUser } = await supabase
        .from("User")
        .select("id")
        .eq("email", email)
        .single();

      if (!existingUser) {
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error: inviteError } = await supabase
          .from("ProjectInvite")
          .insert({
            id: crypto.randomUUID(),
            projectId: id,
            email,
            invitedById: session.user.id,
            role: role || "MEMBER",
            token,
            expiresAt,
          });

        if (inviteError) throw inviteError;

        return NextResponse.json({ message: "Invite sent", token }, { status: 201 });
      }
      userId = existingUser.id;
    }

    const { data: existingMember } = await supabase
      .from("ProjectMember")
      .select("id")
      .eq("projectId", id)
      .eq("userId", userId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("ProjectMember")
      .insert({
        id: crypto.randomUUID(),
        userId,
        projectId: id,
        role: role || "MEMBER",
      });

    if (error) throw error;

    const { data: project } = await supabase
      .from("Project")
      .select("name")
      .eq("id", id)
      .single();

    if (project) {
      notifyMemberAdded(id, project.name, userId, session.user.id);
    }

    return NextResponse.json({ message: "Member added" }, { status: 201 });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const isSuperAdmin = (session.user as any).role === "SUPER_ADMIN";

    const { data: membership } = await supabase
      .from("ProjectMember")
      .select("role")
      .eq("projectId", id)
      .eq("userId", session.user.id)
      .single();

    if (!isSuperAdmin && (!membership || membership.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role } = await request.json();

    const { error } = await supabase
      .from("ProjectMember")
      .update({ role })
      .eq("projectId", id)
      .eq("userId", userId);

    if (error) throw error;

    return NextResponse.json({ message: "Role updated" });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    const isSuperAdmin = (session.user as any).role === "SUPER_ADMIN";

    const { data: membership } = await supabase
      .from("ProjectMember")
      .select("role")
      .eq("projectId", id)
      .eq("userId", session.user.id)
      .single();

    if (!isSuperAdmin && (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: targetMember } = await supabase
      .from("ProjectMember")
      .select("role")
      .eq("projectId", id)
      .eq("userId", userId)
      .single();

    if (targetMember?.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the owner" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("ProjectMember")
      .delete()
      .eq("projectId", id)
      .eq("userId", userId);

    if (error) throw error;

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
