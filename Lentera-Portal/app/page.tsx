"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Compass,
  LayoutDashboard,
  ScanEye,
  ShieldCheck,
  Volume2,
  X,
  User,
} from "lucide-react";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";
import { speakNarration, cancelSpeech } from "@/utils/audioCoordinator";
import StudentProfileSwitcher from "@/components/StudentProfileSwitcher";
import { PRESET_STUDENTS, setActiveStudent } from "@/utils/progress";

let hasAutoPlayedIntro = false;

const STUDENT_CARD_MAP: Record<number, { id: string; greeting: string }> = {
  35: {
    id: "student-via",
    greeting:
      "Halo Via! Kartu belajar kamu berhasil dikenali. Selamat datang di Lentera Lab, mari kita mulai merangkai!",
  },
  36: {
    id: "student-amira",
    greeting:
      "Halo Amira! Kartu belajar kamu berhasil dikenali. Selamat datang di Lentera Lab, mari kita mulai merangkai!",
  },
  37: {
    id: "student-ajib",
    greeting:
      "Halo Ajib! Kartu belajar kamu berhasil dikenali. Selamat datang di Lentera Lab, mari kita mulai merangkai!",
  },
};

const destinations = [
  {
    href: "/aruco",
    title: "LENTERA Lab",
    tagline: "Papan Taktil & Kamera ArUco",
    description:
      "Ruang praktik eksperimen langsung untuk menyusun rangkaian listrik fisik dengan deteksi kamera real-time dan panduan suara.",
    Icon: ScanEye,
    accent: "#735CDD",
    accentSoft: "#EAE4FC",
  },
  {
    href: "/dashboard",
    title: "LENTERA Learn",
    tagline: "Kurikulum & AI Tutor",
    description:
      "Pusat belajar mandiri berisi materi terstruktur, misi interaktif, progres belajar, serta asisten AI berbasis suara.",
    Icon: LayoutDashboard,
    accent: "#B45309",
    accentSoft: "#FFF3D6",
  },
];

