import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    await requireSuperAdmin();

    const { data: projects, error } = await supabase
      .from("Project")
      .select("id, name, description, status, startDate, endDate, createdAt, updatedAt")
      .eq("isArchived", false)
      .order("updatedAt", { ascending: false });

    if (error) throw error;

    const projectIds = (projects || []).map((p: any) => p.id);

    let memberMap: Record<string, { ownerName: string; ownerEmail: string; memberCount: number }> = {};

    if (projectIds.length > 0) {
      const { data: members } = await supabase
        .from("ProjectMember")
        .select("projectId, role, User(name, email)")
        .in("projectId", projectIds);

      for (const m of members || []) {
        const pm = m as any;
        if (!memberMap[pm.projectId]) {
          memberMap[pm.projectId] = { ownerName: "Unknown", ownerEmail: "Unknown", memberCount: 0 };
        }
        memberMap[pm.projectId].memberCount++;
        if (pm.role === "OWNER" && pm.User) {
          memberMap[pm.projectId].ownerName = pm.User.name || "Unknown";
          memberMap[pm.projectId].ownerEmail = pm.User.email || "Unknown";
        }
      }
    }

    const formatted = (projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      ownerName: memberMap[p.id]?.ownerName || "Unknown",
      ownerEmail: memberMap[p.id]?.ownerEmail || "Unknown",
      memberCount: memberMap[p.id]?.memberCount || 0,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin get projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
