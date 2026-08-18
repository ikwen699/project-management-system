import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    await requireSuperAdmin();

    const { data: projects, error } = await supabase
      .from("Project")
      .select(`
        *,
        ProjectMember!inner(
          id, userId, role, joinedAt,
          User!inner(name, email, avatar)
        )
      `)
      .eq("isArchived", false)
      .order("updatedAt", { ascending: false });

    if (error) throw error;

    const formatted = (projects || []).map((p: any) => {
      const owner = p.ProjectMember?.find((m: any) => m.role === "OWNER");
      const memberCount = p.ProjectMember?.length || 0;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        ownerName: owner?.User?.name || "Unknown",
        ownerEmail: owner?.User?.email || "Unknown",
        memberCount,
      };
    });

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
