import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getEntitlement } from "@/lib/billing";

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