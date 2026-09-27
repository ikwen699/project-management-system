import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { hash } from "bcryptjs";
import { purgeUsers, purgePastDueUsers } from "@/lib/admin-user-removal";

export async function GET() {
  try {
    await requireSuperAdmin();

    await purgePastDueUsers();

    const { data: users, error } = await supabase
      .from("User")
      .select("id, name, email, avatar, role, createdAt, removalScheduledAt")
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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : body.userId ? [body.userId] : [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: "userId or userIds is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const result = await purgeUsers(userIds, session.user?.id || "");

    return NextResponse.json(
      {
        deleted: result.deleted.length,
        deletedIds: result.deleted,
        skipped: result.skipped.length > 0 ? result.skipped : undefined,
      },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders() });
    }
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
