import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { name, email, password, plan, trial } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const billing = buildInitialBilling(plan, trial);

    const { error } = await supabase
      .from("User")
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        plan: billing.plan,
        planStatus: billing.planStatus,
        trialEndsAt: billing.trialEndsAt,
        planExpiresAt: null,
      });

    if (error) throw error;

    return NextResponse.json(
      { message: "Account created successfully", plan: billing.plan },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function buildInitialBilling(
  plan: string | undefined,
  trial: boolean | undefined
): { plan: string; planStatus: string; trialEndsAt: Date | null } {
  const TRIAL_DAYS = 7;

  if (trial) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + TRIAL_DAYS);
    return { plan: "business", planStatus: "trialing", trialEndsAt: endsAt };
  }

  if (plan === "business") {
    // Chose Business at signup: payment still required to activate.
    return { plan: "business", planStatus: "expired", trialEndsAt: null };
  }

  return { plan: "starter", planStatus: "active", trialEndsAt: null };
}
