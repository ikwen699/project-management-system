import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { notifyTaskAssigned } from "@/lib/notifications";
import { logTaskCreated } from "@/lib/activity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const columnId = searchParams.get("columnId");

    const { data: tasks, error } = await supabase.rpc("get_project_tasks", {
      p_project_id: id,
      p_priority: priority || null,
      p_assignee_id: assigneeId || null,
      p_column_id: columnId || null,
    });

    if (error) throw error;

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("List tasks error:", error);
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
    const { title, description, priority, deadline, columnId, assigneeId } =
      await request.json();

    if (!title || !columnId) {
      return NextResponse.json(
        { error: "Title and column are required" },
        { status: 400 }
      );
    }

    const { data: maxPosResult } = await supabase
      .from("Task")
      .select("position")
      .eq("columnId", columnId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = maxPosResult && maxPosResult.length > 0 ? maxPosResult[0].position + 1 : 0;

    const { data: task, error } = await supabase
      .from("Task")
      .insert({
        id: crypto.randomUUID(),
        title,
        description: description || null,
        priority: priority || "MEDIUM",
        deadline: deadline || null,
        position: nextPos,
        columnId,
        projectId: id,
        assigneeId: assigneeId || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (assigneeId) {
      notifyTaskAssigned(assigneeId, session.user.id, title, id);
    }

    logTaskCreated(session.user.id, task.id, id);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
