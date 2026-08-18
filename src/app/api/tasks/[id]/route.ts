import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { notifyTaskStatusChanged } from "@/lib/notifications";

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

    const { data: taskRaw, error } = await supabase.rpc("get_task_detail", {
      p_task_id: id,
    });

    if (error) throw error;

    if (!taskRaw) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = Array.isArray(taskRaw) ? taskRaw[0] : taskRaw;
    return NextResponse.json(task);
  } catch (error) {
    console.error("Get task error:", error);
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
    const body = await request.json();

    const { data: task } = await supabase
      .from("Task")
      .select("columnId, projectId")
      .eq("id", id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { data: doneCol } = await supabase
      .from("Column")
      .select("id")
      .eq("projectId", task.projectId)
      .eq("name", "Done")
      .single();

    if (body.columnId && body.columnId !== task.columnId) {
      const { data: maxPosResult } = await supabase
        .from("Task")
        .select("position")
        .eq("columnId", body.columnId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPos = maxPosResult && maxPosResult.length > 0 ? maxPosResult[0].position + 1 : 0;

      let completedAt = undefined;
      if (doneCol && body.columnId === doneCol.id) {
        completedAt = new Date().toISOString();
      } else if (doneCol && task.columnId === doneCol.id) {
        completedAt = null;
      }

      const moveUpdates: Record<string, any> = { columnId: body.columnId, position: nextPos };
      if (completedAt !== undefined) moveUpdates.completedAt = completedAt;

      await supabase
        .from("Task")
        .update(moveUpdates)
        .eq("id", id);

      const { data: destCol } = await supabase
        .from("Column")
        .select("name")
        .eq("id", body.columnId)
        .single();

      const { data: taskData } = await supabase
        .from("Task")
        .select("title, assigneeId")
        .eq("id", id)
        .single();

      if (destCol && taskData) {
        notifyTaskStatusChanged(task.projectId, taskData.title, destCol.name, taskData.assigneeId, session.user.id);
      }
    }

    if (body.title !== undefined || body.description !== undefined || body.priority !== undefined || body.deadline !== undefined || body.assigneeId !== undefined || body.estimatedHours !== undefined) {
      const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.deadline !== undefined) updates.deadline = body.deadline;
      if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId;
      if (body.estimatedHours !== undefined) updates.estimatedHours = body.estimatedHours;

      await supabase
        .from("Task")
        .update(updates)
        .eq("id", id);
    }

    const { data: updatedRaw, error } = await supabase.rpc("get_task_detail", {
      p_task_id: id,
    });

    if (error) throw error;

    const updated = Array.isArray(updatedRaw) ? updatedRaw[0] : updatedRaw;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update task error:", error);
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

    const { error } = await supabase.from("Task").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