function LenteraHeroEmblem() {
  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      {/* Main Architectural Card in Logo Periwinkle (#735CDD) */}
      <div className="relative overflow-hidden rounded-[36px] bg-[#735CDD] p-8 sm:p-10 text-white border-2 border-[#5B43C6] shadow-[0_24px_60px_-18px_rgba(91,67,198,0.45)]">
        {/* Subtle Warm Lantern Radial Glow inside the card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 243, 214, 0.32) 0%, rgba(252, 230, 180, 0.10) 48%, transparent 72%)",
          }}
        />

        {/* Concentric Clean Architectural Rings */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold tracking-wider uppercase text-[#EAE4FC]">
            <span>Smart Tactile Ecosystem</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] text-[#FFF3D6]">
              Braille & Audio
            </span>
          </div>

          {/* Centerpiece Logo & Warm Lantern Halo */}
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

            {/* 4 Corner Pill Badges representing the core LENTERA pillars */}
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

          {/* Bottom Caption inside the visual card */}
          <div className="mt-2 w-full rounded-2xl bg-[#5B43C6]/80 border border-white/15 px-4 py-3 text-center">
            <div className="text-xs sm:text-[13px] font-semibold text-[#FFF3D6]">
              Learning Electricity through Non-visual Tactile Exploration &
              Real-time Audio
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalLandingPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [session, setSession] = useState<{ name: string; role: string } | null>(
    null
  );

  // Pre-load daftar voice browser agar suara bahasa Indonesia langsung siap saat halaman terbuka
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

  // Background WebSocket Listener: Auto-redirect ke /aruco saat balok atau kartu siswa diletakkan di papan fisik
  useEffect(() => {
    let ws: WebSocket | null = null;
    let redirectTriggered = false;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const initBackgroundWS = () => {
      try {
        const host = window.location.hostname || "localhost";
        ws = new WebSocket(`ws://${host}:8765`);

        ws.onmessage = (event) => {
          if (redirectTriggered) return;
          try {
            const data = JSON.parse(event.data);
            if (Array.isArray(data.markers) && data.markers.length > 0) {
              redirectTriggered = true;

              const studentMarker = data.markers.find(
                (m: { id: number }) => STUDENT_CARD_MAP[m.id] !== undefined
              );

              if (studentMarker) {
                const cardInfo = STUDENT_CARD_MAP[studentMarker.id];
                const matchedProfile = PRESET_STUDENTS.find(
                  (s) => s.id === cardInfo.id
                );
                if (matchedProfile) {
                  setActiveStudent(matchedProfile);
                }
                sessionStorage.setItem("lentera_student_card_greeted", "1");

                speakNarration(
                  normalizeIndonesianPhonetics(cardInfo.greeting),
                  {
                    tag: "student-card-welcome",
                  }
                );
              } else {
                const msg =
                  "Komponen terdeteksi di papan. Membuka ruang kerja Lentera Lab.";
                speakNarration(normalizeIndonesianPhonetics(msg), {
                  tag: "auto-redirect",
                });
              }

              setTimeout(() => {
                router.push("/aruco");
              }, 1400);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (!redirectTriggered) {
            reconnectTimer = setTimeout(initBackgroundWS, 4000);
          }
        };
      } catch {}
    };

    initBackgroundWS();

    return () => {
      redirectTriggered = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem("lentera-session");
    setSession(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  // Suara otomatis jalan saat interaksi pertama pengguna di halaman
  useEffect(() => {
    if (hasAutoPlayedIntro) return;

    const triggerFirstInteractionAudio = (e: Event) => {
      if (hasAutoPlayedIntro) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("#btn-voice-guide")) {
        hasAutoPlayedIntro = true;
        cleanupListeners();
        return;
      }

      hasAutoPlayedIntro = true;
      cleanupListeners();

      const text =
        "Selamat datang di LENTERA: Learning Electricity through Non-visual Tactile Exploration and Real-time Audio. Silakan letakkan kartu siswa atau balok komponen di papan fisik untuk langsung memulai eksperimen.";

      setSpeaking(true);
      speakNarration(normalizeIndonesianPhonetics(text), {
        tag: "landing-intro",
        onEnd: () => setSpeaking(false),
      });
    };

    const cleanupListeners = () => {
      window.removeEventListener("pointerdown", triggerFirstInteractionAudio);
      window.removeEventListener("keydown", triggerFirstInteractionAudio);
    };

    window.addEventListener("pointerdown", triggerFirstInteractionAudio, {
      once: true,
    });
    window.addEventListener("keydown", triggerFirstInteractionAudio, {
      once: true,
    });

    return () => {
      cleanupListeners();
    };
  }, []);

  const readIntro = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
      return;
    }

    const text =
      "Selamat datang di portal LENTERA: Learning Electricity through Non-visual Tactile Exploration and Real-time Audio. Halaman ini adalah pintu masuk utama menuju dua ruang kerja: Lentera Lab untuk eksperimen papan fisik, dan Lentera Learn untuk pembelajaran kurikulum.";

    setSpeaking(true);
    speakNarration(normalizeIndonesianPhonetics(text), {
      tag: "landing-intro-manual",
      onEnd: () => setSpeaking(false),
    });
  };

  const roleLabel =
    session?.role === "guru"
      ? "Guru Pendamping"
      : session?.role === "orangtua"
      ? "Orang Tua"
      : "Siswa";

  return (
    <main className="portal-page relative min-h-screen flex flex-col justify-between overflow-x-hidden selection:bg-[#735CDD] selection:text-white">
      {/* Top Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 pb-4 sm:px-8 print:hidden border-b border-[#1E1938]/10">
        <Link
          href="/"
          className="flex items-center gap-3.5 focus:outline-none"
          aria-label="Beranda LENTERA"
        >
          <div className="h-11 w-11 overflow-hidden rounded-[14px] bg-[#735CDD] shrink-0 border border-[#5B43C6]">
            <img
              src="/logo-lentera.png"
              alt="Logo Lentera"
              width={44}
              height={44}
              className="h-full w-full object-cover scale-[1.34]"
            />
          </div>
          <div>
            <div className="font-heading text-lg font-extrabold tracking-tight text-[#1E1938] leading-none">
              LENTERA
            </div>
            <div className="mt-1 text-xs font-semibold text-[#5A5376]">
              Smart Tactile Circuit Board
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <StudentProfileSwitcher />

          <Link
            href="/aruco"
            className="portal-ghost-btn hidden md:inline-flex"
          >
            <ScanEye className="h-4 w-4 text-[#735CDD]" />
            <span>LENTERA Lab</span>
          </Link>

          <Link
            href="/dashboard"
            className="portal-ghost-btn hidden md:inline-flex"
          >
            <LayoutDashboard className="h-4 w-4 text-[#D97706]" />
            <span>LENTERA Learn</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="portal-sidebar"
            className="portal-menu-btn"
          >
            <Compass className="h-4 w-4" />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative z-10 mx-auto my-auto grid w-full max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:py-14">
        <div className="rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#735CDD]/25 bg-[#EAE4FC] px-4 py-1.5 text-xs font-bold text-[#5B43C6]">
            <span className="h-2 w-2 rounded-full bg-[#735CDD]" />
            <span>Portal Utama LENTERA</span>
          </div>

          <h1 className="mt-5 font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-[#1E1938]">
            Belajar sains melalui{" "}
            <span className="text-[#735CDD]">sentuhan</span> dan{" "}
            <span className="inline-block rounded-2xl bg-[#FFF3D6] px-3.5 py-0.5 text-[#1E1938] border border-[#F5B841]">
              suara.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#5A5376]">
            LENTERA menggabungkan{" "}
            <strong className="text-[#1E1938]">
              Smart Tactile Experiment Board
            </strong>{" "}
            dengan sensor kamera cerdas, AI Tutor, dan panduan suara agar siswa
            tunanetra serta low vision dapat bereksperimen listrik secara
            mandiri dan aman.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/aruco"
                className="portal-primary-btn text-base py-3.5 px-6 flex items-center justify-center gap-2.5"
              >
                <ScanEye className="h-5 w-5" />
                <span>Buka LENTERA Lab</span>
              </Link>

              <Link
                href="/dashboard"
                className="portal-secondary-btn text-base py-3.5 px-6 flex items-center justify-center gap-2.5"
              >
                <LayoutDashboard className="h-5 w-5 text-[#735CDD]" />
                <span>Buka LENTERA Learn</span>
              </Link>

              <button
                id="btn-voice-guide"
                type="button"
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

            <div className="flex items-center gap-3 rounded-2xl border border-[#735CDD]/20 bg-[#F3EFFB] px-4 py-3 text-xs sm:text-[13px] text-[#1E1938]">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#735CDD] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#735CDD]" />
              </span>
              <span>
                <strong>Akses Taktil Mandiri:</strong> Letakkan kartu siswa atau
                balok di papan fisik kapan saja untuk langsung membuka Lab.
              </span>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 border-t border-[#1E1938]/10 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white p-3.5 border border-[#1E1938]/8">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Interaksi Fisik
                </div>
                <div className="mt-1 text-sm font-bold text-[#1E1938]">
                  Balok Taktil & Huruf Braille 3D
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-[#1E1938]/8">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
                  Visi Komputer
                </div>
                <div className="mt-1 text-sm font-bold text-[#1E1938]">
                  Sensor Kamera ArUco
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-[#1E1938]/8">
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

        {/* Right Visual */}
        <div
          className="relative rise lg:pl-6 flex items-center justify-center w-full"
          style={{ animationDelay: ".1s" }}
        >
          <LenteraHeroEmblem />
        </div>
      </section>

      {/* Backdrop for Sidebar Drawer */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#1E1938]/45 backdrop-blur-xs transition-opacity duration-300 print:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-over Sidebar Drawer */}
      <aside
        id="portal-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu portal LENTERA"
        className={`fixed inset-y-0 right-0 z-50 flex w-[90vw] max-w-md flex-col border-l-2 border-[#735CDD]/20 bg-[#FAF8F4] p-6 shadow-2xl transition-transform duration-300 print:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-[#735CDD] shrink-0 border border-[#5B43C6]">
              <img
                src="/logo-lentera.png"
                alt=""
                width={40}
                height={40}
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

        <nav className="mt-6 grid gap-3">
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

        <div className="mt-auto space-y-3 pt-6">
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
