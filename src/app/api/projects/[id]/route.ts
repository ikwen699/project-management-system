import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
    const isAdmin = (session.user as any).role === "SUPER_ADMIN";

    let project;

    if (isAdmin) {
      // SUPER_ADMIN: fetch project directly without membership check
      const { data: proj, error } = await supabase
        .from("Project")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !proj) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const { data: members } = await supabase
        .from("ProjectMember")
        .select("id, userId, projectId, role, joinedAt, User(name, email, avatar)")
        .eq("projectId", id)
        .order("joinedAt");

      const { data: columns } = await supabase
        .from("Column")
        .select("id, name, position, projectId, createdAt")
        .eq("projectId", id)
        .order("position");

      const { count: taskCount } = await supabase
        .from("Task")
        .select("id", { count: "exact", head: true })
        .eq("projectId", id);

      const formattedMembers = (members || []).map((m: any) => ({
        id: m.id,
        userId: m.userId,
        projectId: m.projectId,
        role: m.role,
        joinedAt: m.joinedAt,
        userName: m.User?.name || "Unknown",
        userEmail: m.User?.email || "Unknown",
        userAvatar: m.User?.avatar || null,
      }));

      project = {
        ...proj,
        taskCount: taskCount || 0,
        memberCount: formattedMembers.length,
        members: formattedMembers,
        columns: columns || [],
      };
    } else {
      // Regular user: use RPC with membership check
      const { data: projectRaw, error } = await supabase.rpc("get_project_detail", {
        p_project_id: id,
        p_user_id: session.user.id,
      });

      if (error) throw error;
      if (!projectRaw) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      project = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw;
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Get project error:", error);
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
    const isAdmin = (session.user as any).role === "SUPER_ADMIN";

    if (!isAdmin) {
      const { data: membership } = await supabase
        .from("ProjectMember")
        .select("role")
        .eq("projectId", id)
        .eq("userId", session.user.id)
        .single();

      if (!membership || membership.role === "MEMBER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { name, description, status, startDate, endDate } =
      await request.json();

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    const { error } = await supabase
      .from("Project")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Project updated" });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = (session.user as any).role === "SUPER_ADMIN";

    const { data: project } = await supabase
      .from("Project")
      .select("ownerId")
      .eq("id", id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!isAdmin && project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("Project").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
