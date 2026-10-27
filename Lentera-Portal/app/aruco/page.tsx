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
    icon: <Cpu className="h-5 w-5 text-cs-primary" />,
    title: "Lentera Edge (Raspberry Pi)",
    text: "Pusat pemrosesan lokal. Menggunakan Computer Vision untuk melacak komponen rangkaian tanpa perlu internet.",
  },
  {
    icon: <MonitorSmartphone className="h-5 w-5 text-cs-blue" />,
    title: "Modul Kamera CSI",
    text: "Mata dari sistem. Kamera mengamati papan dan memindai penanda khusus pada setiap komponen secara real-time.",
  },
  {
    icon: <Wifi className="h-5 w-5 text-cs-green" />,
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

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e?.detail === "tutor" || e?.detail === "guide") {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("lentera-switch-tab", handleSwitch);
    return () => window.removeEventListener("lentera-switch-tab", handleSwitch);
  }, []);

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
      ? `Selamat datang kembali di LENTERA Lab, ${studentName}! Papan siap digunakan. Karena kamu sudah menguasai pengenalan komponen, seluruh fitur mandiri kini terbuka untukmu. Di baris bawah papan yang paling dekat denganmu: letakkan balok di kotak A1 untuk mengulang Pengenalan Komponen, di B1 untuk Kuis Taktil, di C1 untuk Rangkaian Seri, di D1 untuk Rangkaian Paralel, dan di E1 untuk Tantangan Detektif Sirkuit. Untuk Mode Eksplorasi Bebas bersama AI Tutor, letakkan balok di sudut kiri atas kotak A5. Kamu juga bisa meletakkan kartu identitasmu di sel A1 sudut kiri bawah untuk membuka LENTERA Learn dan melihat nilaimu, atau di sudut kanan atas kotak E5 untuk keluar mengakhiri sesi. Silakan raba papan dan letakkan balok di fitur yang kamu pilih!`
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
    <main className="relative min-h-screen overflow-hidden bg-cs-bg font-body text-cs-text print:bg-white print:min-h-0 print:p-0">
      <div className="pointer-events-none absolute inset-0 -z-10 print:hidden">
        <div
          className="blob1 absolute -left-32 top-[-3rem] h-72 w-72 rounded-full blur-3xl md:h-96 md:w-96"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.16), transparent 70%)" }}
        />
        <div
          className="blob2 absolute -right-32 bottom-[-4rem] h-72 w-72 rounded-full blur-3xl md:h-96 md:w-96"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)" }}
        />
      </div>

      <section className="mx-auto flex min-h-screen max-w-screen-2xl flex-col md:flex-row gap-8 px-5 py-8 lg:px-10 lg:py-10 print:hidden">
        <div className="rise relative z-40 flex flex-col justify-between gap-8 rounded-[2rem] border border-cs-text/10 bg-white/80 p-6 shadow-[0_18px_50px_-20px_rgba(124,58,237,0.25)] backdrop-blur-xl md:w-72 md:flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 font-heading text-xl font-extrabold tracking-tight text-cs-text">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cs-primary text-white shadow-lg shadow-cs-primary/30">
                <ScanEye className="h-5 w-5" />
              </div>
              Edge Lab
            </div>
            
            <div className="mt-8 space-y-2">
              <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-cs-text/60 transition-colors hover:bg-cs-text/5 hover:text-cs-text">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-cs-text/60 transition-colors hover:bg-cs-text/5 hover:text-cs-text">
                <BookOpen className="h-4 w-4" />
                Lentera Learn
              </Link>
              <div className="pt-3 border-t border-slate-100 my-2">
                <p className="px-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Panel Interaksi Lab
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveTab("guide")}
                    className={`flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      activeTab === "guide"
                        ? "bg-cs-primary/10 text-cs-primaryDeep shadow-sm font-extrabold"
                        : "text-cs-text/60 hover:bg-cs-text/5 hover:text-cs-text"
                    }`}
                  >
                    <ScanEye className="h-4 w-4" />
                    <span>Panduan Modul</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tutor")}
                    className={`flex items-center justify-between w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      activeTab === "tutor"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/25 font-extrabold"
                        : "text-cs-text/60 hover:bg-cs-text/5 hover:text-cs-text"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4" />
                      <span>Tanya AI Tutor</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold ${
                      activeTab === "tutor" ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
                    }`}>
                      Voice
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-cs-text/50 mb-2">Siswa Sedang Belajar</p>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <StudentProfileSwitcher compact />
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  title="Keluar"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-cs-text/50">Koneksi</p>
              <div className="mt-2 flex items-center gap-2">
                <Wifi className="h-4 w-4 text-cs-green" />
                <span className="text-sm font-bold text-cs-text">Jaringan Lokal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 grid gap-8 lg:grid-cols-2">
          {/* Left: Edge Info + Detector */}
          <div className="space-y-6">
            <div className="rise space-y-4" style={{ animationDelay: ".05s" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex rounded-full border border-cs-blue/30 bg-cs-blue/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-sky-600">
                  Sinkronisasi Edge Langsung
                </p>
                <button
                  id="btn-lab-voice"
                  onClick={() => {
                    if ((speaking || speakingRef.current) && typeof window !== "undefined") {
                      window.speechSynthesis.cancel();
                      speakingRef.current = false;
                      setSpeaking(false);
                    } else {
                      speakLabIntro();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors shadow-sm"
                  title="Dengarkan kembali penjelasan ruang kerja"
                >
                  <Volume2 className="h-3.5 w-3.5 text-violet-600" />
                  {speaking ? "Hentikan Suara" : "Dengarkan Arahan Lab"}
                </button>
              </div>
              <h1 className="font-heading text-3xl font-extrabold leading-tight text-cs-text md:text-4xl">
                Status Perangkat Real-time
              </h1>
              <p className="max-w-xl text-base leading-7 text-cs-text/65">
                Dashboard ini menerima data pelacakan dan video langsung dari unit Lentera Edge melalui jaringan lokal kamu.
              </p>
            </div>

            {/* ArUcoDetector (yang sudah support Grid 5x5 + Input IP) */}
            <ArUcoDetector />

            {/* Hardware & Relay Architecture Info */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-cs-text/50">
                Arsitektur Edge Computing
              </p>
              {wiringPoints.map((item) => (
                <article
                  key={item.title}
                  className="flex gap-4 card rounded-2xl border border-cs-text/10 bg-white/80 p-4 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md"
                >
                  <div className="mt-0.5 flex-shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-100 h-fit">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-extrabold text-cs-text">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-cs-text/65">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right: Circuit Diagram & Voice Guide */}
          <div className="rise space-y-6" style={{ animationDelay: ".1s" }}>
            <div className="card rounded-[2rem] border border-cs-text/10 bg-white/80 p-5 shadow-[0_18px_50px_-20px_rgba(124,58,237,0.25)] backdrop-blur-xl md:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-cs-primaryDeep/70">
                    Diagram Langsung
                  </p>
                  <h2 className="font-heading text-xl font-extrabold text-cs-text">
                    Skema Rangkaian
                  </h2>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border">
                  <button 
                    onClick={() => setDiagramMode("live")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${diagramMode === 'live' ? 'bg-white shadow text-cs-primaryDeep' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    LANGSUNG
                  </button>
                  <button 
                    onClick={() => setDiagramMode("series")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${diagramMode === 'series' ? 'bg-white shadow text-cs-primaryDeep' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    SERI
                  </button>
                  <button 
                    onClick={() => setDiagramMode("parallel")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${diagramMode === 'parallel' ? 'bg-white shadow text-cs-primaryDeep' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    PARALEL
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0b1220] p-4 flex items-center justify-center min-h-[200px]">
                <CircuitDiagram variant={diagramMode} />
              </div>
            </div>

            {activeTab === "guide" ? (
              <VoiceGuide />
            ) : (
              <AITutorLab onBack={() => setActiveTab("guide")} />
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
