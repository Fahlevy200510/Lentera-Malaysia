import { NextRequest, NextResponse } from "next/server";

interface TeacherReportRequest {
  student: {
    id: string;
    name: string;
    grade: string;
  };
  progress: {
    xp: number;
    modules: {
      component_recognition?: boolean;
      component_quiz?: boolean;
      series_circuit?: boolean;
      parallel_circuit?: boolean;
      circuit_troubleshoot?: boolean;
    };
    achievements?: string[];
  };
}

function generateLocalTeacherEvaluation(
  studentName: string,
  modules: TeacherReportRequest["progress"]["modules"],
  xp: number
): string {
  const completed: string[] = [];
  const pending: string[] = [];

  if (modules.component_recognition) completed.push("Pengenalan Komponen Taktil");
  else pending.push("Pengenalan Bentuk Taktil Komponen");

  if (modules.component_quiz) completed.push("Kuis Fungsi Rangkaian");
  else pending.push("Kuis Taktil Pemahaman Fungsi");

  if (modules.series_circuit) completed.push("Perakitan Rangkaian Seri");
  else pending.push("Perakitan Rangkaian Seri Mandiri");

  if (modules.parallel_circuit) completed.push("Perakitan Rangkaian Paralel Bercabang");
  else pending.push("Perakitan Rangkaian Paralel Bercabang");

  if (modules.circuit_troubleshoot) completed.push("Tantangan Detektif Sirkuit");
  else pending.push("Diagnosis Pemecahan Masalah Sirkuit");

  const p1 = `Ananda ${studentName} menunjukkan perkembangan kemandirian taktil yang sangat positif dengan perolehan ${xp} XP. Siswa telah membuktikan kepekaan rabaan yang konsisten dalam mengidentifikasi simbol timbul dan ${
    completed.length > 0 ? completed.join(", ") : "mempelajari komponen dasar listrik"
  } secara mandiri tanpa ketergantungan pada persepsi visual.`;

  const p2 =
    pending.length > 0
      ? `Untuk tahap bimbingan berikutnya, disarankan memberikan stimulasi taktil bertahap pada ${pending.slice(0, 2).join(" serta ")}. Gunakan pendekatan analogi aliran air atau jalur jalan raya bercabang untuk memperkuat intuisi logika kelistrikan.`
      : `Ananda telah menuntaskan seluruh tingkatan modul kurikulum kelistrikan dengan luar biasa. Pembelajaran dapat dilanjutkan ke materi lanjutan seperti penerapan sensor dan elektromagnetik sederhana.`;

  const p3 = `Sikap eksploratif dan ketelitian siswa patut diapresiasi tinggi. Kerja sama orang tua dan guru dalam memberi ruang eksplorasi fisik mandiri terbukti efektif mempercepat kepercayaan diri ananda di bidang sains.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

const SYSTEM_PROMPT = `Kamu adalah Konsultan Pedagogis Pendidikan Luar Biasa (SLB) dan Ahli Sains Inklusi LENTERA.
Tugasmu adalah menyusun Catatan Evaluasi & Rekomendasi Guru Pendamping Khusus (GPK) yang profesional, hangat, objektif, dan suportif untuk lembar rapor belajar siswa tunanetra.

ATURAN PENULISAN:
1. Tulis tepat dalam 3 paragraf ringkas (total 100 - 140 kata).
2. DILARANG menggunakan tabel, poin peluru (bullet points), atau markdown tebal/miring. Tulis hanya dalam bentuk teks paragraf mengalir yang rapi saat dicetak dan nyaman dibacakan suara pembaca layar (screen reader).
3. Paragraf 1: Apresiasi kemandirian motorik taktil dan modul yang telah dikuasai siswa.
4. Paragraf 2: Rekomendasi diferensiasi pembelajaran spesifik untuk langkah bimbingan berikutnya pada modul yang belum tuntas.
5. Paragraf 3: Catatan motivasi positif serta panduan sinergi bagi guru dan orang tua di rumah.
6. Bahasa: Bahasa Indonesia baku, santun, dan pedagogis.`;

export async function POST(req: NextRequest) {
  try {
    const body: TeacherReportRequest = await req.json();
    const student = body?.student;
    const progress = body?.progress;

    const studentName = String(student?.name ?? "Siswa").trim();
    const modules = progress?.modules ?? {};
    const xp = Number(progress?.xp ?? 0);

    const apiKey = process.env.GROQ_API_KEY;

    // Fallback lokal jika tidak ada apiKey
    if (!apiKey) {
      const localNotes = generateLocalTeacherEvaluation(studentName, modules, xp);
      return NextResponse.json({
        notes: localNotes,
        engine: "CLE-Rule-Engine-Local",
      });
    }

    const completedNames = Object.entries(modules)
      .filter(([_, v]) => Boolean(v))
      .map(([k]) => k);
    const pendingNames = Object.entries(modules)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    const userPrompt = `Nama Siswa: ${studentName}
Kelas: ${student?.grade ?? "Kelas 11 SMA"}
Total XP: ${xp}
Modul Selesai: ${completedNames.length > 0 ? completedNames.join(", ") : "Dalam tahap awal pengenalan"}
Modul Belum Selesai / Sedang Ditempuh: ${pendingNames.length > 0 ? pendingNames.join(", ") : "Semua modul tuntas"}

Susunkan 3 paragraf catatan evaluasi & rekomendasi guru pendamping khusus sesuai aturan.`;

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 450,
        }),
      });

      if (!groqRes.ok) {
        console.warn("Groq report generation returned non-200:", groqRes.status);
        const fallbackNotes = generateLocalTeacherEvaluation(studentName, modules, xp);
        return NextResponse.json({
          notes: fallbackNotes,
          engine: "CLE-Rule-Engine-Local (Groq-Failover)",
        });
      }

      const data = await groqRes.json();
      const rawText: string = data?.choices?.[0]?.message?.content?.trim() || "";

      // Bersihkan jika ada reasoning tokens atau tag sisa
      const cleanText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      if (!cleanText) {
        const fallbackNotes = generateLocalTeacherEvaluation(studentName, modules, xp);
        return NextResponse.json({
          notes: fallbackNotes,
          engine: "CLE-Rule-Engine-Local (Groq-Failover)",
        });
      }

      return NextResponse.json({
        notes: cleanText,
        engine: "Groq-AI-Pedagogis",
      });
    } catch (apiErr) {
      console.error("Groq Teacher Report Exception:", apiErr);
      const fallbackNotes = generateLocalTeacherEvaluation(studentName, modules, xp);
      return NextResponse.json({
        notes: fallbackNotes,
        engine: "CLE-Rule-Engine-Local (Groq-Failover)",
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menyusun catatan evaluasi", detail: err?.message },
      { status: 500 }
    );
  }
}
