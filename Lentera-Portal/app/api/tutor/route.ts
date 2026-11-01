import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/tutor
// Body: { message: string, mode?: string, circuitState?: object, history?: {role, text}[] }
// Returns: { text: string, note: string | null, mode: string }
//
// Dual-Engine Architecture:
// 1. Groq LLaMA 3.3 70B if GROQ_API_KEY is configured.
// 2. Intelligent CLE Deterministic Reasoning Fallback if offline/no key,
//    ensuring Netlify deployment and LIDM jury review never fails.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Kamu adalah LENTERA AI ASSISTANT — tutor lab sains yang adaptif dan inklusif untuk siswa tunanetra dan low vision di tingkat SMPLB, dikembangkan untuk LIDM 2026.

PERAN & PRINSIP PEDAGOGIS:
1. "Jelaskan Sebelum Menjawab": Jangan pernah memberi jawaban instan atau langsung memperbaiki rangkaian. Ajukan pertanyaan reflektif dan bimbing siswa langkah demi langkah.
2. Kosakata Taktil: JANGAN PERNAH memakai instruksi visual seperti "lihat gambar" atau "perhatikan warna kabel". Gunakan bahasa taktil dan spasial seperti "raba", "rasakan", "telusuri jalurnya", "sisi kiri/kanan", "tekstur timbul/cekung", dan "geser tuas saklar ke ON/OFF".
3. Bahasa: Selalu jawab dalam Bahasa Indonesia yang hangat, suportif, inklusif, dan ringkas (2–4 kalimat) yang nyaman untuk pembaca layar dan text-to-speech.
4. Mode Interaksi:
   - Mode Eksplorasi: Mengenal komponen dan analogi taktil untuk aliran listrik.
   - Mode Pemecahan Masalah: Menelusuri kesalahan rangkaian secara sistematis menggunakan data sensor.
   - Refleksi Konsep: Merenungkan mengapa suatu fenomena terjadi.
   - Mode Evaluasi: Memberi pertanyaan taktil formatif untuk mengecek pemahaman mandiri.`;

interface ChatTurn {
  role: "ai" | "user";
  text: string;
}

// Normalises circuit telemetry so both schemas work:
//  - UI/simulator: { polarity_correct, circuit_closed, switch_state }
//  - legacy:       { isLampReversed, isSwitchOpen }
function normalizeCircuit(cs: any): { lampReversed: boolean; switchOpen: boolean; pathOpen: boolean; allGood: boolean } | null {
  if (!cs || typeof cs !== "object") return null;
  const status = String(cs.status || "");
  const lampReversed = cs.isLampReversed === true || cs.polarity_correct === false || status === "polarity_reversed";
  const switchOpen = cs.isSwitchOpen === true || cs.switch_state === "off" || status === "switch_off";
  const pathOpen = cs.circuit_closed === false || status === "open_circuit" || status === "not_connected";
  const allGood = !lampReversed && !switchOpen && !pathOpen && (cs.circuit_closed === true || cs.polarity_correct === true || status === "success");
  return { lampReversed, switchOpen, pathOpen, allGood };
}

// Intelligent Offline Fallback Engine
function generateCLEFallbackResponse(
  message: string,
  mode: string,
  circuitState?: any
): { text: string; note: string } {
  const m = message.toLowerCase();
  const cs = normalizeCircuit(circuitState);

  // Kata kunci Indonesia + Inggris agar tetap kompatibel
  const isSeriesParallel = /seri|paralel|parallel/.test(m);

  if (/orang tua|parent/.test(m)) {
    if (isSeriesParallel) {
      return {
        text: "Kamu bisa menjelaskannya dengan analogi jalan: rangkaian seri seperti satu jalan tanpa cabang, sedangkan rangkaian paralel seperti jalan yang bercabang. Ajak siswa meraba dua kabel yang disusun berurutan lalu bercabang, dan minta mereka menceritakan perbedaannya dengan kata-kata sendiri.",
        note: "Panduan Orang Tua: Rangkaian Seri & Paralel",
      };
    }
    return {
      text: "Di rumah, ajak siswa menjelajahi benda listrik dengan aman, misalnya saklar lampu dinding, lalu tanyakan apa yang mereka rasakan saat tuasnya ditekan. Beri waktu untuk menjawab sebelum menjelaskan agar rasa ingin tahunya tumbuh.",
      note: "Panduan Orang Tua: Aktivitas Taktil di Rumah",
    };
  }

  const isOtherIntent =
    mode === "reflection" || mode === "evaluation" ||
    /konsep|beda|kuis|tes|evaluasi|pertanyaan|apa itu|apa fungsi|fungsi|bagaimana|jelaskan|concept|difference|quiz|test|evaluation|question|what is|explain|seri|paralel|parallel/.test(m);
  const mentionsFault = /rusak|mati|tidak menyala|ga nyala|gak nyala|nggak nyala|tidak berfungsi|salah|error|redup|broken|dead|not working|wrong|dim/.test(m);
  const wantsDiagnosis = mode === "troubleshooting" || mentionsFault || !isOtherIntent;

  if (cs && wantsDiagnosis && (cs.lampReversed || cs.switchOpen || cs.pathOpen)) {
    if (cs.lampReversed) {
      return {
        text: "Kutub polaritas lampu LED di rangkaianmu terbalik sehingga lampu belum menyala. Raba balok lampu tersebut, lalu angkat dan putar posisinya 180 derajat agar kutub bertanda plus menghadap ke arah kutub positif baterai.",
        note: "Diagnosis CLE: Polaritas lampu terbalik",
      };
    }
    if (cs.switchOpen) {
      return {
        text: "Sentuh saklar geser di petak A2 di sisi kanan papanmu. Apakah tuas gesernya masih di posisi terbuka atau OFF, atau sudah kamu geser ke posisi ON?",
        note: "Diagnosis CLE: Saklar terbuka (Rangkaian Terbuka)",
      };
    }
    return {
      text: "Ayo kita selidiki bersama. Telusuri kabel taktil dari kutub positif baterai dengan ujung jarimu. Adakah jalur yang terasa terputus atau longgar sebelum sampai ke lampu?",
      note: "Diagnosis CLE: Jalur rangkaian terbuka",
    };
  }
  if (cs && !mentionsFault && wantsDiagnosis && cs.allGood && (mode === "troubleshooting" || /benar|selesai|nyala|menyala|berhasil|cek|periksa|correct|done|lit|working|check/.test(m))) {
    return {
      text: "Hebat, jalur dari baterai melalui saklar ke lampu sudah tersambung dengan polaritas yang benar. Sekarang tantangannya: jika kamu menambah satu lampu lagi secara seri, menurutmu lampu pertama akan terasa lebih terang atau lebih redup?",
      note: "CLE: Rangkaian berhasil tertutup",
    };
  }

  if (mode === "troubleshooting" || mentionsFault) {
    return {
      text: "Ayo kita selidiki bersama. Pertama, telusuri kabel taktil dari kutub positif baterai dengan ujung jarimu. Adakah jalur yang terasa terputus atau longgar sebelum sampai ke lampu?",
      note: "Diagnosis CLE: Penelusuran jalur taktil mandiri",
    };
  }

  if (mode === "reflection" || /kenapa|mengapa|konsep|beda|why|concept|difference/.test(m) || isSeriesParallel) {
    if (isSeriesParallel) {
      return {
        text: "Bayangkan rangkaian seri seperti satu lorong sekolah di mana semua orang harus berjalan berurutan, jadi jika satu orang berhenti, semua ikut tertahan. Rangkaian paralel seperti memiliki dua lorong terpisah. Jika satu lampu dilepas dari rangkaian paralel, menurutmu apa yang akan kamu rasakan pada lampu lainnya?",
        note: "Refleksi Konsep: Analogi Jalur Taktil",
      };
    }
    return {
      text: "Itu pertanyaan yang bagus untuk direnungkan! Saat arus listrik melewati filamen lampu, energi listrik berubah menjadi panas dan cahaya. Raba permukaan bohlam setelah menyala beberapa saat, apakah terasa hangat?",
      note: "Refleksi Konsep: Perubahan Energi Listrik",
    };
  }

  if (mode === "evaluation" || /kuis|tes|evaluasi|pertanyaan|quiz|test|evaluation|question/.test(m)) {
    return {
      text: "Tantangan Kuis Taktil: Kamu punya 1 baterai dan 2 lampu yang disusun berurutan dalam satu kabel tanpa cabang. Jika saklar ditekan, apakah ini rangkaian seri atau paralel? Jawab berdasarkan jalur yang bisa kamu telusuri dengan rabaan.",
      note: "Evaluasi Formatif: Memahami Rangkaian Seri",
    };
  }

  if (/baterai|battery/.test(m)) {
    return {
      text: "Baterai adalah sumber energi listrik kita. Raba kedua ujungnya: kamu akan merasakan simbol timbul tanda plus untuk kutub positif, dan simbol timbul tanda minus untuk kutub negatif. Keduanya memiliki tekstur timbul agar mudah dibedakan dengan jari. Arus mengalir keluar dari kutub positif.",
      note: "Eksplorasi Taktil: Mengenali Polaritas Baterai",
    };
  }

  if (/saklar|sakelar|switch/.test(m)) {
    return {
      text: "Saklar bekerja seperti jembatan angkat. Saat kamu menekan tuasnya ke bawah, jembatan tertutup dan arus bisa lewat. Saat kamu mengangkatnya, jalur terbuka dan arus berhenti.",
      note: "Eksplorasi Taktil: Cara Kerja Saklar",
    };
  }

  if (/lampu|cahaya|lamp|light/.test(m)) {
    return {
      text: "Lampu adalah beban yang mengubah energi listrik. Komponen lampu di papan kita memiliki penanda taktil timbul di sisinya untuk membantumu menyesuaikan arah arus dengan benar.",
      note: "Eksplorasi Taktil: Mengenali Beban Lampu",
    };
  }

  return {
    text: "Halo! Aku LENTERA AI Assistant. Aku siap menemani lab sainsmu hari ini. Kamu bisa meraba komponen di papan taktilmu atau bertanya tentang konsep rangkaian listrik yang ingin kamu jelajahi.",
    note: "Dukungan Belajar Inklusif Aktif",
  };
}

const ALLOWED_MODES = new Set(["exploration", "troubleshooting", "reflection", "evaluation"]);

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "LENTERA AI Tutor",
    engine: process.env.GROQ_API_KEY ? "groq-with-local-fallback" : "CLE-Rule-Engine-Local",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();
    const requestedMode = String(body?.mode ?? "exploration");
    const mode = ALLOWED_MODES.has(requestedMode) ? requestedMode : "exploration";
    const circuitState = body?.circuitState ?? null;
    const history: ChatTurn[] = Array.isArray(body?.history)
      ? body.history
          .filter((h: any) => (h?.role === "user" || h?.role === "ai") && typeof h?.text === "string")
          .slice(-6)
      : [];

    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }
    if (message.length > 1200) {
      return NextResponse.json({ error: "Pesan terlalu panjang. Maksimal 1.200 karakter." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // If Groq API key is not present, use the deterministic CLE fallback
    if (!apiKey) {
      const fallback = generateCLEFallbackResponse(message, mode, circuitState);
      return NextResponse.json({
        text: fallback.text,
        note: fallback.note,
        mode,
        engine: "CLE-Rule-Engine-Local",
      });
    }

    // If Groq API key is provided, use LLaMA 3.3 70B
    let diagnosisRule = "";
    const sensorStatus = String(circuitState?.status || "");
    if (sensorStatus === "polarity_reversed") {
      diagnosisRule = "\n\nATURAN MUTLAK DIAGNOSIS SENSOR: Status sirkuit terdeteksi polarity_reversed (kutub polaritas lampu LED terbalik). Jalur sirkuit SUDAH TERSAMBUNG DAN LOOP SUDAH TERTUTUP! JANGAN PERNAH menyuruh menghubungkan kabel lagi, JANGAN menyuruh memasang kabel di C3! Beritahu siswa dengan jelas bahwa rangkaiannya sudah terhubung, tetapi kutub lampu LED terbalik. Bimbing siswa untuk meraba balok lampu tersebut, lalu memutar posisinya 180 derajat agar kutub bertanda plus (+) menghadap ke arah kutub positif baterai.";
    } else if (sensorStatus === "switch_off") {
      diagnosisRule = "\n\nATURAN MUTLAK DIAGNOSIS SENSOR: Rangkaian sudah tersambung tetapi saklar masih terbuka atau OFF. Bimbing siswa untuk meraba balok saklar dan memutar tuasnya 90 derajat ke posisi ON agar arus mengalir.";
    } else if (sensorStatus === "short_circuit") {
      diagnosisRule = "\n\nPERINGATAN BAHAYA SENSOR: Terjadi korsleting arus pendek tanpa beban! Bimbing siswa segera melepaskan kabel atau memasang lampu.";
    } else if (sensorStatus === "success") {
      diagnosisRule = "\n\nSTATUS SENSOR: Rangkaian berhasil menyala sempurna! Berikan pujian hangat atas ketelitian taktil siswa.";
    }

    const contextBlock = circuitState
      ? `\n\nData sensor rangkaian fisik saat ini:\n${JSON.stringify(circuitState, null, 2)}\nMode saat ini: ${mode}${diagnosisRule}`
      : `\n\nMode saat ini: ${mode}`;

    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}${contextBlock}` },
      ...history.slice(-6).map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.7,
          max_tokens: 450,
        }),
      });

      if (!groqRes.ok) {
        const errorText = await groqRes.text();

        console.error("GROQ API ERROR:", groqRes.status, errorText);

        const fallback = generateCLEFallbackResponse(
          message,
          mode,
          circuitState
        );

        return NextResponse.json({
          text: fallback.text,
          note: `Groq error ${groqRes.status} — memakai CLE cadangan`,
          mode,
          engine: "CLE-Rule-Engine-Local (Groq-Failover)",
          groqError: errorText,
        });
      }

      const data = await groqRes.json();
      const text: string =
        data?.choices?.[0]?.message?.content?.trim() ||
        "Coba raba lagi komponen di papanmu. Apa yang kamu rasakan?";

      let note = `Mode: ${mode.toUpperCase()}`;
      if (circuitState) {
        if (circuitState.polarity_correct === false) note = "CLE: Polaritas Terbalik Terdeteksi";
        else if (circuitState.circuit_closed === false) note = "CLE: Jalur Rangkaian Terbuka";
        else if (circuitState.circuit_closed === true) note = "CLE: Rangkaian Berhasil Tertutup";
      }

      return NextResponse.json({ text, note, mode, engine: "Groq-LLaMA-3.3-70B" });
    } catch (apiErr) {
      // Failover safely
      const fallback = generateCLEFallbackResponse(message, mode, circuitState);
      return NextResponse.json({
        text: fallback.text,
        note: fallback.note,
        mode,
        engine: "CLE-Rule-Engine-Local (Exception-Failover)",
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
