"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ScanEye, MonitorSmartphone, Cpu, Wifi, BookOpen, LogOut, Volume2, Sparkles } from "lucide-react";
import CircuitDiagram from "@/components/aruco/CircuitDiagram";
import ArUcoDetector from "@/components/aruco/ArUcoDetector";
import VoiceGuide from "@/components/aruco/VoiceGuide";
import AITutorLab from "@/components/aruco/AITutorLab";
import StudentProfileSwitcher from "@/components/StudentProfileSwitcher";
import { getStudentProgress, getActiveStudent } from "@/utils/progress";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";
import { speakNarration, cancelSpeech } from "@/utils/audioCoordinator";

const wiringPoints = [
  {
    icon: <Cpu className="h-4 w-4 text-[#735CDD]" />,
    title: "Lentera Edge (Raspberry Pi)",
    text: "Pusat pemrosesan lokal. Menggunakan Computer Vision untuk melacak komponen rangkaian tanpa perlu internet.",
  },
  {
    icon: <MonitorSmartphone className="h-4 w-4 text-[#735CDD]" />,
    title: "Modul Kamera CSI",
    text: "Mata dari sistem. Kamera mengamati papan dan memindai penanda khusus pada setiap komponen secara real-time.",
  },
  {
    icon: <Wifi className="h-4 w-4 text-emerald-600" />,
    title: "Relai Data Langsung",
    text: "Mengirim susunan rangkaian secara langsung ke dashboard ini agar AI Tutor dapat membantu siswa belajar.",
  },
];

