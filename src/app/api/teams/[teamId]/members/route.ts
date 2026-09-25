import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { TeamMemberWithUser } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (await params).teamId;

  const { data: team } = await supabase
    .from("Team")
    .select("id, organizationId")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Caller must be a member of the team's organisation.
  const { data: myMembership } = await supabase
    .from("OrganizationMember")
    .select("id")
    .eq("organizationId", team.organizationId)
    .eq("userId", session.user.id)
    .maybeSingle();

  if (!myMembership && (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: members, error } = await supabase
    .from("TeamMember")
    .select("id, role, joinedAt, userId, User(id, name, email, avatar)")
    .eq("teamId", teamId)
    .order("joinedAt", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  const result: TeamMemberWithUser[] = (members || []).map((tm: any) => {
    const user = tm.User || {};
    return {
      id: tm.id,
      teamId: tm.teamId,
      userId: tm.userId,
      role: tm.role,
      joinedAt: tm.joinedAt,
      userName: user.name || "",
      userEmail: user.email || "",
      userAvatar: user.avatar || null,
    };
  });

  return NextResponse.json({ members: result });
}