import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getEntitlement } from "@/lib/billing";

const TRIAL_DAYS = 7;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entitlement = await getEntitlement(session.user.id);

    let projectCount = 0;
    if (!entitlement.isFullAccess) {
      const { count } = await supabase
        .from("Project")
        .select("id", { count: "exact", head: true })
        .eq("ownerId", session.user.id)
        .not("isArchived", "eq", true);
      projectCount = count || 0;
    }

    return NextResponse.json({ ...entitlement, projectCount });
  } catch (error) {
    console.error("Plan status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role?: string }).role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super admins have full access on every plan" },
        { status: 403 }
      );
    }

    const { action } = await request.json();

    switch (action) {
      case "choose-starter": {
        const { error } = await supabase
          .from("User")
          .update({ plan: "starter", planStatus: "active", planExpiresAt: null })
          .eq("id", session.user.id);
        if (error) throw error;
        return NextResponse.json({ ok: true, plan: "starter" });
      }

      case "start-trial": {
        const { data: user, error: readError } = await supabase
          .from("User")
          .select("trialEndsAt")
          .eq("id", session.user.id)
          .single();
        if (readError) throw readError;

        // One trial per account. A past trialEndsAt means it was already used.
        if (user?.trialEndsAt) {
          return NextResponse.json(
            { error: "You have already used your free trial" },
            { status: 400 }
          );
        }

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

        const { error } = await supabase
          .from("User")
          .update({
            plan: "business",
            planStatus: "trialing",
            trialEndsAt: trialEndsAt.toISOString(),
            planExpiresAt: null,
          })
          .eq("id", session.user.id);
        if (error) throw error;

        return NextResponse.json({
          ok: true,
          plan: "business",
          trialEndsAt: trialEndsAt.toISOString(),
        });
      }

      case "downgrade": {
        // Downgrade is immediate: paid/trial access ends now and the account
        // falls back to the Starter project limit. trialEndsAt is kept so a
        // used trial cannot be restarted.
        const { error } = await supabase
          .from("User")
          .update({
            plan: "starter",
            planStatus: "active",
            planExpiresAt: null,
          })
          .eq("id", session.user.id);
        if (error) throw error;
        return NextResponse.json({ ok: true, plan: "starter" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Plan update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}