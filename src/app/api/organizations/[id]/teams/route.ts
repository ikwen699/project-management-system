import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getOrgMemberRole, isOrgAdmin, isSuperAdmin } from "@/lib/org-access";
import { normalizeType } from "@/lib/orgs";
import type { TeamListing } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  const myRole = await getOrgMemberRole(organizationId, session.user.id);
  if (!isSuperAdmin(session) && !myRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: teams } = await supabase
    .from("Team")
    .select("*")
    .eq("organizationId", organizationId)
    .order("createdAt", { ascending: true });

  return NextResponse.json({ teams: await withCounts(teams || []) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (await params).id;
  if (!isSuperAdmin(session) && !(await isOrgAdmin(organizationId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }
  const type = normalizeType(String(body.type || name));

  const teamId = crypto.randomUUID();
  const { error } = await supabase.from("Team").insert({
    id: teamId,
    organizationId,
    name,
    type,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("TeamMember").insert({
    id: crypto.randomUUID(),
    teamId,
    userId: session.user.id,
    role: "LEAD",
  });

  return NextResponse.json(
    { message: "Team created", id: teamId },
    { status: 201 }
  );
}

async function withCounts(teams: any[]): Promise<TeamListing[]> {
  return Promise.all(
    teams.map(async (team) => {
      const res = await supabase
        .from("TeamMember")
        .select("id", { count: "exact", head: true })
        .eq("teamId", team.id);
      const { id, organizationId, name, type, description, createdAt } = team;
      return {
        id,
        organizationId,
        name,
        type,
        description,
        createdAt,
        memberCount: res.count || 0,
      };
    })
  );
}