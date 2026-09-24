import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ROLES = new Set(["student", "teacher", "parent"]);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const role = String(body?.role ?? "");
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");

    if (!ROLES.has(role)) {
      return NextResponse.json(
        { error: "Invalid user role." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Read the role assigned to this Supabase account.
    const userRole = data.user.app_metadata?.role;

    if (!userRole) {
      return NextResponse.json(
        { error: "This account has no assigned role." },
        { status: 403 }
      );
    }

    // Prevent users from signing in under a different role.
    if (userRole !== role) {
      return NextResponse.json(
        {
          error: `This account is registered as ${userRole}, not ${role}.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      session: {
        name:
          data.user.user_metadata?.name ??
          email.split("@")[0],
        email: data.user.email,
        role: userRole,
        issuedAt: new Date().toISOString(),
        mode: "supabase",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid login payload." },
      { status: 400 }
    );
  }
}