export default function ArucoPage() {
  const router = useRouter();
  const [diagramMode, setDiagramMode] = useState("live");
  const [activeTab, setActiveTab] = useState<"guide" | "tutor">("guide");
  const [session, setSession] = useState<{ name: string; role: string }>({
    name: "Pengguna LENTERA",
    role: "siswa",
  });

  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load daftar voice browser agar suara bahasa Indonesia langsung siap saat halaman terbuka
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      };
    }
  }, []);

  const speakLabIntro = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if ((window as any).__lenteraGuideMode && (window as any).__lenteraGuideMode !== "idle") return;
    if ((window as any).__lenteraSpeaking) return;

    const progress = getStudentProgress();
    const hasLearnedComponents = Boolean(progress?.modules?.component_recognition);
    const activeStudent = getActiveStudent();
    const studentName = activeStudent?.name || "Siswa";

    const text = hasLearnedComponents
      ? `Selamat datang kembali di LENTERA Lab, ${studentName}! Papan siap digunakan. Karena kamu sudah menguasai pengenalan komponen, seluruh fitur mandiri kini terbuka untukmu. Di baris bawah papan yang paling dekat denganmu: letakkan balok di kotak A1 untuk mengulang Pengenalan Komponen, di B1 untuk Kuis Taktil, di C1 untuk Rangkaian Seri, di D1 untuk Rangkaian Paralel, dan di E1 untuk Tantangan Detektif Sirkuit. Di baris atas: letakkan balok di sudut kiri atas A5 untuk Tanya AI Tutor lewat suara, atau di tengah atas C5 untuk Mode Eksplorasi Bebas. Kamu juga bisa meletakkan kartu identitasmu di sel A1 sudut kiri bawah untuk membuka LENTERA Learn dan melihat nilaimu, atau di sudut kanan atas kotak E5 untuk keluar mengakhiri sesi. Silakan raba papan dan letakkan balok di fitur yang kamu pilih!`
      : `Selamat datang di LENTERA Lab, ${studentName}! Papan eksperimen fisikmu sudah siap digunakan. Sebelum kita mulai merakit, silakan raba papan mejamu dan angkat balok yang masih terpasang agar papan bersih. Setelah itu, mari kita mulai belajar mengenal komponen listrik dan bentuk rabaan taktilnya satu per satu!`;

    speakingRef.current = true;
    setSpeaking(true);

    speakNarration(text, {
      rate: 0.94,
      pitch: 1.0,
      tag: "lab-intro",
      onEnd: () => {
        speakingRef.current = false;
        setSpeaking(false);
        // Jika siswa belum menyelesaikan Pengenalan Bentuk Taktil, otomatis lanjut ke panduan modul Tahap 1
        if (!hasLearnedComponents && typeof window !== "undefined") {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("lentera-start-guide", { detail: "recognition" }));
          }, 600);
        }
      },
    });
  }, []);

  // Dengarkan event perpindahan tab dari pintasan fisik papan taktil (misal: balok di A5 membuka AI Tutor)
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e?.detail === "tutor" || e?.detail === "guide") {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("lentera-switch-tab", handleSwitchTab);
    return () => window.removeEventListener("lentera-switch-tab", handleSwitchTab);
  }, []);

  // Putar narasi sambutan & arahan saat masuk ke Lentera Lab:
  // 1. Coba autoplay otomatis saat mount
  // 2. Jika browser memblokir autoplay tanpa gesture pengguna, putar segera saat pertama kali menyentuh/mengklik layar lab
  const hasSpokenLabIntroRef = useRef(false);
  useEffect(() => {
    hasSpokenLabIntroRef.current = false;

    // 1. Autoplay otomatis dengan jeda 800ms agar transisi audio dari halaman sebelumnya tuntas
    const timer = setTimeout(() => {
      if (!hasSpokenLabIntroRef.current && !speakingRef.current) {
        hasSpokenLabIntroRef.current = true;
        speakLabIntro();
      }
    }, 800);

    // 2. Fallback sentuhan/klik pertama di mana saja jika browser menahan autoplay
    const handleFirstInteraction = (e: MouseEvent | TouchEvent) => {
      if (hasSpokenLabIntroRef.current || speakingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("#btn-lab-voice")) return;

      hasSpokenLabIntroRef.current = true;
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      speakLabIntro();
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      cancelSpeech();
      speakingRef.current = false;
    };
  }, [speakLabIntro]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lentera-session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && parsed?.role) {
          setSession(parsed);
        }
      }
    } catch {}
  }, []);

  const logout = () => {
    localStorage.removeItem("lentera-session");
    router.replace("/login");
  };

  return (
    <main className="portal-page relative min-h-screen overflow-x-hidden font-body text-[#1D1836] print:bg-white print:min-h-0 print:p-0">
      {/* Ambient Background selaras dengan Beranda LENTERA */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
        <div
          className="absolute -left-24 -top-24 h-[30rem] w-[30rem] rounded-full opacity-80 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(115, 92, 221, 0.28) 0%, rgba(155, 135, 245, 0.12) 48%, transparent 72%)",
          }}
        />
        <div
          className="absolute -right-24 top-8 h-[32rem] w-[32rem] rounded-full opacity-85 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(251, 191, 36, 0.24) 0%, rgba(255, 243, 214, 0.45) 48%, transparent 72%)",
          }}
        />
        <div
          className="absolute bottom-[-8rem] left-1/3 h-[26rem] w-[36rem] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(253, 230, 138, 0.16) 52%, transparent 74%)",
          }}
        />
        <div className="portal-tactile-dots absolute inset-0 opacity-60" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-5 px-4 py-5 md:flex-row md:items-start lg:gap-6 lg:px-7 print:hidden">
        {/* Sidebar Navigasi LENTERA Lab (Sticky di layar laptop/desktop) */}
        <aside className="rise relative z-40 flex flex-col justify-between gap-5 rounded-[1.75rem] border border-[#735CDD]/18 bg-white/90 p-5 shadow-[0_18px_45px_-20px_rgba(67,56,202,0.18)] backdrop-blur-xl md:sticky md:top-5 md:h-[calc(100vh-2.5rem)] md:w-60 md:flex-shrink-0 lg:w-64">
          <div>
            {/* Brand Header */}
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-2xl pb-4 border-b border-[#735CDD]/12 focus-visible:outline-none"
            >
              <div
                className="relative flex items-center justify-center overflow-hidden rounded-xl bg-[#765EE0] shadow-[0_8px_20px_-4px_rgba(115,92,221,0.45)] ring-2 ring-[#FFF3D6] transition-transform duration-200 group-hover:scale-[1.03]"
                style={{ width: 42, height: 42 }}
              >
                <img
                  src="/logo-lentera.png"
                  alt="Logo LENTERA"
                  className="h-full w-full scale-[1.56] object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-lg font-extrabold tracking-tight text-[#1D1836]">
                    LENTERA
                  </span>
                  <span className="rounded-md bg-[#735CDD]/12 px-1.5 py-0.5 font-heading text-[10px] font-extrabold uppercase tracking-wider text-[#5840BA]">
                    Lab
                  </span>
                </div>
                <p className="text-[10.5px] font-bold tracking-wide text-[#5E548E]">
                  Ruang Praktik Taktil
                </p>
              </div>
            </Link>

            {/* Menu Navigasi */}
            <div className="mt-5 space-y-1.5">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#4A4458] transition-all hover:bg-[#F3EFFE] hover:text-[#1D1836]"
              >
                <ArrowLeft className="h-4 w-4 text-[#735CDD]" />
                <span>Kembali ke Beranda</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#4A4458] transition-all hover:bg-[#F3EFFE] hover:text-[#1D1836]"
              >
                <BookOpen className="h-4 w-4 text-[#735CDD]" />
                <span>Buka LENTERA Learn</span>
              </Link>

              <div className="pt-3.5 mt-3.5 border-t border-[#735CDD]/12">
                <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6E659F]">
                  Mode Pendamping Lab
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveTab("guide")}
                    className={`flex items-center justify-between w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                      activeTab === "guide"
                        ? "bg-[#735CDD] text-white shadow-[0_10px_22px_-6px_rgba(115,92,221,0.5)] font-extrabold"
                        : "text-[#4A4458] hover:bg-[#F3EFFE] hover:text-[#1D1836]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ScanEye className="h-4 w-4" />
                      <span>Panduan Modul</span>
                    </div>
                    <span
                      className={`text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold ${
                        activeTab === "guide"
                          ? "bg-[#FFF3D6] text-[#53389E]"
                          : "bg-[#F3EFFE] text-[#5840BA]"
                      }`}
                    >
                      5 Tahap
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tutor")}
                    className={`flex items-center justify-between w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                      activeTab === "tutor"
                        ? "bg-[#735CDD] text-white shadow-[0_10px_22px_-6px_rgba(115,92,221,0.5)] font-extrabold"
                        : "text-[#4A4458] hover:bg-[#F3EFFE] hover:text-[#1D1836]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4" />
                      <span>Tanya AI Tutor</span>
                    </div>
                    <span
                      className={`text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold ${
                        activeTab === "tutor"
                          ? "bg-[#FFF3D6] text-[#53389E]"
                          : "bg-[#FFF3D6] text-[#9A5B00] border border-[#F5B841]/40"
                      }`}
                    >
                      Suara
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian Bawah Sidebar: Siswa Aktif */}
          <div className="rounded-2xl border border-[#735CDD]/20 bg-gradient-to-br from-[#231B42] to-[#352961] p-3.5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#FFF3D6]/90 whitespace-nowrap">
                Siswa Aktif
              </p>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold text-rose-200 hover:bg-rose-500/25 hover:text-white transition-colors shrink-0"
                title="Keluar Sesi"
              >
                <LogOut className="h-3 w-3" />
                <span>Keluar</span>
              </button>
            </div>
            <StudentProfileSwitcher compact />
          </div>
        </aside>

        {/* Area Utama: Kiri (Kamera & Skema Rangkaian) | Kanan (Panduan Modul/AI Tutor & Info Perangkat) */}
        <div className="relative z-10 flex-1 grid gap-5 lg:grid-cols-12 items-start">
          {/* Kolom Kiri (5/12): Kamera Fisik & Skema Rangkaian Digital */}
          <div className="space-y-5 lg:col-span-5">
            {/* 1. Kamera & Sensor Papan Fisik */}
            <div className="rise rounded-[1.75rem] border border-[#735CDD]/18 bg-white/90 p-4 sm:p-5 shadow-[0_18px_45px_-20px_rgba(67,56,202,0.16)] backdrop-blur-xl space-y-3.5" style={{ animationDelay: ".05s" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#735CDD]/20 bg-[#F3EFFE] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#5840BA]">
                  <span className="h-2 w-2 rounded-full bg-[#735CDD]" />
                  Pemindaian Papan Taktil
                </span>
                <button
                  id="btn-lab-voice"
                  onClick={() => {
                    if ((speaking || speakingRef.current) && typeof window !== "undefined") {
                      cancelSpeech();
                      speakingRef.current = false;
                      setSpeaking(false);
                    } else {
                      speakLabIntro();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition-all shadow-2xs ${
                    speaking
                      ? "border-amber-300 bg-[#FFF3D6] text-[#9A5B00]"
                      : "border-[#735CDD]/25 bg-white text-[#5840BA] hover:bg-[#F3EFFE]"
                  }`}
                  title="Dengarkan kembali penjelasan ruang kerja"
                >
                  <Volume2 className={`h-3.5 w-3.5 ${speaking ? "text-[#D97706] animate-pulse" : "text-[#735CDD]"}`} />
                  {speaking ? "Hentikan Suara" : "Dengarkan Arahan Lab"}
                </button>
              </div>

              <div>
                <h1 className="font-heading text-xl font-extrabold leading-tight text-[#1D1836] sm:text-2xl">
                  Kamera & Sensor Papan Fisik
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-[#4A4458]">
                  Menampilkan pemindaian balok komponen secara langsung dari kamera bawah papan LENTERA.
                </p>
              </div>

              {/* ArUcoDetector (yang sudah support Grid 5x5 + Input IP) */}
              <ArUcoDetector />
            </div>

            {/* 2. Skema Rangkaian Listrik (Proporsional tepat di bawah Kamera) */}
            <div className="rise rounded-[1.75rem] border border-[#735CDD]/18 bg-white/90 p-4 sm:p-5 shadow-[0_18px_45px_-20px_rgba(67,56,202,0.18)] backdrop-blur-xl" style={{ animationDelay: ".08s" }}>
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#5840BA]">
                    Visualisasi Aliran Arus
                  </p>
                  <h2 className="font-heading text-base sm:text-lg font-extrabold text-[#1D1836]">
                    Skema Rangkaian Listrik
                  </h2>
                </div>
                <div className="flex gap-1 rounded-xl border border-[#735CDD]/15 bg-[#F3EFFE]/80 p-1">
                  <button
                    onClick={() => setDiagramMode("live")}
                    className={`px-2.5 py-1 text-[10.5px] font-extrabold rounded-lg transition-all ${
                      diagramMode === "live"
                        ? "bg-[#735CDD] text-white shadow-xs"
                        : "text-[#5E548E] hover:text-[#1D1836]"
                    }`}
                  >
                    LANGSUNG
                  </button>
                  <button
                    onClick={() => setDiagramMode("series")}
                    className={`px-2.5 py-1 text-[10.5px] font-extrabold rounded-lg transition-all ${
                      diagramMode === "series"
                        ? "bg-[#735CDD] text-white shadow-xs"
                        : "text-[#5E548E] hover:text-[#1D1836]"
                    }`}
                  >
                    SERI
                  </button>
                  <button
                    onClick={() => setDiagramMode("parallel")}
                    className={`px-2.5 py-1 text-[10.5px] font-extrabold rounded-lg transition-all ${
                      diagramMode === "parallel"
                        ? "bg-[#735CDD] text-white shadow-xs"
                        : "text-[#5E548E] hover:text-[#1D1836]"
                    }`}
                  >
                    PARALEL
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2E2559] bg-[#0B1021] p-3 flex items-center justify-center shadow-inner">
                <div className="w-full max-w-[290px] mx-auto">
                  <CircuitDiagram variant={diagramMode} />
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan (7/12): Panduan Modul / AI Tutor (Langsung di Atas) & Arsitektur Perangkat */}
          <div className="rise space-y-5 lg:col-span-7" style={{ animationDelay: ".1s" }}>
            {/* 1. Panel Utama: Panduan Modul Belajar atau Tanya AI Tutor */}
            {activeTab === "guide" ? (
              <VoiceGuide />
            ) : (
              <AITutorLab onBack={() => setActiveTab("guide")} />
            )}

            {/* 2. Ringkasan Sistem Perangkat LENTERA Edge (Grid 3 Kolom Sejajar di Bawah Panduan) */}
            <div className="rounded-[1.75rem] border border-[#735CDD]/16 bg-white/88 p-4 sm:p-5 shadow-[0_14px_34px_-16px_rgba(67,56,202,0.14)] backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#5840BA]">
                  Arsitektur Sistem LENTERA Edge
                </p>
                <span className="rounded-full bg-[#F3EFFE] border border-[#735CDD]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#5840BA]">
                  Grid 5×5 Aktif
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {wiringPoints.map((item) => (
                  <article
                    key={item.title}
                    className="flex flex-col justify-between rounded-2xl border border-[#735CDD]/12 bg-[#FAF9FF] p-3.5 transition-all hover:border-[#735CDD]/30 hover:bg-white hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex-shrink-0 rounded-lg bg-[#F3EFFE] p-2 border border-[#735CDD]/15">
                          {item.icon}
                        </div>
                        <h3 className="font-heading text-xs font-extrabold text-[#1D1836] leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#4A4458]">
                        {item.text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
