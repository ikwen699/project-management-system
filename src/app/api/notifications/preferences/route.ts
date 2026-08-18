import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { data: prefs, error } = await supabase
      .from("NotificationPreference")
      .select("*")
      .eq("userId", session.user.id)
      .single();

    if (!prefs) {
      const { data: newPrefs, error: insertError } = await supabase
        .from("NotificationPreference")
        .insert({ id: crypto.randomUUID(), userId: session.user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      prefs = newPrefs;
    }

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.emailEnabled !== undefined) updates.emailEnabled = body.emailEnabled;
    if (body.taskAssigned !== undefined) updates.taskAssigned = body.taskAssigned;
    if (body.taskStatusChanged !== undefined) updates.taskStatusChanged = body.taskStatusChanged;
    if (body.taskDueSoon !== undefined) updates.taskDueSoon = body.taskDueSoon;
    if (body.taskOverdue !== undefined) updates.taskOverdue = body.taskOverdue;
    if (body.mentionReceived !== undefined) updates.mentionReceived = body.mentionReceived;
    if (body.memberAdded !== undefined) updates.memberAdded = body.memberAdded;
    if (body.milestoneCompleted !== undefined) updates.milestoneCompleted = body.milestoneCompleted;
    if (body.projectDeadline !== undefined) updates.projectDeadline = body.projectDeadline;
    if (body.dueSoonDays !== undefined) updates.dueSoonDays = body.dueSoonDays;
    updates.updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("NotificationPreference")
      .update(updates)
      .eq("userId", session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: "Preferences updated" });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
