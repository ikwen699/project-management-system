import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
    const { title, description, date } = await request.json();

    const { error } = await supabase
      .from("Milestone")
      .update({
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        date: date || undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Milestone updated" });
  } catch (error) {
    console.error("Update milestone error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const { error } = await supabase.from("Milestone").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Milestone deleted" });
  } catch (error) {
    console.error("Delete milestone error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
