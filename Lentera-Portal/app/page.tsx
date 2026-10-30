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
  Sparkles,
  Hand,
  Cpu,
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
    <div className="relative w-full max-w-[500px] mx-auto">
      {/* Soft warm lantern back-glow behind the main card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-[48px] opacity-80 blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(245, 184, 65, 0.36), rgba(115, 92, 221, 0.30) 62%, transparent 82%)",
        }}
      />

      {/* Main Architectural Stage in Logo Periwinkle (#7862E2 -> #5B43C6) */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-b from-[#7B65E6] via-[#7159DB] to-[#5940C4] p-6 sm:p-8 text-white border-2 border-white/40 shadow-[0_30px_70px_-18px_rgba(73,51,168,0.52),inset_0_1px_1px_rgba(255,255,255,0.4)]">
        {/* Subtle 5x5 Acrylic Board Blueprint Grid Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-12"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(circle at 50% 48%, black 30%, transparent 82%)",
          }}
        />

        {/* Warm Lantern Radial Core Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 243, 214, 0.46) 0%, rgba(245, 184, 65, 0.18) 46%, transparent 72%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Top Header inside Visual Card */}
          <div className="w-full flex items-center justify-between gap-2 pb-4 border-b border-white/15">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3.5 py-1.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    wsConnected ? "bg-emerald-300" : "bg-[#FFF3D6]"
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

            <span className="rounded-full bg-[#FFF3D6] px-3.5 py-1 text-xs font-extrabold text-[#1E1938] shadow-xs">
              Braille & Suara
            </span>
          </div>

          {/* Centerpiece: Curved PCB Circuit Traces + Winged Lantern Logo */}
          <div className="my-6 sm:my-7 relative w-full flex items-center justify-center min-h-[255px] sm:min-h-[270px]">
            <svg
              viewBox="0 0 420 270"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {/* Concentric Acoustic Halo Rings */}
              <circle
                cx="210"
                cy="135"
                r="112"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth="1.25"
                strokeDasharray="5 7"
              />
              <circle
                cx="210"
                cy="135"
                r="86"
                stroke="rgba(255,243,214,0.34)"
                strokeWidth="1.5"
              />

              {/* Smooth Curved PCB Traces from Center Ring to the 4 Cards */}
              <path
                d="M148 92 C 128 72, 110 62, 85 58"
                stroke="rgba(255,243,214,0.45)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M272 92 C 292 72, 310 62, 335 58"
                stroke="rgba(255,243,214,0.45)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M148 178 C 128 198, 110 208, 85 212"
                stroke="rgba(255,243,214,0.45)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M272 178 C 292 198, 310 208, 335 212"
                stroke="rgba(255,243,214,0.45)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />

              {/* Animated Flowing Golden Pulses */}
              <path
                d="M148 92 C 128 72, 110 62, 85 58 M272 92 C 292 72, 310 62, 335 58 M148 178 C 128 198, 110 208, 85 212 M272 178 C 292 198, 310 208, 335 212"
                stroke="#FFF3D6"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="circuit-trace-anim"
              />

              {/* Glowing Terminal Nodes on the Inner Ring */}
              <circle cx="148" cy="92" r="3.5" fill="#FFF3D6" />
              <circle cx="272" cy="92" r="3.5" fill="#FFF3D6" />
              <circle cx="148" cy="178" r="3.5" fill="#FFF3D6" />
              <circle cx="272" cy="178" r="3.5" fill="#FFF3D6" />
            </svg>

            {/* Pulsing Warm Lantern Halo + Crisp Logo Squircle */}
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="lantern-halo-ring h-44 w-44 sm:h-48 sm:w-48 rounded-full border border-[#FFF3D6]/40 bg-[#FFF3D6]/10 flex items-center justify-center"
              >
                <div className="h-34 w-34 sm:h-38 sm:w-38 rounded-full border-2 border-[#FFF3D6]/70 bg-[#FFF3D6]/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,243,214,0.4)]">
                  <div className="h-26 w-26 sm:h-30 sm:w-30 overflow-hidden rounded-[26px] bg-[#735CDD] border-[3px] border-[#FFF3D6] shadow-[0_14px_34px_rgba(30,25,56,0.38)]">
                    <img
                      src="/logo-lentera.png"
                      alt="Logo LENTERA"
                      width={124}
                      height={124}
                      className="h-full w-full object-cover scale-[1.34]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Floating Pillar Badges with Icons & Natural Formal Copy */}
            <div className="float-badge-1 absolute top-0 left-0 flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 text-[#1E1938] shadow-lg border border-white">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EAE4FC] text-[#5B43C6]">
                <Hand className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[10px] font-bold text-[#735CDD] leading-tight">
                  Media Raba
                </div>
                <div className="text-xs font-extrabold text-[#1E1938]">
                  Balok & Braille
                </div>
              </div>
            </div>

            <div className="float-badge-2 absolute top-0 right-0 flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 text-[#1E1938] shadow-lg border border-white">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EAE4FC] text-[#5B43C6]">
                <ScanEye className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[10px] font-bold text-[#735CDD] leading-tight">
                  Deteksi Otomatis
                </div>
                <div className="text-xs font-extrabold text-[#1E1938]">
                  Kamera Bawah
                </div>
              </div>
            </div>

            <div className="float-badge-3 absolute bottom-0 left-0 flex items-center gap-2.5 rounded-2xl bg-[#FFF3D6] px-3.5 py-2.5 text-[#1E1938] shadow-lg border border-[#F5B841]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#F5B841]/25 text-[#92400E]">
                <Volume2 className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[10px] font-bold text-[#92400E] leading-tight">
                  Respon Langsung
                </div>
                <div className="text-xs font-extrabold text-[#1E1938]">
                  Panduan Suara
                </div>
              </div>
            </div>

            <div className="float-badge-4 absolute bottom-0 right-0 flex items-center gap-2.5 rounded-2xl bg-[#FFF3D6] px-3.5 py-2.5 text-[#1E1938] shadow-lg border border-[#F5B841]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#F5B841]/25 text-[#92400E]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[10px] font-bold text-[#92400E] leading-tight">
                  Teman Belajar
                </div>
                <div className="text-xs font-extrabold text-[#1E1938]">
                  Asisten AI Tutor
                </div>
              </div>
            </div>
          </div>

          {/* Luminous Frosted Bottom Tagline */}
          <div className="w-full rounded-2xl bg-white/14 border border-white/25 px-4 py-3 text-center backdrop-blur-md">
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
      {/* Artistic Periwinkle & Warm Lantern Lightscape Canvas */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden print:hidden"
        aria-hidden="true"
      >
        {/* Soft luminous cream-white reading halo behind the left headline */}
        <div
          className="absolute left-[4%] top-[16%] h-[420px] w-[560px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 253, 248, 0.92) 0%, rgba(255, 249, 235, 0.55) 52%, transparent 78%)",
          }}
        />
        {/* Top-center/right rich logo-periwinkle sculptural bloom */}
        <div
          className="blob1 absolute left-[42%] -top-28 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(115, 92, 221, 0.34) 0%, rgba(139, 92, 246, 0.14) 54%, transparent 76%)",
          }}
        />
        {/* Right-side warm golden lantern radiance */}
        <div
          className="blob2 absolute right-[-6%] top-[8%] h-[620px] w-[620px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 184, 65, 0.48) 0%, rgba(252, 230, 180, 0.75) 42%, transparent 74%)",
          }}
        />
        {/* Bottom-left violet-iris anchor wave */}
        <div
          className="blob3 absolute left-[12%] -bottom-40 h-[480px] w-[600px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(91, 67, 198, 0.32) 0%, rgba(196, 181, 253, 0.25) 52%, transparent 76%)",
          }}
        />

        {/* Architectural Acoustic Contours SVG (Soft, Seamless, Zero Hard Edges) */}
        <svg
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full opacity-85"
        >
          <defs>
            <linearGradient id="irisArc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#735CDD" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#F5B841" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#735CDD" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Large Concentric Acoustic & Lantern Rings behind the right showcase */}
          <g className="bg-lantern-orbit" style={{ transformOrigin: "1020px 450px" }}>
            <circle
              cx="1020"
              cy="450"
              r="340"
              stroke="url(#irisArc)"
              strokeWidth="1.75"
              strokeDasharray="10 14"
            />
            <circle
              cx="1020"
              cy="450"
              r="440"
              stroke="rgba(115, 92, 221, 0.14)"
              strokeWidth="1.5"
            />
            <circle
              cx="1020"
              cy="450"
              r="550"
              stroke="rgba(217, 119, 6, 0.14)"
              strokeWidth="1.5"
              strokeDasharray="6 18"
            />
          </g>

          {/* Flowing Topographic Tactile Waves at Bottom Left */}
          <path
            d="M-60 720 C 260 630, 520 820, 900 710 C 1180 630, 1340 740, 1500 690"
            stroke="rgba(115, 92, 221, 0.15)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M-60 780 C 280 690, 560 870, 940 760 C 1200 685, 1360 790, 1500 740"
            stroke="rgba(245, 184, 65, 0.24)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Tactile Coordinate Grid & Braille Dots Watermark */}
        <div className="portal-tactile-dots absolute inset-0" />
      </div>

      {/* Top Header — Seamless Transparent Flow (No Hard Box Cutoff) */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 pt-6 pb-3 lg:px-10 print:hidden">
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

      {/* Main Single-Screen Hero Section (Fits 100vh cleanly without vertical overflow) */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-8 lg:gap-12 px-5 pb-8 pt-2 sm:pt-4 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-10 print:hidden">
        <div className="rise max-w-2xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#735CDD]/25 bg-white/90 px-4 py-1.5 text-xs font-bold text-[#5B43C6] shadow-xs backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#735CDD]" />
            <span>Media Pembelajaran Sains Inklusif</span>
          </div>

          <h1
            className="mt-4 font-heading text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.15] tracking-tight text-[#1E1938]"
            aria-label="Belajar sains melalui sentuhan dan suara."
          >
            <span className="block">Belajar sains melalui</span>
            <span className="mt-1 sm:mt-1.5 block min-h-[1.25em] whitespace-nowrap">
              <span className="bg-gradient-to-r from-[#4527B8] via-[#6842E3] to-[#C25E00] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(255,255,255,0.95)]">
                {typedWord}
              </span>
              <span
                className="typewriter-cursor inline-block w-[3.5px] h-[0.78em] ml-2 bg-[#D97706] rounded-sm align-middle"
                aria-hidden="true"
              />
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-[#463E66] font-medium">
            LENTERA memadukan papan eksperimen taktil, pemindaian kamera cerdas,
            dan panduan suara interaktif agar siswa tunanetra maupun low vision
            dapat mempelajari rangkaian listrik secara mandiri dan aman.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/aruco"
                className="portal-primary-btn flex items-center justify-center gap-2"
              >
                <ScanEye className="h-4 w-4 sm:h-5 sm:w-5" /> Buka LENTERA Lab
              </Link>
              <Link
                href="/dashboard"
                className="portal-secondary-btn flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-[#735CDD]" />{" "}
                Buka LENTERA Learn
              </Link>
              <button
                id="btn-voice-guide"
                onClick={readIntro}
                className={`portal-secondary-btn flex items-center justify-center gap-2 ${
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

            <div className="flex items-center gap-3 rounded-2xl border border-[#735CDD]/22 bg-white/88 px-4 py-3 text-xs sm:text-[13px] text-[#1E1938] shadow-xs backdrop-blur-md">
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

          <div className="mt-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-3.5 border border-[#735CDD]/16 shadow-xs backdrop-blur-md transition-transform hover:-translate-y-0.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EAE4FC] text-[#5B43C6]">
                  <Hand className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#735CDD]">
                    Eksplorasi Raba
                  </div>
                  <div className="mt-0.5 text-xs sm:text-[13px] font-extrabold text-[#1E1938] leading-snug">
                    Balok Taktil & Braille 3D
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-3.5 border border-[#735CDD]/16 shadow-xs backdrop-blur-md transition-transform hover:-translate-y-0.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EAE4FC] text-[#5B43C6]">
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#735CDD]">
                    Deteksi Otomatis
                  </div>
                  <div className="mt-0.5 text-xs sm:text-[13px] font-extrabold text-[#1E1938] leading-snug">
                    Sensor Kamera ArUco
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-3.5 border border-[#F5B841]/40 shadow-xs backdrop-blur-md transition-transform hover:-translate-y-0.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#FFF3D6] text-[#B45309]">
                  <Volume2 className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#B45309]">
                    Pendamping Suara
                  </div>
                  <div className="mt-0.5 text-xs sm:text-[13px] font-extrabold text-[#1E1938] leading-snug">
                    Panduan Audio Interaktif
                  </div>
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
