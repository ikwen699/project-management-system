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

    const { data: columns, error } = await supabase.rpc("get_columns_with_tasks", {
      p_project_id: id,
    });

    if (error) throw error;

    return NextResponse.json(columns);
  } catch (error) {
    console.error("List columns error:", error);
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
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Column name is required" },
        { status: 400 }
      );
    }

    const { data: maxPosResult } = await supabase
      .from("Column")
      .select("position")
      .eq("projectId", id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = maxPosResult && maxPosResult.length > 0 ? maxPosResult[0].position + 1 : 0;

    const { data: column, error } = await supabase
      .from("Column")
      .insert({ id: crypto.randomUUID(), name, position: nextPos, projectId: id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Create column error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
