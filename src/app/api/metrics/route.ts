import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: statsRaw, error } = await supabase.rpc("get_metrics", {
      p_user_id: session.user.id,
    });

    if (error) throw error;

    const stats = Array.isArray(statsRaw) ? statsRaw[0] : statsRaw;

    const total = stats.totalTasks || 0;
    const completed = stats.completedTasks || 0;
    const assigned = stats.assignedTasks || 0;

    const metrics = {
      totalProjects: stats.totalProjects || 0,
      projectsWithTasks: stats.projectsWithTasks || 0,
      projectsWithTasksPercent: stats.totalProjects
        ? Math.round(((stats.projectsWithTasks || 0) / stats.totalProjects) * 100)
        : 0,
      taskAssignmentRate: total
        ? Math.round((assigned / total) * 100)
        : 0,
      taskCompletionRate: total
        ? Math.round((completed / total) * 100)
        : 0,
      onTimeCompletion: completed
        ? Math.round(((stats.onTimeTasks || 0) / completed) * 100)
        : 0,
      projectsOnSchedule: stats.totalCompletedProjects
        ? Math.round(((stats.completedOnTimeProjects || 0) / stats.totalCompletedProjects) * 100)
        : 0,
      avgCompletionTime: parseFloat(stats.avgCompletionDays || "0"),
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: stats.overdueTasks || 0,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
