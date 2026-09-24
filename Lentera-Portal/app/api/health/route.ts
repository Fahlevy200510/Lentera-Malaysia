import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "LENTERA Portal API",
    tutor: Boolean(process.env.GROQ_API_KEY) ? "groq-with-local-fallback" : "local-cle",
    timestamp: new Date().toISOString(),
  });
}
