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

    const { data: milestones, error } = await supabase
      .from("Milestone")
      .select("*, User!inner(name)")
      .eq("projectId", id)
      .order("date", { ascending: true });

    if (error) throw error;

    const formatted = milestones?.map((m: any) => ({
      ...m,
      createdByName: m.User?.name,
      User: undefined,
    })) || [];

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("List milestones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const { title, description, date } = await request.json();
    if (!title || !date) {
      return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
    }

    const { data: milestone, error } = await supabase
      .from("Milestone")
      .insert({
        id: crypto.randomUUID(),
        title,
        description: description || null,
        date,
        projectId: id,
        createdById: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Create milestone error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
