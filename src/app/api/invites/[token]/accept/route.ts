import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { addUserToOrgAndTeam } from "@/lib/org-access";
import { notifyOrgInviteAccepted } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    const { data: invite, error } = await supabase
      .from("Invite")
      .select(
        `id, email, role, "teamRole", "expiresAt", status, "organizationId", "teamId", "invitedById"`,
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            invite.status === "ACCEPTED"
              ? "Invite has already been accepted"
              : invite.status === "DECLINED"
                ? "Invite has been declined"
                : "Invite has expired",
        },
        { status: 400 }
      );
    }

    if (
      invite.expiresAt &&
      new Date(invite.expiresAt).getTime() < Date.now()
    ) {
      await supabase
        .from("Invite")
        .update({ status: "EXPIRED" })
        .eq("id", invite.id);
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    if (
      invite.email.toLowerCase() !== session.user.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invite.email}. Sign in with that email to join.`,
        },
        { status: 403 }
      );
    }

    await addUserToOrgAndTeam({
      organizationId: invite.organizationId,
      userId: session.user.id,
      role: invite.role,
      teamId: invite.teamId,
      teamRole: invite.teamRole,
    });

    await supabase
      .from("Invite")
      .update({ status: "ACCEPTED" })
      .eq("id", invite.id);

    if (invite.invitedById && invite.invitedById !== session.user.id) {
      const { data: org } = await supabase
        .from("Organization")
        .select("name")
        .eq("id", invite.organizationId)
        .maybeSingle();
      await notifyOrgInviteAccepted(
        invite.invitedById,
        org?.name || "your organisation",
        session.user.name || session.user.email,
        session.user.id
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}