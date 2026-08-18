import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    await requireSuperAdmin();

    const { data: users, error } = await supabase
      .from("User")
      .select("id, name, email, avatar, role, createdAt")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return NextResponse.json(users || []);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("User")
      .select("id")
      .eq("email", body.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(body.password, 12);

    const { data: user, error } = await supabase
      .from("User")
      .insert({
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || "USER",
      })
      .select("id, name, email, role, createdAt")
      .single();

    if (error) throw error;

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();

    if (!body.userId || !body.role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    if (body.role !== "USER" && body.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    if (session.user?.id && body.userId === session.user.id && body.role === "USER") {
      const { count } = await supabase
        .from("User")
        .select("id", { count: "exact", head: true })
        .eq("role", "SUPER_ADMIN");

      if (count !== null && count <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last super admin" },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("User")
      .update({ role: body.role, updatedAt: new Date().toISOString() })
      .eq("id", body.userId);

    if (error) throw error;

    return NextResponse.json({ message: "Role updated" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (session.user?.id && userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const { count: adminCount } = await supabase
      .from("User")
      .select("id", { count: "exact", head: true })
      .eq("role", "SUPER_ADMIN");

    const { data: targetUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetUser?.role === "SUPER_ADMIN" && adminCount !== null && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last super admin" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("User").delete().eq("id", userId);
    if (error) throw error;

    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
