import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("Notification")
      .select("*", { count: "exact", head: true })
      .eq("userId", session.user.id)
      .eq("isRead", false);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Unread count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
