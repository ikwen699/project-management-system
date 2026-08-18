import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const { data: eventsRaw, error } = await supabase.rpc("get_calendar_events", {
      p_user_id: session.user.id,
      p_start: start || new Date(0).toISOString(),
      p_end: end || new Date(Date.now() + 365 * 86400000).toISOString(),
    });

    if (error) throw error;

    const events = Array.isArray(eventsRaw) ? eventsRaw[0] : eventsRaw;
    return NextResponse.json(Array.isArray(events) ? events : []);
  } catch (error) {
    console.error("Calendar events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
