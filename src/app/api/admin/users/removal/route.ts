import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { notifyRemovalScheduled, notifyRemovalCancelled } from "@/lib/notifications";
import { purgeUsers } from "@/lib/admin-user-removal";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();
    const { userIds, scheduledFor } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds array is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: "scheduledFor date is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "scheduledFor must be a future date" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const { count: adminCount } = await supabase
      .from("User")
      .select("id", { count: "exact", head: true })
      .eq("role", "SUPER_ADMIN");

    const scheduled: string[] = [];
    const skipped: { userId: string; reason: string }[] = [];

    for (const userId of userIds) {
      if (session.user?.id && userId === session.user.id) {
        skipped.push({ userId, reason: "Cannot schedule your own removal" });
        continue;
      }

      const { data: targetUser } = await supabase
        .from("User")
        .select("role")
        .eq("id", userId)
        .single();

      if (targetUser?.role === "SUPER_ADMIN" && adminCount !== null && adminCount <= 1) {
        skipped.push({ userId, reason: "Cannot schedule the last super admin" });
        continue;
      }

      const { error } = await supabase
        .from("User")
        .update({
          removalScheduledAt: scheduledDate.toISOString(),
          removalRequestedBy: session.user?.id || null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        skipped.push({ userId, reason: error.message });
        continue;
      }

      await notifyRemovalScheduled(userId, scheduledDate.toISOString(), session.user?.id || "");
      scheduled.push(userId);
    }

    return NextResponse.json(
      { scheduled: scheduled.length, scheduledIds: scheduled, skipped: skipped.length > 0 ? skipped : undefined },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders() });
    }
    console.error("Admin schedule removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();
    const { userIds, action } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds array is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (action === "purge") {
      const result = await purgeUsers(userIds, session.user?.id || "");
      return NextResponse.json(
        { deleted: result.deleted.length, deletedIds: result.deleted, skipped: result.skipped.length > 0 ? result.skipped : undefined },
        { headers: corsHeaders() }
      );
    }

    const cancelled: string[] = [];
    const skipped: { userId: string; reason: string }[] = [];

    for (const userId of userIds) {
      const { error } = await supabase
        .from("User")
        .update({
          removalScheduledAt: null,
          removalRequestedBy: null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        skipped.push({ userId, reason: error.message });
        continue;
      }

      await notifyRemovalCancelled(userId, session.user?.id || "");
      cancelled.push(userId);
    }

    return NextResponse.json(
      { cancelled: cancelled.length, cancelledIds: cancelled, skipped: skipped.length > 0 ? skipped : undefined },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders() });
    }
    console.error("Admin cancel/purge removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}