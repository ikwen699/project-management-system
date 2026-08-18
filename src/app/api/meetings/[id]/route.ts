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
    const { title, description, date, duration } = await request.json();

    const { error } = await supabase
      .from("Meeting")
      .update({
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        date: date || undefined,
        duration: duration || undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Meeting updated" });
  } catch (error) {
    console.error("Update meeting error:", error);
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
    const { error } = await supabase.from("Meeting").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Meeting deleted" });
  } catch (error) {
    console.error("Delete meeting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
