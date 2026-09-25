import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Privacy: only surface users you share a team with, plus yourself.
    // This prevents the directory leak of every Xora account.
    const visibleIds = new Set<string>([session.user.id]);

    const { data: orgMemberships } = await supabase
      .from("OrganizationMember")
      .select("organizationId")
      .eq("userId", session.user.id);

    const myOrgIds = (orgMemberships || []).map((m: any) => m.organizationId);

    if (myOrgIds.length > 0) {
      const { data: teammates } = await supabase
        .from("OrganizationMember")
        .select("userId")
        .in("organizationId", myOrgIds);
      for (const t of teammates || []) visibleIds.add(t.userId);
    }

    const { data: myTeams } = await supabase
      .from("TeamMember")
      .select("teamId")
      .eq("userId", session.user.id);

    const myTeamIds = (myTeams || []).map((t: any) => t.teamId);
    if (myTeamIds.length > 0) {
      const { data: teamMembers } = await supabase
        .from("TeamMember")
        .select("userId")
        .in("teamId", myTeamIds);
      for (const tm of teamMembers || []) visibleIds.add(tm.userId);
    }

    if (visibleIds.size <= 1) {
      return NextResponse.json([]);
    }

    const { data: users, error } = await supabase
      .from("User")
      .select("id, name, email, avatar")
      .in("id", [...visibleIds])
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}