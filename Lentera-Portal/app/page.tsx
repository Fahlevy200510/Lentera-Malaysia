"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  LayoutDashboard,
  Menu,
  ScanEye,
  Volume2,
  X,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  resolveEndpoints,
  getActiveLenteraEndpoint,
} from "@/components/aruco/ArUcoDetector";
import StudentProfileSwitcher from "@/components/StudentProfileSwitcher";
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
    accent: "#735CDD",
    accentSoft: "#EAE4FC",
    Icon: LayoutDashboard,
  },
  {
    href: "/aruco",
    title: "LENTERA Lab",
    tagline: "Deteksi Rangkaian Real-time",
    description:
      "Hubungkan kamera, deteksi komponen, dan pantau status rangkaian dari satu ruang kerja.",
    accent: "#B45309",
    accentSoft: "#FFF3D6",
    Icon: ScanEye,
  },
];

function LenteraHeroEmblem({ wsConnected }: { wsConnected: boolean }) {
  return (
    <div className="relative w-full max-w-[510px] mx-auto">
      {/* Soft warm lantern back-glow behind the main card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 rounded-[44px] opacity-75 blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(245, 184, 65, 0.30), rgba(115, 92, 221, 0.25) 60%, transparent 80%)",
        }}
      />

      {/* Main Architectural Stage in Logo Periwinkle (#735CDD -> #5B43C6) */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-b from-[#7862E2] via-[#735CDD] to-[#5B43C6] p-7 sm:p-9 text-white border-2 border-white/30 shadow-[0_28px_70px_-18px_rgba(73,51,168,0.55)]">
        {/* Subtle 5x5 Acrylic Board Blueprint Grid Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "radial-gradient(circle at 50% 45%, black 35%, transparent 85%)",
          }}
        />

        {/* Warm Lantern Radial Core Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 243, 214, 0.42) 0%, rgba(245, 184, 65, 0.16) 45%, transparent 72%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Top Header inside Visual Card */}
          <div className="w-full flex items-center justify-between gap-2 pb-4 border-b border-white/15">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1E1938]/25 px-3.5 py-1.5 text-xs font-semibold text-[#FFF3D6] border border-white/15">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    wsConnected ? "bg-emerald-300" : "bg-[#F5B841]"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    wsConnected ? "bg-emerald-400" : "bg-[#F5B841]"
                  }`}
                />
              </span>
              <span>
                {wsConnected
                  ? "Terhubung ke Papan Eksperimen"
                  : "Papan Eksperimen Taktil"}
              </span>
            </div>

            <span className="rounded-full bg-[#FFF3D6] px-3 py-1 text-xs font-bold text-[#1E1938] shadow-xs">
              Braille & Suara
            </span>
          </div>

          {/* Centerpiece: Animated Circuit Traces + Winged Lantern Logo */}
          <div className="my-8 sm:my-10 relative w-full flex items-center justify-center min-h-[265px] sm:min-h-[285px]">
            {/* Animated SVG Circuit Traces connecting the 4 nodes to the Lantern Core */}
            <svg
              viewBox="0 0 420 280"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <circle
                cx="210"
                cy="140"
                r="118"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
              />
              <circle
                cx="210"
                cy="140"
                r="90"
                stroke="rgba(255,243,214,0.32)"
                strokeWidth="1.5"
              />
              <path
                d="M95 55 L155 100 M325 55 L265 100 M95 225 L155 180 M325 225 L265 180"
                stroke="#FFF3D6"
                strokeWidth="2"
                strokeLinecap="round"
                className="circuit-trace-anim"
              />
            </svg>

            {/* Pulsing Warm Lantern Halo + Crisp Logo Squircle */}
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="lantern-halo-ring h-48 w-48 sm:h-52 sm:w-52 rounded-full border border-[#FFF3D6]/40 bg-[#FFF3D6]/10 flex items-center justify-center"
              >
                <div className="h-36 w-36 sm:h-40 sm:w-40 rounded-full border-2 border-[#FFF3D6]/70 bg-[#FFF3D6]/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,243,214,0.35)]">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-[28px] bg-[#735CDD] border-[3px] border-[#FFF3D6] shadow-[0_14px_34px_rgba(30,25,56,0.38)]">
                    <img
                      src="/logo-lentera.png"
                      alt="Logo LENTERA"
                      width={132}
                      height={132}
                      className="h-full w-full object-cover scale-[1.34]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Floating Pillar Badges with Natural Formal Copy */}
            <div className="float-badge-1 absolute top-0 left-0 sm:left-1 rounded-2xl bg-[#FAF8F4] px-3.5 py-2.5 text-[#1E1938] shadow-lg border-2 border-[#EAE4FC]">
              <div className="text-[10px] font-bold text-[#735CDD]">
                Media Raba
              </div>
              <div className="mt-0.5 text-xs font-extrabold text-[#1E1938]">
                Balok & Huruf Braille
              </div>
            </div>

            <div className="float-badge-2 absolute top-0 right-0 sm:right-1 rounded-2xl bg-[#FAF8F4] px-3.5 py-2.5 text-[#1E1938] shadow-lg border-2 border-[#EAE4FC]">
              <div className="text-[10px] font-bold text-[#735CDD]">
                Pemindaian Otomatis
              </div>
              <div className="mt-0.5 text-xs font-extrabold text-[#1E1938]">
                Sensor Kamera Bawah
              </div>
            </div>

            <div className="float-badge-3 absolute bottom-0 left-0 sm:left-1 rounded-2xl bg-[#FFF3D6] px-3.5 py-2.5 text-[#1E1938] shadow-lg border-2 border-[#F5B841]">
              <div className="text-[10px] font-bold text-[#92400E]">
                Umpan Balik Langsung
              </div>
              <div className="mt-0.5 text-xs font-extrabold text-[#1E1938]">
                Panduan Suara
              </div>
            </div>

            <div className="float-badge-4 absolute bottom-0 right-0 sm:right-1 rounded-2xl bg-[#FFF3D6] px-3.5 py-2.5 text-[#1E1938] shadow-lg border-2 border-[#F5B841]">
              <div className="text-[10px] font-bold text-[#92400E]">
                Pendamping Belajar
              </div>
              <div className="mt-0.5 text-xs font-extrabold text-[#1E1938]">
                Asisten AI Tutor
              </div>
            </div>
          </div>

          {/* Clean Bottom Tagline */}
          <div className="w-full rounded-2xl bg-[#1E1938]/25 border border-white/15 px-4 py-3 text-center">
            <div className="text-xs sm:text-[13px] font-semibold text-[#FFF3D6]">
              Merangkai listrik secara mandiri melalui sentuhan dan suara
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalHome() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [session, setSession] = useState<{ name: string; role: string } | null>(
    null
  );
  const [ready, setReady] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const hasSpokenOnFirstClickRef = useRef(false);
  const speakingRef = useRef(false);
  const isRedirectingRef = useRef(false);

  // Typewriter effect state
  const [typedWord, setTypedWord] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Typewriter ticker effect: smooth, relaxed, and natural cadence
  useEffect(() => {
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
        timer = setTimeout(() => {
          setTypedWord(currentWord.slice(0, typedWord.length + 1));
        }, 110);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3000);
      }
    } else {
      if (typedWord.length > 0) {
        timer = setTimeout(() => {
          setTypedWord(currentWord.slice(0, typedWord.length - 1));
        }, 55);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
        }, 600);
      }
    }

    return () => clearTimeout(timer);
  }, [typedWord, isDeleting, wordIndex, hasStarted]);

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
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          onVoicesChanged
        );
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
  useEffect(() => {
    const handleFirstInteraction = (e: MouseEvent | TouchEvent) => {
      if (hasSpokenOnFirstClickRef.current) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest("#btn-voice-guide")) {
        return;
      }

      hasSpokenOnFirstClickRef.current = true;

      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);

      readIntro();
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, {
      passive: true,
    });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      if (
        !isRedirectingRef.current &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
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
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = () => {
      if (cancelled || redirected) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        if (!cancelled && !redirected) {
          initBackgroundWS();
        }
      }, 3000);
    };

    async function initBackgroundWS() {
      const endpoint = await getActiveLenteraEndpoint();
      if (cancelled || redirected) return;

      const { wsUrl } = resolveEndpoints(endpoint);
      console.log("[LENTERA Auto-Redirect WS] Menghubungkan ke:", wsUrl);

      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          console.log("[LENTERA Auto-Redirect WS] Terhubung ke papan fisik!");
          setWsConnected(true);
        };
        ws.onclose = () => {
          setWsConnected(false);
          scheduleReconnect();
        };
        ws.onerror = () => {
          setWsConnected(false);
          try {
            ws?.close();
          } catch {}
        };
        const STUDENT_TOKENS: Record<
          string,
          { id: string; name: string; grade: string; avatar: string }
        > = {
          student_via: {
            id: "via",
            name: "Via",
            grade: "Kelas 11 SMA",
            avatar: "via",
          },
          student_amira: {
            id: "amira",
            name: "Amira",
            grade: "Kelas 11 SMA",
            avatar: "amira",
          },
          student_ajib: {
            id: "ajib",
            name: "Ajib",
            grade: "Kelas 11 SMA",
            avatar: "ajib",
          },
          "35": {
            id: "via",
            name: "Via",
            grade: "Kelas 11 SMA",
            avatar: "via",
          },
          "36": {
            id: "amira",
            name: "Amira",
            grade: "Kelas 11 SMA",
            avatar: "amira",
          },
          "37": {
            id: "ajib",
            name: "Ajib",
            grade: "Kelas 11 SMA",
            avatar: "ajib",
          },
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
              let detectedStudentCell: string | null = null;
              let detectedStudentMeta: {
                id: string;
                name: string;
                grade: string;
                avatar: string;
              } | null = null;

              for (const [cellName, cellData] of Object.entries(data.cells)) {
                if (cellData && typeof cellData === "object") {
                  const cd = cellData as { component?: string; id?: number };
                  const compKey = cd.component || "";
                  const idKey = String(cd.id ?? "");
                  if (STUDENT_TOKENS[compKey] || STUDENT_TOKENS[idKey]) {
                    detectedStudentCell = cellName;
                    detectedStudentMeta =
                      STUDENT_TOKENS[compKey] || STUDENT_TOKENS[idKey];
                    break;
                  }
                }
              }

              const placed = Object.values(data.cells).filter(
                Boolean
              ) as Array<{
                component: string;
                rotation: number;
                id?: number;
              }>;

              if (detectedStudentMeta || placed.length > 0) {
                redirected = true;
                isRedirectingRef.current = true;

                let speechText = "";
                if (detectedStudentMeta && detectedStudentCell) {
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
        setWsConnected(false);
        scheduleReconnect();
      }
    }

    initBackgroundWS();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [router]);

  const roleLabel =
    session?.role === "student"
      ? "Siswa"
      : session?.role === "teacher"
      ? "Guru"
      : "Orang Tua";

  return (
    <main className="portal-page relative min-h-screen overflow-hidden font-body text-[#1E1938] print:bg-white print:min-h-0 print:p-0">
      {/* Subtle Tactile Coordinate Matrix Watermark */}
      <div
        className="portal-tactile-dots pointer-events-none absolute inset-0 z-0 print:hidden"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10 print:hidden border-b border-[#1E1938]/10 bg-[#FAF8F4]/80 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-3.5 group"
          aria-label="Beranda LENTERA"
        >
          <div className="h-11 w-11 overflow-hidden rounded-[15px] bg-[#735CDD] shrink-0 border-2 border-[#5B43C6] shadow-md shadow-[#735CDD]/20 transition-transform group-hover:scale-105">
            <img
              src="/logo-lentera.png"
              alt="Logo LENTERA"
              width={44}
              height={44}
              className="h-full w-full object-cover scale-[1.34]"
            />
          </div>
          <div>
            <div className="font-heading text-lg font-extrabold tracking-tight text-[#1E1938]">
              LENTERA
            </div>
            <div className="hidden sm:block text-[10px] font-bold tracking-[0.22em] text-[#735CDD]">
              SENTUH · PAHAMI · BELAJAR MANDIRI
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <StudentProfileSwitcher />

          {ready && session ? (
            <button
              onClick={logout}
              className="portal-ghost-btn text-rose-600 hover:text-rose-700"
              title="Keluar dari akun"
            >
              Keluar
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#735CDD] hover:bg-[#5B43C6] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
            >
              Masuk / Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            onClick={() => setOpen(true)}
            className="portal-menu-btn"
            aria-label="Buka menu navigasi"
          >
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

      {/* Main Single-Screen Hero Section */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-8 lg:gap-12 px-5 pb-12 pt-6 sm:pt-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-14 print:hidden">
        <div className="rise max-w-2xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#735CDD]/25 bg-white px-4 py-1.5 text-xs font-bold text-[#5B43C6] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#735CDD]" />
            <span>Media Pembelajaran Sains Inklusif</span>
          </div>

          <h1
            className="mt-5 font-heading text-4xl sm:text-5xl lg:text-[3.55rem] font-extrabold leading-[1.12] tracking-tight text-[#1E1938]"
            aria-label="Belajar sains melalui sentuhan dan suara."
          >
            <span className="block">Belajar sains melalui</span>
            <span className="mt-2 inline-flex items-center rounded-2xl bg-[#EAE4FC]/85 border-2 border-[#735CDD]/25 px-4 py-1 text-[#735CDD] min-h-[1.3em] shadow-xs">
              <span>{typedWord}</span>
              <span
                className="inline-block w-[4px] h-[0.78em] ml-2 bg-[#F5B841] rounded-sm animate-pulse align-middle"
                aria-hidden="true"
              />
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#5A5376]">
            LENTERA memadukan papan eksperimen taktil, pemindaian kamera cerdas,
            dan panduan suara interaktif agar siswa tunanetra maupun low vision
            dapat mempelajari rangkaian listrik secara mandiri dan aman.
          </p>

          <div className="mt-7 space-y-3.5">
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
                <LayoutDashboard className="h-5 w-5 text-[#735CDD]" /> Buka
                LENTERA Learn
              </Link>
              <button
                id="btn-voice-guide"
                onClick={readIntro}
                className={`portal-secondary-btn text-base py-3.5 px-5 flex items-center justify-center gap-2 ${
                  speaking
                    ? "!border-[#F5B841] !bg-[#FFF3D6] !text-[#1E1938]"
                    : ""
                }`}
                aria-label={
                  speaking
                    ? "Matikan panduan suara"
                    : "Dengarkan panduan suara"
                }
              >
                <Volume2 className="h-4 w-4 text-[#D97706]" />
                <span>{speaking ? "Matikan Suara" : "Dengarkan Panduan"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#735CDD]/20 bg-white/90 px-4 py-3 text-xs sm:text-[13px] text-[#1E1938] shadow-xs">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    wsConnected ? "bg-emerald-500" : "bg-[#735CDD]"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    wsConnected ? "bg-emerald-600" : "bg-[#735CDD]"
                  }`}
                />
              </span>
              <span>
                <strong>Mulai Langsung dari Papan:</strong> Letakkan kartu siswa
                atau balok komponen di atas papan fisik untuk langsung membuka
                ruang praktik.
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-[#1E1938]/10 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-2xl bg-white p-4 border border-[#1E1938]/10 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Eksplorasi Raba
                </div>
                <div className="mt-1 text-sm font-extrabold text-[#1E1938]">
                  Balok Taktil & Huruf Braille
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-[#1E1938]/10 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Deteksi Otomatis
                </div>
                <div className="mt-1 text-sm font-extrabold text-[#1E1938]">
                  Sensor Kamera ArUco
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-[#1E1938]/10 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
                  Pendamping Suara
                </div>
                <div className="mt-1 text-sm font-extrabold text-[#1E1938]">
                  Panduan Audio Interaktif
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Showcase Stage */}
        <div
          className="relative rise lg:pl-6 flex items-center justify-center w-full"
          style={{ animationDelay: ".12s" }}
        >
          <LenteraHeroEmblem wsConnected={wsConnected} />
        </div>
      </section>

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#1E1938]/45 backdrop-blur-xs transition-opacity duration-300 print:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="portal-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu portal LENTERA"
        className={`fixed inset-y-0 right-0 z-50 flex w-[90vw] max-w-md flex-col border-l-2 border-[#735CDD]/20 bg-[#FAF8F4] p-6 shadow-2xl transition-transform duration-500 print:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl bg-[#735CDD] shrink-0 border border-[#5B43C6]">
              <img
                src="/logo-lentera.png"
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover scale-[1.34]"
              />
            </div>
            <div>
              <div className="font-heading font-extrabold text-[#1E1938]">
                LENTERA
              </div>
              <div className="text-[10px] font-bold tracking-[.2em] text-[#735CDD]">
                EKOSISTEM
              </div>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="portal-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#5A5376]">
          Pilih ruang kerja yang ingin kamu gunakan.
        </p>

        <nav className="mt-7 grid gap-3">
          {destinations.map((d) => {
            const targetHref = session
              ? d.href
              : `/login?redirect=${encodeURIComponent(d.href)}`;
            return (
              <Link
                key={d.href}
                href={targetHref}
                onClick={() => setOpen(false)}
                className="portal-destination group"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                  style={{ background: d.accentSoft, color: d.accent }}
                >
                  <d.Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-heading text-[15px] font-bold text-[#1E1938]">
                      {d.title}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#5A5376] transition group-hover:translate-x-0.5 group-hover:text-[#735CDD]" />
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#735CDD]">
                    {d.tagline}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-5 text-[#5A5376]">
                    {d.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {session ? (
            <div className="rounded-2xl border border-[#1E1938]/12 bg-white p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1E1938] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#735CDD] shrink-0" />
                  <span>{session.name}</span>
                </div>
                <div className="text-[10px] text-[#5A5376] font-semibold uppercase">
                  {roleLabel}
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#735CDD] hover:bg-[#5B43C6] p-3.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              Masuk / Login Sekarang
            </Link>
          )}

          <div className="rounded-2xl border border-[#735CDD]/20 bg-[#EAE4FC] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#5B43C6]" />
              <div>
                <div className="text-sm font-bold text-[#1E1938]">
                  Dirancang untuk aksesibilitas
                </div>
                <div className="mt-1 text-xs leading-5 text-[#5A5376]">
                  Dukungan suara, keyboard, Braille, dan pembelajaran taktil.
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
