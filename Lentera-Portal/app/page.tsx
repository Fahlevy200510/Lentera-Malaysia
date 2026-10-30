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

function LenteraHeroEmblem() {
  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <div className="relative overflow-hidden rounded-[36px] bg-[#735CDD] p-8 sm:p-10 text-white border-2 border-[#5B43C6] shadow-[0_24px_60px_-18px_rgba(91,67,198,0.45)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 243, 214, 0.34) 0%, rgba(252, 230, 180, 0.12) 48%, transparent 72%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold tracking-wider uppercase text-[#EAE4FC]">
            <span>Smart Tactile Ecosystem</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] text-[#FFF3D6]">
              Braille & Audio
            </span>
          </div>

          <div className="my-8 sm:my-10 relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="h-56 w-56 sm:h-64 sm:w-64 rounded-full border border-white/20 flex items-center justify-center"
            >
              <div className="h-44 w-44 sm:h-52 sm:w-52 rounded-full border border-[#FFF3D6]/35 bg-white/[0.06] flex items-center justify-center">
                <div className="h-32 w-32 sm:h-36 sm:w-36 overflow-hidden rounded-[30px] bg-[#735CDD] border-2 border-[#FFF3D6] shadow-[0_12px_36px_rgba(30,25,56,0.28)]">
                  <img
                    src="/logo-lentera.png"
                    alt="Logo LENTERA"
                    width={144}
                    height={144}
                    className="h-full w-full object-cover scale-[1.34]"
                  />
                </div>
              </div>
            </div>

            <div className="absolute -top-2 -left-1 sm:left-0 rounded-2xl bg-[#FAF8F4] px-3.5 py-2 text-[#1E1938] shadow-md border border-[#EAE4FC]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#735CDD]">
                Rabaan 3D
              </div>
              <div className="text-xs font-bold">Balok & Braille</div>
            </div>

            <div className="absolute -top-2 -right-1 sm:right-0 rounded-2xl bg-[#FAF8F4] px-3.5 py-2 text-[#1E1938] shadow-md border border-[#EAE4FC]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#735CDD]">
                Visi Kamera
              </div>
              <div className="text-xs font-bold">Sensor ArUco</div>
            </div>

            <div className="absolute -bottom-2 -left-1 sm:left-0 rounded-2xl bg-[#FFF3D6] px-3.5 py-2 text-[#1E1938] shadow-md border border-[#F5B841]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309]">
                Real-Time
              </div>
              <div className="text-xs font-bold">Panduan Suara</div>
            </div>

            <div className="absolute -bottom-2 -right-1 sm:right-0 rounded-2xl bg-[#FFF3D6] px-3.5 py-2 text-[#1E1938] shadow-md border border-[#F5B841]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309]">
                Pendamping
              </div>
              <div className="text-xs font-bold">AI Tutor</div>
            </div>
          </div>

          <div className="mt-2 w-full rounded-2xl bg-[#5B43C6]/80 border border-white/15 px-4 py-3 text-center">
            <div className="text-xs sm:text-[13px] font-semibold text-[#FFF3D6]">
              SENTUH · PAHAMI · BELAJAR MANDIRI
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
      }
    }

    initBackgroundWS();

    return () => {
      cancelled = true;
      if (ws) ws.close();
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
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10 print:hidden border-b border-[#1E1938]/10">
        <Link
          href="/"
          className="flex items-center gap-3.5"
          aria-label="Beranda LENTERA"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-[14px] bg-[#735CDD] shrink-0 border border-[#5B43C6]">
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
            <div className="hidden sm:block text-[10px] font-bold tracking-[0.24em] text-[#735CDD]">
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

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-8 lg:gap-12 px-5 pb-14 pt-6 sm:pt-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-16 print:hidden">
        <div className="rise max-w-2xl">
          <h1
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.14] tracking-tight text-[#1E1938]"
            aria-label="Belajar sains melalui sentuhan dan suara."
          >
            <span className="block">Belajar sains melalui</span>
            <span className="block text-[#735CDD] min-h-[1.25em] mt-1 sm:mt-1.5">
              <span>{typedWord}</span>
              <span
                className="inline-block w-[3.5px] h-[0.78em] ml-2 bg-[#F5B841] rounded-sm animate-pulse align-middle"
                aria-hidden="true"
              />
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#5A5376]">
            LENTERA menggabungkan Smart Tactile Experiment Board dengan sensor
            cerdas, AI Tutor, dan panduan suara agar siswa tunanetra serta low
            vision dapat bereksperimen listrik secara mandiri dan aman.
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
                <LayoutDashboard className="h-5 w-5 text-[#735CDD]" /> Buka
                LENTERA Learn
              </Link>
              <button
                id="btn-voice-guide"
                onClick={readIntro}
                className="portal-secondary-btn text-base py-3.5 px-5 flex items-center justify-center gap-2"
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

            <div className="flex items-center gap-2.5 rounded-xl border border-[#735CDD]/20 bg-[#F3EFFB] px-4 py-2.5 text-xs text-[#1E1938]">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#735CDD] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#735CDD]"></span>
              </span>
              <span>
                <strong>Akses Taktil Mandiri:</strong> Letakkan balok di papan
                fisik kapan saja untuk langsung membuka Lab.
              </span>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 border-t border-[#1E1938]/10 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Interaksi Fisik
                </div>
                <div className="mt-1 text-sm font-bold text-[#1E1938]">
                  Balok Taktil & Huruf Braille 3D
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Visi Komputer
                </div>
                <div className="mt-1 text-sm font-bold text-[#1E1938]">
                  Sensor Kamera ArUco
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Audio Inklusif
                </div>
                <div className="mt-1 text-sm font-bold text-[#1E1938]">
                  Panduan Suara Interaktif
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative rise lg:pl-8 flex items-center justify-center w-full"
          style={{ animationDelay: ".12s" }}
        >
          <LenteraHeroEmblem />
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
