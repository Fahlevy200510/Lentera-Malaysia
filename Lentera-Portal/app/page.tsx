"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowUpRight, CircuitBoard, LayoutDashboard,
  Menu, ScanEye, Sparkles, Volume2, X, CheckCircle2, ShieldCheck, FileText, User,
} from "lucide-react";
import { resolveEndpoints, getActiveLenteraEndpoint } from "@/components/aruco/ArUcoDetector";
import StudentProfileSwitcher from "@/components/StudentProfileSwitcher";
import StudentReportModal from "@/components/StudentReportModal";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";
import { getActiveStudent, setActiveStudent } from "@/utils/progress";
import { speakNarration, cancelSpeech } from "@/utils/audioCoordinator";

const TYPEWRITER_WORDS = [
  "sentuhan dan suara.",
  "papan taktil cerdas.",
  "eksplorasi mandiri.",
  "sensor AI interaktif.",
];

type Destination = {
  href: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  accentSoft: string;
  Icon: typeof LayoutDashboard;
};

const destinations: Destination[] = [
  {
    href: "/dashboard",
    title: "LENTERA Learn",
    tagline: "Dashboard Pembelajaran Adaptif",
    description:
      "Pemetaan keterampilan, jalur belajar adaptif, AI Tutor, dan Analitik Pembelajaran untuk siswa, guru, dan orang tua.",
    accent: "#A78BFA",
    accentSoft: "rgba(167,139,250,.14)",
    Icon: LayoutDashboard,
  },
  {
    href: "/aruco",
    title: "LENTERA Lab",
    tagline: "Deteksi Rangkaian Real-time",
    description:
      "Hubungkan kamera, deteksi komponen, dan pantau status rangkaian dari satu ruang kerja.",
    accent: "#67E8F9",
    accentSoft: "rgba(103,232,249,.12)",
    Icon: ScanEye,
  },
];

