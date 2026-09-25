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
    const isAdmin = (session.user as any).role === "SUPER_ADMIN";

    if (!isAdmin) {
      const { data: projectRaw } = await supabase.rpc("get_project_detail", {
        p_project_id: id,
        p_user_id: session.user.id,
      });
      if (!projectRaw) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: project } = await supabase
      .from("Project")
      .select("organizationId")
      .eq("id", id)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.organizationId) {
      return NextResponse.json({ teams: [] });
    }

    const { data: teams, error } = await supabase
      .from("Team")
      .select("id, name, type")
      .eq("organizationId", project.organizationId)
      .order("createdAt", { ascending: true });

    if (error) throw error;

    const links = await Promise.all(
      (teams || []).map(async (team: any) => {
        const res = await supabase
          .from("TeamMember")
          .select("id", { count: "exact", head: true })
          .eq("teamId", team.id);
        return { ...team, memberCount: res.count || 0 };
      })
    );

    return NextResponse.json({ teams: links });
  } catch (error) {
    console.error("List project teams error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}