import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: notifications, error } = await supabase
      .from("Notification")
      .select("*")
      .eq("userId", session.user.id)
      .order("createdAt", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("List notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, isRead } = await request.json();

    if (notificationId) {
      const { error } = await supabase
        .from("Notification")
        .update({ isRead })
        .eq("id", notificationId)
        .eq("userId", session.user.id);

      if (error) throw error;
    }

    return NextResponse.json({ message: "Notification updated" });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
