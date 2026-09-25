import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getEntitlement } from "@/lib/billing";
import { logProjectCreated } from "@/lib/activity";
import { getOrgMemberRole } from "@/lib/org-access";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: projects, error } = await supabase.rpc("get_projects", {
      p_user_id: session.user.id,
    });

    if (error) throw error;

    return NextResponse.json(projects);
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, status, startDate, endDate, organizationId } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    let orgId: string | null = null;
    if (organizationId) {
      const orgRole = await getOrgMemberRole(organizationId, session.user.id);
      if (!orgRole) {
        return NextResponse.json(
          { error: "You must be a member of the selected organisation" },
          { status: 403 }
        );
      }
      orgId = organizationId;
    }

    const entitlement = await getEntitlement(session.user.id);
    if (!entitlement.isFullAccess) {
      const { count } = await supabase
        .from("Project")
        .select("id", { count: "exact", head: true })
        .eq("ownerId", session.user.id)
        .not("isArchived", "eq", true);

      if (count !== null && count >= entitlement.projectLimit) {
        return NextResponse.json(
          {
            error:
              "Free plan is limited to " +
              entitlement.projectLimit +
              " projects. Upgrade to Business for unlimited projects.",
            code: "PLAN_LIMIT",
          },
          { status: 403 }
        );
      }
    }

    const projectId = crypto.randomUUID();

    const { error: projectError } = await supabase
      .from("Project")
      .insert({
        id: projectId,
        name,
        description: description || null,
        status: status || "PLANNING",
        startDate: startDate || null,
        endDate: endDate || null,
        ownerId: session.user.id,
        organizationId: orgId,
      });

    if (projectError) throw projectError;

    const { error: memberError } = await supabase
      .from("ProjectMember")
      .insert({
        id: crypto.randomUUID(),
        userId: session.user.id,
        projectId: projectId,
        role: "OWNER",
      });

    if (memberError) throw memberError;

    const defaultColumns = ["To Do", "In Progress", "Review", "Done"];
    const columns = defaultColumns.map((colName, i) => ({
      id: crypto.randomUUID(),
      name: colName,
      position: i,
      projectId: projectId,
    }));

    const { error: columnsError } = await supabase
      .from("Column")
      .insert(columns);

    if (columnsError) throw columnsError;

    logProjectCreated(session.user.id, projectId, name);

    return NextResponse.json(
      { id: projectId, message: "Project created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
