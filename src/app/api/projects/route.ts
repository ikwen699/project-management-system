import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logProjectCreated } from "@/lib/activity";

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

    const { name, description, status, startDate, endDate } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
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
