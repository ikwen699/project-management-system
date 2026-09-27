import { NextResponse } from "next/server";
import { purgePastDueUsers } from "@/lib/admin-user-removal";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgePastDueUsers();
    return NextResponse.json({
      purged: result.deleted.length,
      purgedIds: result.deleted,
      skipped: result.skipped.length > 0 ? result.skipped : undefined,
    });
  } catch (error) {
    console.error("Cron purge users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}