"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, CircuitBoard, LayoutDashboard,
  Menu, ScanEye, Sparkles, Volume2, X, CheckCircle2, ShieldCheck,
} from "lucide-react";

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
    tagline: "Adaptive Learning Dashboard",
    description:
      "Skill mapping, adaptive learning paths, AI Tutor, and Learning Analytics for students, teachers, and parents.",
    accent: "#A78BFA",
    accentSoft: "rgba(167,139,250,.14)",
    Icon: LayoutDashboard,
  },
  {
    href: "/aruco",
    title: "LENTERA Lab",
    tagline: "Real-time Circuit Detection",
    description:
      "Connect to Lentera Edge (Raspberry Pi), detect physical circuits in real-time, and monitor their status from a single unified web workspace.",
    accent: "#67E8F9",
    accentSoft: "rgba(103,232,249,.12)",
    Icon: ScanEye,
  },
];

export default function PortalHome() {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

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

  const readIntro = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      "LENTERA is an adaptive science lab companion for blind and visually impaired learners. Touch, understand, learn independently. Choose LENTERA Learn for learning or LENTERA Lab for circuit detection."
    );
    utterance.lang = "en-US";
    utterance.rate = 0.94;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="portal-page relative min-h-screen overflow-hidden font-body text-white">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-orb portal-orb-a" />
        <div className="portal-orb portal-orb-b" />
        <div className="portal-orb portal-orb-c" />
        <div className="portal-grid" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="LENTERA Home">
          <img src="/logo-lentera.png" alt="Logo LENTERA" className="h-11 w-11 rounded-xl object-cover shadow-lg" />
          <div>
            <div className="font-heading text-lg font-extrabold tracking-tight">LENTERA</div>
            <div className="text-[10px] font-semibold tracking-[0.24em] text-violet-200">TOUCH · UNDERSTAND · LEARN INDEPENDENTLY</div>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <button onClick={readIntro} className="portal-ghost-btn">
            <Volume2 className="h-4 w-4" />
            {speaking ? "Turn off voice" : "Listen"}
          </button>
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
          aria-label="Open portal menu"
          className="portal-menu-btn md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-12 px-5 pb-14 pt-8 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pb-20">
        <div className="rise max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-violet-100 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
            Inclusive science learning ecosystem
          </div>

          <h1 className="font-heading text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Learn through
            <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              touch.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-violet-100/75 sm:text-lg">
            LENTERA connects the Smart Tactile Experiment Board with a learning app,
            AI Tutor, voice, and Learning Analytics so blind and visually impaired learners can
            explore science experiments more independently.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="portal-primary-btn">
              Open LENTERA Learn <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/aruco" className="portal-secondary-btn">
              Explore LENTERA Lab <ScanEye className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["AI Tutor", "adaptive guidance"],
              ["Voice", "voice interaction"],
              ["Analytics", "data-driven progress"],
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
          <div className="portal-visual" aria-label="LENTERA learning visualization">
            <div className="portal-visual-glow portal-visual-glow-a" />
            <div className="portal-visual-glow portal-visual-glow-b" />

            <svg
              className="portal-orbit-scene"
              viewBox="0 0 620 620"
              role="img"
              aria-label="Visualization of touch, voice, and learning interaction"
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
              <span>Touch · Understand · Learn Independently</span>
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
        aria-label="LENTERA portal menu"
        className={`fixed inset-y-0 right-0 z-50 flex w-[90vw] max-w-md flex-col border-l border-white/15 bg-[#17103D]/95 p-6 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-lentera.png" alt="" className="h-9 w-9 rounded-xl" />
            <div>
              <div className="font-heading font-extrabold">LENTERA</div>
              <div className="text-[10px] tracking-[.2em] text-violet-200/55">ECOSYSTEM</div>
            </div>
          </div>
          <button ref={closeBtnRef} onClick={() => setOpen(false)} aria-label="Close menu" className="portal-close-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-violet-100/60">
          Choose the workspace you want to use.
        </p>

        <nav className="mt-7 grid gap-3">
          {destinations.map((d) => (
            <Link
              key={d.href}
              href={d.href}
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
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />
            <div>
              <div className="text-sm font-bold">Built for accessibility</div>
              <div className="mt-1 text-xs leading-5 text-violet-100/50">
                Voice, keyboard, Braille, and tactile learning support.
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
