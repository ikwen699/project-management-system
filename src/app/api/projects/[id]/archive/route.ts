import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: project } = await supabase
      .from("Project")
      .select("ownerId")
      .eq("id", id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isSuperAdmin = (session.user as any).role === "SUPER_ADMIN";

    if (!isSuperAdmin && project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: current } = await supabase
      .from("Project")
      .select("isArchived")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("Project")
      .update({ isArchived: !current?.isArchived, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Project archive toggled" });
  } catch (error) {
    console.error("Archive project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
