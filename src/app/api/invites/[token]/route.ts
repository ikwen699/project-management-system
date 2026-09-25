import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const { data, error } = await supabase
      .from("Invite")
      .select(
        `id, email, role, "teamRole", "expiresAt", status, "organizationId", "teamId",
        Organization:Organization(name),
        Team:Team(name),
        InvitedBy:User(name)`
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    const org = Array.isArray(data.Organization)
      ? data.Organization[0]
      : data.Organization;
    const team = Array.isArray(data.Team) ? data.Team[0] : data.Team;
    const inviter = Array.isArray(data.InvitedBy)
      ? data.InvitedBy[0]
      : data.InvitedBy;

    return NextResponse.json({
      invite: {
        email: data.email,
        role: data.role,
        teamRole: data.teamRole,
        status: data.status,
        expiresAt: data.expiresAt,
        organizationName: org?.name || null,
        teamName: team?.name || null,
        inviterName: inviter?.name || null,
      },
    });
  } catch (error) {
    console.error("Get invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}