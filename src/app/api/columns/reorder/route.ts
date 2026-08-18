import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { columns } = await request.json();

    if (!Array.isArray(columns)) {
      return NextResponse.json(
        { error: "Columns array is required" },
        { status: 400 }
      );
    }

    for (const col of columns) {
      const { error } = await supabase
        .from("Column")
        .update({ position: col.position })
        .eq("id", col.id);
      if (error) throw error;
    }

    return NextResponse.json({ message: "Columns reordered" });
  } catch (error) {
    console.error("Reorder columns error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
