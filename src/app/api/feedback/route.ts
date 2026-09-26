import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, subject, message, page } = body;

    if (!category || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Category, subject, and message are required" },
        { status: 400 }
      );
    }

    const validCategories = ["BUG", "SUGGESTION", "OTHER"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Feedback")
      .insert({
        id: crypto.randomUUID(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        page: page || null,
        userId: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: feedback, error } = await supabase
      .from("Feedback")
      .select("*")
      .eq("userId", session.user.id)
      .order("createdAt", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(feedback || []);
  } catch (error) {
    console.error("Get user feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}