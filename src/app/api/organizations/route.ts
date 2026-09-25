import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { normalizeType } from "@/lib/orgs";
import type { OrgListing, OrgRole } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("OrganizationMember")
    .select("role, Organization(*)")
    .eq("userId", session.user.id)
    .order("joinedAt", { ascending: false });

  if (error) {
    console.error("List organizations error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  const myRoles = new Map<string, OrgRole>();
  const uniqueOrgs = new Map<string, any>();
  for (const row of rows || []) {
    const org = Array.isArray(row.Organization)
      ? row.Organization[0]
      : row.Organization;
    if (!org) continue;
    if (!myRoles.has(org.id)) myRoles.set(org.id, row.role as OrgRole);
    uniqueOrgs.set(org.id, org);
  }

  const organizations: OrgListing[] = await Promise.all(
    [...uniqueOrgs.values()].map(async (org: any) => {
      const [memberCount, teamCount] = await Promise.all([
        supabase
          .from("OrganizationMember")
          .select("id", { count: "exact", head: true })
          .eq("organizationId", org.id),
        supabase
          .from("Team")
          .select("id", { count: "exact", head: true })
          .eq("organizationId", org.id),
      ]);
      return {
        id: org.id,
        name: org.name,
        type: org.type,
        description: org.description,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        myRole: myRoles.get(org.id) || null,
        memberCount: memberCount.count || 0,
        teamCount: teamCount.count || 0,
      };
    })
  );

  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const type = normalizeType(String(body.type || ""));
  const description = body.description ? String(body.description).trim() : null;
  const teams: { name?: string; type?: string }[] = Array.isArray(body.teams)
    ? body.teams
    : [];

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const uniqueTeamNames = new Set<string>();
  const cleanTeams: { name: string; type: string }[] = [];
  for (const t of teams) {
    const teamName = String(t.name || "").trim();
    if (!teamName) continue;
    const key = teamName.toLowerCase();
    if (uniqueTeamNames.has(key)) continue;
    uniqueTeamNames.add(key);
    cleanTeams.push({
      name: teamName,
      type: normalizeType(String(t.type || teamName)),
    });
  }

  const orgId = crypto.randomUUID();
  const { error: orgError } = await supabase.from("Organization").insert({
    id: orgId,
    name,
    type,
    description,
    ownerId: session.user.id,
  });

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 400 });
  }

  const { error: memberError } = await supabase
    .from("OrganizationMember")
    .insert({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: session.user.id,
      role: "ADMIN",
    });

  if (memberError) {
    console.error("Create org owner member error:", memberError.message);
    return NextResponse.json(
      { error: "Organisation created but owner membership failed" },
      { status: 500 }
    );
  }

  for (const team of cleanTeams) {
    const teamId = crypto.randomUUID();
    await supabase.from("Team").insert({
      id: teamId,
      organizationId: orgId,
      name: team.name,
      type: team.type,
    });
    await supabase.from("TeamMember").insert({
      id: crypto.randomUUID(),
      teamId,
      userId: session.user.id,
      role: "LEAD",
    });
  }

  return NextResponse.json(
    { message: "Organisation created", id: orgId },
    { status: 201 }
  );
}