export default function PortalHome() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [session, setSession] = useState<{ name: string; role: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const hasSpokenOnFirstClickRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakingRef = useRef(false);
  const isRedirectingRef = useRef(false);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  // Typewriter effect state
  const [typedWord, setTypedWord] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Typewriter ticker effect: smooth, relaxed, and natural cadence
  useEffect(() => {
    // Initial pause on fresh load (350ms) so hero transition settles before typing
    if (!hasStarted) {
      const initTimer = setTimeout(() => {
        setHasStarted(true);
      }, 350);
      return () => clearTimeout(initTimer);
    }

    const currentWord = TYPEWRITER_WORDS[wordIndex % TYPEWRITER_WORDS.length];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (typedWord.length < currentWord.length) {
        // Human typing pace (110ms per letter)
        timer = setTimeout(() => {
          setTypedWord(currentWord.slice(0, typedWord.length + 1));
        }, 110);
      } else {
        // Ample reading pause (3.0s) for completed phrase
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3000);
      }
    } else {
      if (typedWord.length > 0) {
        // Smooth backspacing (55ms per letter)
        timer = setTimeout(() => {
          setTypedWord(currentWord.slice(0, typedWord.length - 1));
        }, 55);
      } else {
        // Calm pause with blinking cursor (600ms) before typing the next phrase
        timer = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
        }, 600);
      }
    }

    return () => clearTimeout(timer);
  }, [typedWord, isDeleting, wordIndex, hasStarted]);

  const handleVisualMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: Number((x * 12).toFixed(2)), y: Number((-y * 12).toFixed(2)) });
  }, []);

  const handleVisualMouseLeave = useCallback(() => {
    setMouseTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lentera-session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && parsed?.role) {
          setSession(parsed);
        }
      }
    } catch {
      setSession(null);
    } finally {
      setReady(true);
    }

    const handleAuth = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSession(detail || null);
    };
    window.addEventListener("lentera-auth-update", handleAuth);
    window.addEventListener("storage", () => {
      try {
        const s = localStorage.getItem("lentera-session");
        setSession(s ? JSON.parse(s) : null);
      } catch {
        setSession(null);
      }
    });
    return () => {
      window.removeEventListener("lentera-auth-update", handleAuth);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("lentera-session");
    setSession(null);
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) menuBtnRef.current?.focus();
  }, [open]);

  // Pre-load daftar voice browser agar suara bahasa Indonesia langsung siap
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

  const readIntro = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingRef.current || (window as any).__lenteraSpeaking) {
      cancelSpeech();
      speakingRef.current = false;
      setSpeaking(false);
      return;
    }

    const text =
      "Selamat datang di LENTERA — Papan Belajar Rangkaian Listrik Taktil dan Interaktif untuk Siswa Tunanetra. Sistem ini menghubungkan balok fisik di tangan Anda dengan sensor pintar di bawah papan untuk memberikan umpan balik suara seketika. Untuk memulai, Anda dapat meletakkan kartu identitas siswa di atas papan fisik, atau memilih tombol LENTERA Lab di layar. Selamat bereksplorasi!";

    speakingRef.current = true;
    setSpeaking(true);

    speakNarration(text, {
      rate: 0.94,
      pitch: 1.0,
      tag: "landing-intro",
      onEnd: () => {
        speakingRef.current = false;
        setSpeaking(false);
      },
    });
  }, []);

  // Autoplay intro HANYA SEKALI pada sentuhan/klik pertama di area mana pun di landing page
  // Tidak looping saat tetap berada di halaman (dijaga oleh ref & pelepasan listener)
  useEffect(() => {
    const handleFirstInteraction = (e: MouseEvent | TouchEvent) => {
      if (hasSpokenOnFirstClickRef.current) return;

      const target = e.target as HTMLElement | null;
      // Jika pengguna menekan tombol Dengarkan Panduan langsung, biarkan onClick tombol yang menangani
      if (target && target.closest("#btn-voice-guide")) {
        return;
      }

      hasSpokenOnFirstClickRef.current = true;

      // Hapus listener segera agar tidak berputar ulang saat klik berikutnya
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);

      readIntro();
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      if (!isRedirectingRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [readIntro]);

  // Background WebSocket: Auto-redirect ke /aruco (LENTERA Lab) jika ada balok diletakkan di papan
  useEffect(() => {
    router.prefetch("/aruco");
    let ws: WebSocket | null = null;
    let redirected = false;
    let cancelled = false;

    async function initBackgroundWS() {
      const endpoint = await getActiveLenteraEndpoint();
      if (cancelled) return;

      const { wsUrl } = resolveEndpoints(endpoint);
      console.log("[LENTERA Auto-Redirect WS] Menghubungkan ke:", wsUrl);

      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          console.log("[LENTERA Auto-Redirect WS] Terhubung ke papan fisik!");
        };
        const STUDENT_TOKENS: Record<string, { id: string; name: string; grade: string; avatar: string }> = {
          student_via: { id: "via", name: "Via", grade: "Kelas 11 SMA", avatar: "via" },
          student_amira: { id: "amira", name: "Amira", grade: "Kelas 11 SMA", avatar: "amira" },
          student_ajib: { id: "ajib", name: "Ajib", grade: "Kelas 11 SMA", avatar: "ajib" },
          "35": { id: "via", name: "Via", grade: "Kelas 11 SMA", avatar: "via" },
          "36": { id: "amira", name: "Amira", grade: "Kelas 11 SMA", avatar: "amira" },
          "37": { id: "ajib", name: "Ajib", grade: "Kelas 11 SMA", avatar: "ajib" },
        };

        const COMPONENT_LABEL: Record<string, string> = {
          battery: "Baterai",
          lamp: "Lampu",
          switch: "Saklar",
          straight_cable: "Kabel lurus",
          l_cable: "Kabel sudut",
          t_cable: "Kabel cabang T",
          student_via: "Kartu Identitas Via",
          student_amira: "Kartu Identitas Amira",
          student_ajib: "Kartu Identitas Ajib",
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "grid_state" && data.cells && !redirected) {
              // Cari apakah ada sel fisik (A1 s.d. E5) yang dimasuki kartu identitas siswa
              let detectedStudentCell: string | null = null;
              let detectedStudentMeta: { id: string; name: string; grade: string; avatar: string } | null = null;

              for (const [cellName, cellData] of Object.entries(data.cells)) {
                if (cellData && typeof cellData === "object") {
                  const cd = cellData as { component?: string; id?: number };
                  const compKey = cd.component || "";
                  const idKey = String(cd.id ?? "");
                  if (STUDENT_TOKENS[compKey] || STUDENT_TOKENS[idKey]) {
                    detectedStudentCell = cellName;
                    detectedStudentMeta = STUDENT_TOKENS[compKey] || STUDENT_TOKENS[idKey];
                    break;
                  }
                }
              }

              const placed = (Object.values(data.cells).filter(Boolean) as Array<{
                component: string;
                rotation: number;
                id?: number;
              }>);

              if (detectedStudentMeta || placed.length > 0) {
                redirected = true;
                isRedirectingRef.current = true;

                let speechText = "";
                if (detectedStudentMeta && detectedStudentCell) {
                  // Otomatis aktifkan profil siswa yang meletakkan kartu identitas
                  setActiveStudent({
                    id: detectedStudentMeta.id,
                    name: detectedStudentMeta.name,
                    grade: detectedStudentMeta.grade,
                    avatar: detectedStudentMeta.avatar,
                  });
                  localStorage.setItem(
                    "lentera-session",
                    JSON.stringify({
                      name: detectedStudentMeta.name,
                      role: "student",
                      grade: detectedStudentMeta.grade,
                    })
                  );
                  speechText = `Selamat datang, ${detectedStudentMeta.name}! Kartu identitasmu terdeteksi di sel ${detectedStudentCell}. Membuka LENTERA Lab.`;
                } else {
                  // Fallback jika pengguna meletakkan komponen fisik sirkuit biasa
                  const comp = placed[0]?.component;
                  const label = COMPONENT_LABEL[comp] || "komponen";
                  const activeStudent = getActiveStudent();
                  speechText = `Balok ${label} terdeteksi! Melanjutkan sesi untuk ${activeStudent.name}. Membuka LENTERA Lab.`;
                }

                const navigateToLab = () => {
                  router.push("/aruco");
                };

                const navTimer = setTimeout(navigateToLab, 4500);
                speakNarration(speechText, {
                  rate: 0.95,
                  pitch: 1.05,
                  tag: "landing-redirect",
                  onEnd: () => {
                    clearTimeout(navTimer);
                    setTimeout(navigateToLab, 300);
                  },
                });
              }
            }
          } catch {}
        };
      } catch (err) {
        console.warn("[LENTERA Auto-Redirect WS] Gagal terhubung:", err);
      }
    }

    initBackgroundWS();

    return () => {
      cancelled = true;
      if (ws) ws.close();
    };
  }, [router]);


  const roleLabel = session?.role === "student" ? "Siswa" : session?.role === "teacher" ? "Guru" : "Orang Tua";

  return (
    <main className="portal-page relative min-h-screen overflow-hidden font-body text-white print:bg-white print:min-h-0 print:p-0">
      <div className="portal-bg print:hidden" aria-hidden="true">
        <div className="portal-orb portal-orb-a" />
        <div className="portal-orb portal-orb-b" />
        <div className="portal-orb portal-orb-c" />
        <div className="portal-grid" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10 print:hidden">
        <Link href="/" className="flex items-center gap-3" aria-label="Beranda LENTERA">
          <img
            src="/logo-lentera.png"
            alt="Logo LENTERA"
            width={44}
            height={44}
            style={{ width: 44, height: 44, maxWidth: "100%", flexShrink: 0 }}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover shadow-lg"
          />
          <div>
            <div className="font-heading text-lg font-extrabold tracking-tight text-white">LENTERA</div>
            <div className="hidden sm:block text-[10px] font-semibold tracking-[0.24em] text-violet-200">SENTUH · PAHAMI · BELAJAR MANDIRI</div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <StudentProfileSwitcher />

          <button
            onClick={() => setShowReport(true)}
            className="portal-ghost-btn text-violet-300 hover:text-white"
            title="Cetak Raport Belajar Siswa"
          >
            <FileText className="h-4 w-4 text-violet-400" />
            <span className="hidden lg:inline">Raport Siswa</span>
          </button>

          {ready && session ? (
            <button
              onClick={logout}
              className="portal-ghost-btn text-rose-300 hover:text-rose-200"
              title="Keluar dari akun"
            >
              Keluar
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition active:scale-95"
            >
              Masuk / Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button onClick={() => setOpen(true)} className="portal-menu-btn" aria-label="Buka menu navigasi">
            <Menu className="h-4 w-4" />
            Menu
          </button>
        </div>

        <button
          ref={menuBtnRef}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="portal-sidebar"
          aria-label="Buka menu portal"
          className="portal-menu-btn md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-8 lg:gap-12 px-5 pb-14 pt-4 sm:pt-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-20 print:hidden">
        <div className="rise max-w-2xl">
          <h1
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.14] tracking-tight text-white"
            aria-label="Belajar sains melalui sentuhan dan suara."
          >
            <span className="block">Belajar sains melalui</span>
            <span className="block text-amber-300 min-h-[1.25em] mt-1 sm:mt-1.5">
              <span>{typedWord}</span>
              <span
                className="inline-block w-[3.5px] h-[0.78em] ml-2 bg-amber-400 rounded-sm animate-pulse align-middle"
                aria-hidden="true"
              />
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-violet-100/85">
            LENTERA menggabungkan Smart Tactile Experiment Board dengan sensor cerdas, AI Tutor, dan panduan suara agar siswa tunanetra serta low vision dapat bereksperimen listrik secara mandiri dan aman.
          </p>

          <div className="mt-8 space-y-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/aruco"
                className="portal-primary-btn text-base py-3.5 px-6 flex items-center justify-center gap-2.5"
              >
                <ScanEye className="h-5 w-5" /> Buka LENTERA Lab
              </Link>
              <Link
                href="/dashboard"
                className="portal-secondary-btn text-base py-3.5 px-6 flex items-center justify-center gap-2.5"
              >
                <LayoutDashboard className="h-5 w-5" /> Buka LENTERA Learn
              </Link>
              <button
                id="btn-voice-guide"
                onClick={readIntro}
                className="portal-secondary-btn text-base py-3.5 px-5 flex items-center justify-center gap-2"
                aria-label={speaking ? "Matikan panduan suara" : "Dengarkan panduan suara"}
              >
                <Volume2 className="h-4 w-4 text-amber-300" />
                <span>{speaking ? "Matikan Suara" : "Dengarkan Panduan"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-xs text-violet-100/90 backdrop-blur-md">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>
                <strong>Akses Taktil Mandiri:</strong> Letakkan balok di papan fisik kapan saja untuk langsung membuka Lab.
              </span>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 border-t border-white/10 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300/70">Interaksi Fisik</div>
                <div className="mt-1 text-sm font-semibold text-white">Balok Taktil & Huruf Braille 3D</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300/70">Visi Komputer</div>
                <div className="mt-1 text-sm font-semibold text-white">Sensor Kamera ArUco</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300/70">Audio Inklusif</div>
                <div className="mt-1 text-sm font-semibold text-white">Panduan Suara Interaktif</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative rise lg:pl-8" style={{ animationDelay: ".12s" }}>
          <div
            className="portal-visual transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(1000px) rotateY(${mouseTilt.x}deg) rotateX(${mouseTilt.y}deg)`,
            }}
            onMouseMove={handleVisualMouseMove}
            onMouseLeave={handleVisualMouseLeave}
            aria-label="Visualisasi pembelajaran LENTERA"
          >
            <div className="portal-visual-glow portal-visual-glow-a" />
            <div className="portal-visual-glow portal-visual-glow-b" />

            <svg
              className="portal-orbit-scene"
              viewBox="0 0 620 620"
              role="img"
              aria-label="Visualisasi interaksi sentuhan, suara, dan pembelajaran"
            >
              <defs>
                <radialGradient id="coreGradient" cx="50%" cy="45%" r="60%">
                  <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
                  <stop offset="18%" stopColor="#e9d5ff" stopOpacity=".98" />
                  <stop offset="52%" stopColor="#a78bfa" stopOpacity=".62" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd" stopOpacity=".2" />
                  <stop offset="48%" stopColor="#e9d5ff" stopOpacity=".95" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity=".35" />
                </linearGradient>
                <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="tinyGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Orbit Horizontal Belakang & Tengah */}
              <g className="portal-orbit-track">
                <ellipse cx="310" cy="310" rx="235" ry="94" fill="none" stroke="url(#orbitGradient)" strokeWidth="2.5" />
                <ellipse cx="310" cy="310" rx="235" ry="94" fill="none" stroke="#e9d5ff" strokeWidth="2" strokeDasharray="35 300" className="portal-orbit-stream-1" opacity="0.75" />
              </g>
              <g className="portal-orbit-track">
                <ellipse cx="310" cy="310" rx="228" ry="88" fill="none" stroke="url(#orbitGradient)" strokeWidth="2" />
                <ellipse cx="310" cy="310" rx="228" ry="88" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeDasharray="25 260" className="portal-orbit-stream-2" opacity="0.65" />
              </g>
              <g className="portal-orbit-track">
                <ellipse cx="310" cy="310" rx="235" ry="100" fill="none" stroke="url(#orbitGradient)" strokeWidth="2.2" />
              </g>

              {/* 2. Cincin Giroskopik Diagonal Kosmik */}
              <g className="portal-gyro-ring-a">
                <ellipse cx="310" cy="310" rx="245" ry="108" fill="none" stroke="#8b5cf6" strokeOpacity=".3" strokeWidth="1.2" />
              </g>
              <g className="portal-gyro-ring-b">
                <ellipse cx="310" cy="310" rx="242" ry="102" fill="none" stroke="#c4b5fd" strokeOpacity=".2" strokeWidth="1" strokeDasharray="8 6" />
              </g>

              {/* 3. Inti Cahaya & Gelombang Riak Pendaran (Pulsing Light Waves) */}
              <circle cx="310" cy="310" r="115" fill="url(#coreGradient)" opacity=".25" filter="url(#softGlow)" />
              <circle cx="310" cy="310" r="36" fill="none" stroke="#c4b5fd">
                <animate attributeName="r" values="36;125" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.75;0" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1.8;0.3" dur="3.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="310" cy="310" r="36" fill="none" stroke="#67e8f9">
                <animate attributeName="r" values="36;125" begin="1.9s" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" begin="1.9s" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1.5;0.2" begin="1.9s" dur="3.8s" repeatCount="indefinite" />
              </circle>

              <circle cx="310" cy="310" r="74" fill="#8b5cf6" fillOpacity=".13" stroke="#c4b5fd" strokeOpacity=".34" />
              <circle cx="310" cy="310" r="49" fill="url(#coreGradient)" filter="url(#softGlow)" />

              {/* Bintang Inti Bersinar (Breathing Star Core) */}
              <g className="portal-star-core">
                <circle cx="310" cy="310" r="22" fill="#fff7ed" opacity=".4" filter="url(#softGlow)" />
                <circle cx="310" cy="310" r="16" fill="#fff7ed" filter="url(#tinyGlow)" />
              </g>

              {/* 4. Satelit Berevolusi di Jalur Orbit */}
              <g>
                <animateMotion
                  path="M 545,310 A 235 94 0 0 1 75,310 A 235 94 0 0 1 545,310 Z"
                  dur="16s"
                  repeatCount="indefinite"
                />
                <circle r="12" fill="#c4b5fd" opacity=".3" filter="url(#softGlow)" />
                <circle r="7" fill="#e9d5ff" filter="url(#tinyGlow)" />
              </g>

              <g>
                <animateMotion
                  path="M 82,310 A 228 88 0 0 0 538,310 A 228 88 0 0 0 82,310 Z"
                  dur="13s"
                  repeatCount="indefinite"
                />
                <circle r="11" fill="#67e8f9" opacity=".35" filter="url(#softGlow)" />
                <circle r="6" fill="#67e8f9" filter="url(#tinyGlow)" />
              </g>

              <g>
                <animateMotion
                  path="M 310,210 A 235 100 0 0 1 310,410 A 235 100 0 0 1 310,210 Z"
                  dur="20s"
                  repeatCount="indefinite"
                />
                <circle r="12" fill="#f0abfc" opacity=".35" filter="url(#softGlow)" />
                <circle r="7" fill="#f0abfc" filter="url(#tinyGlow)" />
              </g>

              {/* 5. Partikel Bintang Berkedip */}
              <g className="portal-particle-field" fill="#c4b5fd">
                <circle cx="138" cy="176" r="2.5" className="star-twinkle-a" />
                <circle cx="176" cy="478" r="2" className="star-twinkle-b" />
                <circle cx="448" cy="140" r="2.5" className="star-twinkle-c" fill="#e9d5ff" />
                <circle cx="492" cy="466" r="2" className="star-twinkle-a" fill="#67e8f9" />
                <circle cx="565" cy="232" r="2.2" className="star-twinkle-b" fill="#fff" />
                <circle cx="104" cy="372" r="2" className="star-twinkle-c" fill="#f0abfc" />
              </g>
            </svg>

            <div className="portal-visual-caption">
              <span className="portal-caption-dot" />
              <span>Sentuh · Pahami · Belajar Mandiri</span>
            </div>
          </div>
        </div>

      </section>

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#100B2E]/65 backdrop-blur-sm transition-opacity duration-300 print:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="portal-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu portal LENTERA"
        className={`fixed inset-y-0 right-0 z-50 flex w-[90vw] max-w-md flex-col border-l border-white/15 bg-[#17103D]/95 p-6 shadow-2xl backdrop-blur-2xl transition-transform duration-500 print:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-lentera.png"
              alt=""
              width={36}
              height={36}
              style={{ width: 36, height: 36, maxWidth: "100%", flexShrink: 0 }}
              className="h-9 w-9 rounded-xl"
            />
            <div>
              <div className="font-heading font-extrabold text-white">LENTERA</div>
              <div className="text-[10px] tracking-[.2em] text-slate-400">EKOSISTEM</div>
            </div>
          </div>
          <button ref={closeBtnRef} onClick={() => setOpen(false)} aria-label="Tutup menu" className="portal-close-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-400">
          Pilih ruang kerja yang ingin kamu gunakan.
        </p>

        <nav className="mt-7 grid gap-3">
          {destinations.map((d) => {
            const targetHref = session ? d.href : `/login?redirect=${encodeURIComponent(d.href)}`;
            return (
              <Link
                key={d.href}
                href={targetHref}
                onClick={() => setOpen(false)}
                className="portal-destination group"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: d.accentSoft, color: d.accent }}>
                  <d.Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-heading text-[15px] font-bold text-white">{d.title}</span>
                    <ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{d.tagline}</span>
                  <span className="mt-1.5 block text-[13px] leading-5 text-slate-300">{d.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {session ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                  <span>{session.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">{roleLabel}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="text-xs text-rose-300 font-bold hover:underline"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 p-3.5 text-xs font-bold text-white shadow-md transition-all"
            >
              Masuk / Login Sekarang
            </Link>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-white">Dirancang untuk aksesibilitas</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  Dukungan suara, keyboard, Braille, dan pembelajaran taktil.
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <StudentReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </main>
  );
}
