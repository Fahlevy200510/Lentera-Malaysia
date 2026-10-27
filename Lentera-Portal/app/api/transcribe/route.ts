import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/transcribe
// Accepts: multipart/form-data with "file" (audio blob)
// Returns: { text: string, silent?: boolean }
// Powered by Groq Whisper Large v3 Turbo (High-accuracy Indonesian STT)
// ---------------------------------------------------------------------------

const SILENCE_HALLUCINATIONS = new Set([
  "terima kasih",
  "terimakasih",
  "terima kasih banyak",
  "terimakasih banyak",
  "terima kasih telah menonton",
  "terima kasih sudah menonton",
  "thank you",
  "thank you very much",
  "thanks for watching",
  "subtitles by",
  "you",
  "kamu",
  "halo",
  "",
]);

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
    groqForm.append("temperature", "0");
    groqForm.append("prompt", "Pertanyaan sains siswa tentang rangkaian listrik seri dan paralel, baterai, lampu, saklar, kabel, dan komponen Lentera.");
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
    const rawText = (data.text || "").trim();
    const normalized = rawText.toLowerCase().replace(/[.,!?;:\"\'\-]/g, "").trim();

    // Deteksi halusinasi Whisper saat audio hening / suara mikrofon belum tertangkap
    if (!normalized || SILENCE_HALLUCINATIONS.has(normalized)) {
      return NextResponse.json({ text: "", silent: true });
    }

    return NextResponse.json({ text: rawText, silent: false });
  } catch (err: any) {
    console.error("[Transcribe] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
