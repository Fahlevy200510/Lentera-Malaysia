import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    // ============================================================
    // 1. VALIDATE INPUT
    // ============================================================

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!role || !["student", "teacher", "parent"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 }
      );
    }

    // ============================================================
    // 2. CHECK SUPABASE CONFIGURATION
    // ============================================================

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables are missing.");

      return NextResponse.json(
        {
          error: "Supabase configuration is missing on the server.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    // ============================================================
    // 3. AUTHENTICATE USER
    // ============================================================

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (authError || !authData.user || !authData.session) {
      console.error("Authentication error:", authError);

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const user = authData.user;

    // ============================================================
    // 4. GET REAL ROLE FROM SUPABASE AUTH METADATA
    // ============================================================

    const realRole = user.app_metadata?.role;

    if (
      !realRole ||
      !["student", "teacher", "parent"].includes(realRole)
    ) {
      return NextResponse.json(
        {
          error: "The account role is not configured correctly.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 5. PREVENT WRONG ROLE LOGIN
    // ============================================================

    if (realRole !== role) {
      return NextResponse.json(
        {
          error: `This account is registered as ${realRole}, not ${role}.`,
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 6. GET USER NAME
    // ============================================================

    const realName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";

    // ============================================================
    // 7. RETURN VERIFIED SESSION
    // ============================================================

    return NextResponse.json({
      success: true,
      session: {
        id: user.id,
        email: user.email,
        name: realName,
        role: realRole,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}