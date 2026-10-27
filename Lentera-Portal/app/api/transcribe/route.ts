import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/transcribe
// Accepts: multipart/form-data with "file" (audio blob)
// Returns: { text: string }
// Powered by Groq Whisper Large v3 Turbo (High-accuracy Indonesian STT)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "Berkas audio tidak ditemukan." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY belum terkonfigurasi." },
        { status: 500 }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", file, "audio.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", "id");
    groqForm.append("response_format", "json");

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      }
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[Transcribe] Groq error:", errText);
      return NextResponse.json(
        { error: "Gagal mentranskripsi audio dengan Groq Whisper." },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    const text = (data.text || "").trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[Transcribe] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
