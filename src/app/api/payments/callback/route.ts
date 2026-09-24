import { NextResponse } from "next/server";
import { appBaseUrl, verifyAndActivate } from "@/lib/payments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(
      `${appBaseUrl()}/settings/billing?status=error`,
      302
    );
  }

  const ok = await verifyAndActivate(reference);

  return NextResponse.redirect(
    `${appBaseUrl()}/settings/billing?status=${ok ? "success" : "error"}`,
    302
  );
}