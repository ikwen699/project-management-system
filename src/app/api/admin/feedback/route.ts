import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

function isAuthError(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const { data: feedback, error } = await supabase
      .from("Feedback")
      .select("*, User:userId (id, name, email, avatar)")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return NextResponse.json(feedback || []);
  } catch (error) {
    if (isAuthError(error)) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Admin get feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["NEW", "READ", "RESOLVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Feedback")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (isAuthError(error)) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Admin update feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("Feedback").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Feedback deleted" });
  } catch (error) {
    if (isAuthError(error)) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Admin delete feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}