import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function updateTaskTimeSpent(taskId: string) {
  const { data: entries } = await supabase
    .from("TimeEntry")
    .select("duration")
    .eq("taskId", taskId)
    .not("duration", "is", null);

  const totalMinutes = (entries || []).reduce((sum, e) => sum + (e.duration || 0), 0);
  await supabase
    .from("Task")
    .update({ timeSpent: totalMinutes, updatedAt: new Date().toISOString() })
    .eq("id", taskId);
}

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

    const { data: entries, error } = await supabase
      .from("TimeEntry")
      .select("*, User(name)")
      .eq("taskId", id)
      .order("startTime", { ascending: false });

    if (error) throw error;

    const formatted = entries?.map((e: any) => ({
      id: e.id,
      taskId: e.taskId,
      userId: e.userId,
      description: e.description,
      startTime: e.startTime,
      endTime: e.endTime,
      duration: e.duration,
      userName: e.User?.name || "Unknown",
      createdAt: e.createdAt,
    })) || [];

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Get time entries error:", error);
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
    const body = await request.json();

    // Manual entry: client sends startTime and endTime
    if (body.startTime && body.endTime) {
      const startTime = new Date(body.startTime);
      const endTime = new Date(body.endTime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      if (durationMinutes < 0) {
        return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
      }

      const entryId = crypto.randomUUID();
      const { data: entry, error } = await supabase
        .from("TimeEntry")
        .insert({
          id: entryId,
          taskId: id,
          userId: session.user.id,
          description: body.description || null,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: durationMinutes,
        })
        .select()
        .single();

      if (error) throw error;

      await updateTaskTimeSpent(id);

      return NextResponse.json({
        id: entry.id,
        taskId: entry.taskId,
        userId: entry.userId,
        description: entry.description,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        createdAt: entry.createdAt,
      });
    }

    // Start a timer: creates entry with endTime = null
    const entryId = crypto.randomUUID();
    const { data: entry, error } = await supabase
      .from("TimeEntry")
      .insert({
        id: entryId,
        taskId: id,
        userId: session.user.id,
        description: body.description || null,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: entry.id,
      taskId: entry.taskId,
      userId: entry.userId,
      description: entry.description,
      startTime: entry.startTime,
      endTime: null,
      duration: null,
      createdAt: entry.createdAt,
    });
  } catch (error) {
    console.error("Create time entry error:", error);
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

    // Stop a running timer
    if (body.entryId) {
      const { data: entry, error: fetchError } = await supabase
        .from("TimeEntry")
        .select("*")
        .eq("id", body.entryId)
        .eq("taskId", id)
        .single();

      if (fetchError || !entry) {
        return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
      }

      if (entry.endTime) {
        return NextResponse.json({ error: "Timer already stopped" }, { status: 400 });
      }

      const endTime = new Date();
      const startTime = new Date(entry.startTime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const { error: updateError } = await supabase
        .from("TimeEntry")
        .update({
          endTime: endTime.toISOString(),
          duration: durationMinutes,
        })
        .eq("id", body.entryId);

      if (updateError) throw updateError;

      await updateTaskTimeSpent(id);

      return NextResponse.json({
        ...entry,
        endTime: endTime.toISOString(),
        duration: durationMinutes,
      });
    }

    return NextResponse.json({ error: "entryId is required" }, { status: 400 });
  } catch (error) {
    console.error("Stop timer error:", error);
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
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("TimeEntry")
      .delete()
      .eq("id", entryId)
      .eq("taskId", id);

    if (error) throw error;

    await updateTaskTimeSpent(id);

    return NextResponse.json({ message: "Entry deleted" });
  } catch (error) {
    console.error("Delete time entry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
