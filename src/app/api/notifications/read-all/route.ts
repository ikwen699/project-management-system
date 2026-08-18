import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PUT() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("Notification")
      .update({ isRead: true })
      .eq("userId", session.user.id)
      .eq("isRead", false);

    if (error) throw error;

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
