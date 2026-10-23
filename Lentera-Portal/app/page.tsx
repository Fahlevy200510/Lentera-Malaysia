"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowUpRight, CircuitBoard, LayoutDashboard,
  Menu, ScanEye, Sparkles, Volume2, X, CheckCircle2, ShieldCheck, FileText,
} from "lucide-react";
import { resolveEndpoints, getActiveLenteraEndpoint } from "@/components/aruco/ArUcoDetector";
import StudentProfileSwitcher from "@/components/StudentProfileSwitcher";
import StudentReportModal from "@/components/StudentReportModal";

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
    const synth = window.speechSynthesis;

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    if (synth.paused) {
      synth.resume();
    }
    synth.cancel();

    const text =
      "Selamat datang di LENTERA — Papan Belajar Rangkaian Listrik Taktil dan Interaktif untuk Siswa Tunanetra. Sistem ini menghubungkan balok fisik di tangan Anda dengan sensor pintar di bawah papan untuk memberikan umpan balik suara seketika. Untuk memulai, Anda dapat memilih tombol LENTERA Lab di layar, atau cukup letakkan balok komponen apa saja di atas papan fisik di depan Anda. Selamat bereksplorasi!";

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Mencegah bug Chrome Garbage Collection

    const voices = synth.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesia")
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }
    utterance.lang = idVoice ? idVoice.lang : "id-ID";
    utterance.rate = 0.94;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeaking(true);
    };
    utterance.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = (err) => {
      console.warn("Speech synthesis notice:", err);
      setSpeaking(false);
      utteranceRef.current = null;
    };

    // Jeda kecil 60ms agar audio thread OS siap setelah cancel()
    setTimeout(() => {
      try {
        synth.speak(utterance);
      } catch (e) {
        console.error("Gagal menjalankan speak():", e);
      }
    }, 60);
  }, [speaking]);

  // Autoplay intro pada sentuhan/klik pertama di area mana pun di landing page
  useEffect(() => {
    const handleFirstInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // Jika pengguna menekan tombol toggle suara langsung, biarkan onClick tombol yang menangani
      if (target && target.closest("button")?.textContent?.includes("Suara")) {
        return;
      }

      if (!hasSpokenOnFirstClickRef.current) {
        hasSpokenOnFirstClickRef.current = true;
        readIntro();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [readIntro]);

  // Background WebSocket: Auto-redirect ke /aruco (LENTERA Lab) jika ada balok Baterai diletakkan di papan
  useEffect(() => {
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
        const COMPONENT_LABEL: Record<string, string> = {
          battery: "Baterai",
          lamp: "Lampu",
          switch: "Saklar",
          straight_cable: "Kabel lurus",
          l_cable: "Kabel sudut",
          t_cable: "Kabel cabang T",
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "grid_state" && data.cells && !redirected) {
              const placed = (Object.values(data.cells).filter(Boolean) as Array<{ component: string; rotation: number }>);
              if (placed.length > 0) {
                redirected = true;
                const comp = placed[0]?.component;
                const label = COMPONENT_LABEL[comp] || "komponen";
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  const notify = new SpeechSynthesisUtterance(`Balok ${label} terdeteksi! Membuka LENTERA Lab.`);
                  notify.lang = "id-ID";
                  window.speechSynthesis.speak(notify);
                }
                router.push("/aruco");
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
    <main className="portal-page relative min-h-screen overflow-hidden font-body text-white">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-orb portal-orb-a" />
        <div className="portal-orb portal-orb-b" />
        <div className="portal-orb portal-orb-c" />
        <div className="portal-grid" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Beranda LENTERA">
          <img src="/logo-lentera.png" alt="Logo LENTERA" className="h-11 w-11 rounded-xl object-cover shadow-lg" />
          <div>
            <div className="font-heading text-lg font-extrabold tracking-tight">LENTERA</div>
            <div className="text-[10px] font-semibold tracking-[0.24em] text-violet-200">SENTUH · PAHAMI · BELAJAR MANDIRI</div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <button onClick={readIntro} className="portal-ghost-btn">
            <Volume2 className="h-4 w-4" />
            {speaking ? "Matikan suara" : "Dengarkan"}
          </button>

          <StudentProfileSwitcher />

          <button
            onClick={() => setShowReport(true)}
            className="portal-ghost-btn text-violet-300 hover:text-violet-100 hover:bg-violet-500/20"
            title="Cetak Raport Belajar Siswa"
          >
            <FileText className="h-4 w-4 text-violet-400" />
            <span className="hidden lg:inline">Raport Siswa</span>
          </button>

          {ready && session ? (
            <button
              onClick={logout}
              className="portal-ghost-btn text-rose-300 hover:text-rose-200 hover:bg-rose-500/20"
              title="Keluar dari akun"
            >
              Keluar
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition-all hover:from-violet-400 hover:to-purple-500 active:scale-95"
            >
              Masuk / Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button onClick={() => setOpen(true)} className="portal-menu-btn">
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

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-12 px-5 pb-14 pt-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-20">
        <div className="rise max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-violet-100 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
            Ekosistem pembelajaran sains inklusif
          </div>

          <h1 className="font-heading text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Belajar melalui
            <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              sentuhan.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-violet-100/75 sm:text-lg">
            LENTERA menghubungkan Smart Tactile Experiment Board dengan aplikasi belajar,
            AI Tutor, suara, dan Analitik Pembelajaran agar siswa tunanetra dan low vision dapat
            menjelajahi eksperimen sains dengan lebih mandiri.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {ready && session ? (
              <>
                <Link href="/dashboard" className="portal-primary-btn">
                  Buka LENTERA Learn <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/aruco" className="portal-secondary-btn">
                  Jelajahi LENTERA Lab (Deteksi Blok) <ScanEye className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/aruco"
                    className="portal-primary-btn text-base py-3.5 px-7 shadow-xl shadow-cyan-500/25 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500"
                  >
                    Buka LENTERA Lab <ScanEye className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="portal-ghost-btn text-base py-3.5 px-6 border border-white/20 hover:border-violet-400"
                  >
                    Masuk Akun <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button onClick={readIntro} className="portal-secondary-btn text-base py-3.5 px-6">
                    <Volume2 className="h-4 w-4" /> {speaking ? "Matikan Suara" : "Dengarkan Panduan"}
                  </button>
                </div>
                <p className="text-xs text-cyan-200/80 font-medium flex items-center gap-1.5">
                  ✨ <span>Akses Taktil Mandiri: Letakkan balok komponen apa saja di atas papan fisik kapan saja untuk langsung membuka Lab.</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["AI Tutor", "bimbingan adaptif"],
              ["Suara", "interaksi suara"],
              ["Analitik", "progres berbasis data"],
            ].map(([title, sub]) => (
              <div key={title} className="portal-mini-card">
                <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                <div className="mt-2 text-sm font-bold text-white">{title}</div>
                <div className="mt-0.5 text-[11px] leading-4 text-violet-100/55">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rise lg:pl-8" style={{ animationDelay: ".12s" }}>
          <div className="portal-visual" aria-label="Visualisasi pembelajaran LENTERA">
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

              <g className="portal-orbit portal-orbit-one">
                <ellipse cx="310" cy="310" rx="235" ry="94" fill="none" stroke="url(#orbitGradient)" strokeWidth="2.5" />
                <circle cx="545" cy="310" r="7" fill="#c4b5fd" filter="url(#tinyGlow)" />
              </g>
              <g className="portal-orbit portal-orbit-two">
                <ellipse cx="310" cy="310" rx="228" ry="88" fill="none" stroke="url(#orbitGradient)" strokeWidth="2" />
                <circle cx="82" cy="310" r="6" fill="#67e8f9" filter="url(#tinyGlow)" />
              </g>
              <g className="portal-orbit portal-orbit-three">
                <ellipse cx="310" cy="310" rx="235" ry="100" fill="none" stroke="url(#orbitGradient)" strokeWidth="2.2" />
                <circle cx="310" cy="210" r="7" fill="#f0abfc" filter="url(#tinyGlow)" />
              </g>

              <g className="portal-orbit portal-orbit-tilt">
                <ellipse cx="310" cy="310" rx="245" ry="108" fill="none" stroke="#8b5cf6" strokeOpacity=".22" strokeWidth="1" />
              </g>

              <circle cx="310" cy="310" r="105" fill="url(#coreGradient)" opacity=".25" filter="url(#softGlow)" />
              <circle cx="310" cy="310" r="74" fill="#8b5cf6" fillOpacity=".13" stroke="#c4b5fd" strokeOpacity=".34" />
              <circle cx="310" cy="310" r="49" fill="url(#coreGradient)" filter="url(#softGlow)" />
              <circle cx="310" cy="310" r="16" fill="#fff7ed" filter="url(#tinyGlow)" />

              <g className="portal-particle-field" fill="#c4b5fd">
                <circle cx="138" cy="176" r="2.5" />
                <circle cx="176" cy="478" r="2" />
                <circle cx="448" cy="140" r="2.5" />
                <circle cx="492" cy="466" r="2" />
                <circle cx="565" cy="232" r="2" />
                <circle cx="104" cy="372" r="2" />
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
        className={`fixed inset-0 z-40 bg-[#100B2E]/65 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="portal-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu portal LENTERA"
        className={`fixed inset-y-0 right-0 z-50 flex w-[90vw] max-w-md flex-col border-l border-white/15 bg-[#17103D]/95 p-6 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-lentera.png" alt="" className="h-9 w-9 rounded-xl" />
            <div>
              <div className="font-heading font-extrabold">LENTERA</div>
              <div className="text-[10px] tracking-[.2em] text-violet-200/55">EKOSISTEM</div>
            </div>
          </div>
          <button ref={closeBtnRef} onClick={() => setOpen(false)} aria-label="Tutup menu" className="portal-close-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-violet-100/60">
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
                    <span className="font-heading text-[15px] font-bold">{d.title}</span>
                    <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-white" />
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-violet-200/45">{d.tagline}</span>
                  <span className="mt-2 block text-[13px] leading-5 text-violet-100/55">{d.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {session ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">👤 {session.name}</div>
                <div className="text-[10px] text-violet-200/60 font-semibold uppercase">{roleLabel}</div>
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 p-3.5 text-xs font-bold text-white shadow-lg transition-all hover:from-violet-400 hover:to-purple-500"
            >
              Masuk / Login Sekarang
            </Link>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />
              <div>
                <div className="text-sm font-bold">Dirancang untuk aksesibilitas</div>
                <div className="mt-1 text-xs leading-5 text-violet-100/50">
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
