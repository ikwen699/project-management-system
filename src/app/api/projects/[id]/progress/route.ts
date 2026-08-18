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

    const { data: stats, error } = await supabase.rpc("get_project_progress", {
      p_project_id: id,
    });

    if (error) throw error;

    const row = Array.isArray(stats) ? stats[0] : stats;

    const totalTasks = parseInt(row?.totalTasks ?? row?.total_tasks ?? "0") || 0;
    const completedTasks = parseInt(row?.completedTasks ?? row?.completed_tasks ?? "0") || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      totalTasks,
      completedTasks,
      assignedTasks: parseInt(row?.assignedTasks ?? row?.assigned_tasks ?? "0") || 0,
      overdueTasks: parseInt(row?.overdueTasks ?? row?.overdue_tasks ?? "0") || 0,
      dueSoonTasks: parseInt(row?.dueSoonTasks ?? row?.due_soon_tasks ?? "0") || 0,
      progress,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
