import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, avatar } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (email !== session.user.email) {
      const { data: existing } = await supabase
        .from("User")
        .select("id")
        .eq("email", email)
        .neq("id", session.user.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase
      .from("User")
      .update({ name, email, avatar: avatar || null, updatedAt: new Date().toISOString() })
      .eq("id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
