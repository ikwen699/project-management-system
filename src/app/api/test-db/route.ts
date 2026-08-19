import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const authSecret = process.env.AUTH_SECRET;
  const authUrl = process.env.AUTH_URL;
  const nextauthUrl = process.env.NEXTAUTH_URL;

  const result: Record<string, string> = {
    SUPABASE_URL: url ? `${url.substring(0, 40)}...` : "MISSING",
    SUPABASE_SERVICE_KEY: key ? `${key.substring(0, 30)}...` : "MISSING",
    AUTH_SECRET: authSecret ? "SET (length: " + authSecret.length + ")" : "MISSING",
    AUTH_URL: authUrl || "MISSING",
    NEXTAUTH_URL: nextauthUrl || "MISSING",
  };

  try {
    const { data, error } = await supabase.from("User").select("id").limit(1);
    if (error) {
      result.dbConnection = `FAILED: ${error.message} (code: ${error.code})`;
    } else {
      result.dbConnection = `OK (found ${data?.length || 0} user(s))`;
    }
  } catch (e: any) {
    result.dbConnection = `EXCEPTION: ${e?.message || String(e)}`;
  }

  return NextResponse.json(result, { status: 200 });
}
