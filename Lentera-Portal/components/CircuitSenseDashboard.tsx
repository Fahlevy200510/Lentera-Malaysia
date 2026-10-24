"use client";

import Link from "next/link";
import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import { getStudentProgress, type StudentProgress } from "@/utils/progress";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";
import {
  ScanEye, Zap, CircuitBoard, LayoutDashboard, Sparkles, Trophy, Award, Flame,
  Battery, Cable, Lightbulb, ToggleRight, Bell, ChevronRight, Play,
  Volume2, Mic, Send, TrendingUp, Target, Star, AlertTriangle, Brain,
  Lock, ArrowUpRight, Search, Hand, GraduationCap, CheckCircle2, User,
  BookOpen, LogOut, Eye, EyeOff, ArrowLeft, Link2, Unlink2, GitBranch,
  Fingerprint, Layers, Info, ChevronLeft, ChevronDown, PlugZap, Printer,
  KeyRound, ShieldCheck, VolumeX, SlidersHorizontal, Loader2, RefreshCw,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, Cell,
} from "recharts";

/* ---------------------------------------------------------------- palette */
const C = {
  bg: "#FCFBFF",
  primary: "#8B5CF6",
  primaryDeep: "#7C3AED",
  primarySoft: "#EDE9FE",
  pink: "#F9A8D4",
  pinkSoft: "#FCE7F3",
  blue: "#38BDF8",
  blueSoft: "#E0F2FE",
  green: "#34D399",
  greenSoft: "#DCFCE7",
  yellow: "#FDE68A",
  yellowSoft: "#FEF9C3",
  text: "#2E2A5E",
  textSoft: "#7C77A6",
  glass: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(255,255,255,0.9)",
  shadow: "0 18px 50px -20px rgba(124,58,237,0.35)",
  shadowSm: "0 10px 30px -16px rgba(124,58,237,0.3)",
};
const HEAD = "'Poppins', system-ui, sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";

/* ---------------------------------------------------------------- ui bits */
const glassStyle = (extra: CSSProperties = {}): CSSProperties => ({
  background: C.glass,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: `1px solid ${C.glassBorder}`,
  borderRadius: 26,
  boxShadow: C.shadowSm,
  ...extra,
});

function Card({
  children, className = "", style = {}, delay = 0, hover = true,
}: {
  children: ReactNode; className?: string; style?: CSSProperties; delay?: number; hover?: boolean;
}) {
  return (
    <div
      className={`${hover ? "card" : ""} rise ${className}`}
      style={{ ...glassStyle(), animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function Stars({ n, max = 5, size = 15, color = C.primary }: {
  n: number; max?: number; size?: number; color?: string;
}) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`${n} dari ${max} bintang`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={i < n ? 0 : 2}
          fill={i < n ? color : "none"}
          color={i < n ? color : "rgba(124,119,166,0.35)"}
        />
      ))}
    </span>
  );
}

function ProgressBar({ value, color = C.primary, track = "rgba(139,92,246,0.14)", h = 9 }: {
  value: number; color?: string; track?: string; h?: number;
}) {
  return (
    <div style={{ height: h, borderRadius: 99, background: track, overflow: "hidden" }}>
      <div
        style={{
          width: `${value}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${C.primary})`,
          transition: "width 1.1s cubic-bezier(.2,.7,.2,1)",
        }}
      />
    </div>
  );
}

function Ring({ value, size = 132, stroke = 13, color = C.primary }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `conic-gradient(${color} ${value * 3.6}deg, ${C.primarySoft} 0deg)`,
        display: "grid", placeItems: "center",
      }}
    >
      <div
        style={{
          width: size - stroke * 2, height: size - stroke * 2, borderRadius: "50%",
          background: "#fff", display: "grid", placeItems: "center", textAlign: "center",
          boxShadow: "inset 0 2px 10px rgba(124,58,237,0.08)",
        }}
      >
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 26, color: C.text, lineHeight: 1 }}>
            {value}%
          </div>
          <div style={{ fontSize: 11, color: C.textSoft, marginTop: 3, fontWeight: 600 }}>menuju Insinyur</div>
        </div>
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  const map: Record<string, [string, string]> = {
    green: [C.greenSoft, "#0F9D6B"],
    blue: [C.blueSoft, "#0284C7"],
    warn: [C.pinkSoft, "#DB2777"],
    purple: [C.primarySoft, C.primaryDeep],
    yellow: [C.yellowSoft, "#B45309"],
  };
  const [bg, fg] = map[tone] || map.purple;
  return (
    <span style={{ background: bg, color: fg, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, sub, right }: {
  icon: LucideIcon; title: string; sub?: string; right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between" style={{ marginBottom: 16 }}>
      <div className="flex items-center" style={{ gap: 11 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: C.primarySoft, display: "grid", placeItems: "center" }}>
          <Icon size={20} color={C.primaryDeep} />
        </div>
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 19, color: C.text }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: C.textSoft, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ---------------------------------------------------------------- signature: live circuit */
const LOOP =
  "M46 118 L46 62 Q46 44 64 44 L256 44 Q274 44 274 62 L274 118 Q274 136 256 136 L64 136 Q46 136 46 118 Z";

function LiveCircuit() {
  return (
    <svg viewBox="0 0 320 168" style={{ width: "100%", maxWidth: 360 }} role="img" aria-label="Animasi rangkaian dengan arus yang mengalir">
      <defs>
        <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.primary} />
          <stop offset="100%" stopColor={C.pink} />
        </linearGradient>
      </defs>
      <path d={LOOP} fill="none" stroke="rgba(139,92,246,0.14)" strokeWidth="10" strokeLinejoin="round" />
      <path d={LOOP} fill="none" stroke="url(#wire)" strokeWidth="4.5" strokeLinejoin="round" />

      {/* battery (bottom) */}
      <g transform="translate(148,128)">
        <rect x="0" y="0" width="24" height="16" rx="3" fill="#fff" stroke={C.primaryDeep} strokeWidth="2" />
        <line x1="7" y1="3" x2="7" y2="13" stroke={C.primaryDeep} strokeWidth="3.5" />
        <line x1="16" y1="5" x2="16" y2="11" stroke={C.primaryDeep} strokeWidth="2" />
        <text x="6" y="-4" fontFamily={HEAD} fontSize="11" fontWeight="800" fill={C.primaryDeep}>+</text>
      </g>

      {/* switch (top, closed) */}
      <g transform="translate(150,36)">
        <circle cx="0" cy="8" r="2.6" fill={C.primaryDeep} />
        <circle cx="20" cy="8" r="2.6" fill={C.primaryDeep} />
        <line x1="0" y1="8" x2="20" y2="8" stroke={C.primaryDeep} strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* lamp (right) — centered exactly on the wire's right edge */}
      <g transform="translate(274,80)" className="lamp">
        <circle cx="0" cy="10" r="12" fill={C.yellow} stroke="#F59E0B" strokeWidth="2" />
        <path d="M-4 6 L0 14 L4 6" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* flowing current */}
      {[0, 0.85, 1.7, 2.55].map((b, i) => (
        <circle key={i} r="4.2" fill={i % 2 ? C.pink : C.primary} className="dot">
          <animateMotion path={LOOP} dur="3.4s" begin={`${b}s`} repeatCount="indefinite" rotate="auto" />
        </circle>
      ))}
    </svg>
  );
}

/* =============================================================== STUDENT */
interface Skill { name: string; icon: LucideIcon; level: number; color: string; locked?: boolean; }
const skills: Skill[] = [
  { name: "Baterai", icon: Battery, level: 5, color: C.green },
  { name: "Kabel", icon: Cable, level: 4, color: C.blue },
  { name: "Saklar", icon: ToggleRight, level: 4, color: "#F59E0B" },
  { name: "Aliran Arus", icon: Zap, level: 2, color: C.pink },
  { name: "Rangkaian Seri", icon: CircuitBoard, level: 3, color: C.primary },
  { name: "Rangkaian Paralel", icon: Lightbulb, level: 1, color: C.primaryDeep, locked: true },
];

const weekly = [
  { day: "Sen", min: 22, c: C.primary }, { day: "Sel", min: 34, c: C.pink },
  { day: "Rab", min: 16, c: C.blue }, { day: "Kam", min: 41, c: C.green },
  { day: "Jum", min: 28, c: "#F59E0B" }, { day: "Sab", min: 12, c: C.primaryDeep },
  { day: "Min", min: 25, c: C.primary },
];

interface Achievement { name: string; desc: string; icon: LucideIcon; color: string; earned: boolean; }
const achievements: Achievement[] = [
  { name: "Cahaya Pertama", desc: "Membuat rangkaian pertamamu yang berfungsi", icon: Lightbulb, color: "#F59E0B", earned: true },
  { name: "Percikan Terang", desc: "Berlatih 7 hari berturut-turut", icon: Flame, color: C.pink, earned: true },
  { name: "Ahli Seri", desc: "Menguasai rangkaian seri", icon: CircuitBoard, color: C.primary, earned: true },
  { name: "Tanpa Petunjuk", desc: "Selesai tanpa petunjuk sama sekali", icon: Target, color: C.green, earned: true },
  { name: "Penjelajah Tegangan", desc: "Mencapai level Insinyur", icon: Trophy, color: C.blue, earned: false },
  { name: "Master Rangkaian", desc: "Menyelesaikan semua modul", icon: Award, color: C.primaryDeep, earned: false },
];

function StudentHome() {
  const [lessonStarted, setLessonStarted] = useState(false);
  const [progress, setProgress] = useState<StudentProgress>(() => getStudentProgress());

  useEffect(() => {
    const handleUpdate = () => setProgress(getStudentProgress());
    window.addEventListener("lentera-progress-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lentera-progress-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const dynamicSkills: Skill[] = [
    { name: "Baterai", icon: Battery, level: progress.skills.battery, color: C.green },
    { name: "Kabel", icon: Cable, level: progress.skills.cable, color: C.blue },
    { name: "Saklar", icon: ToggleRight, level: progress.skills.switch, color: "#F59E0B" },
    { name: "Aliran Arus", icon: Zap, level: progress.skills.flow, color: C.pink },
    {
      name: "Rangkaian Seri",
      icon: CircuitBoard,
      level: progress.skills.series,
      color: C.primary,
      locked: !progress.modules.component_recognition,
    },
    {
      name: "Rangkaian Paralel",
      icon: Lightbulb,
      level: progress.skills.parallel,
      color: C.primaryDeep,
      locked: !progress.modules.series_circuit,
    },
  ];

  const dynamicAchievements: Achievement[] = achievements.map((a) => ({
    ...a,
    earned: progress.achievements.includes(a.name),
  }));

  const earnedAchievementsCount = dynamicAchievements.filter((a) => a.earned).length;
  const xpPercent = Math.min(100, Math.round((progress.xp / 1000) * 100));

  let currentLessonTitle = "Rangkaian Seri";
  let currentLessonSub = "Pelajaran 7 dari 12";
  let currentLessonDesc = "Raba papan, letakkan komponen, dan rasakan arus mengalir. Kami akan berhenti sejenak saat ada yang terputus.";
  let focusTag = "Fokus hari ini · Aliran Arus";

  if (!progress.modules.component_recognition) {
    currentLessonTitle = "Pengenalan Komponen";
    currentLessonSub = "Pelajaran 1 dari 12 • Dasar";
    currentLessonDesc = "Kenali bentuk taktil balok baterai, saklar, lampu, dan kabel di papan Lentera sebelum mulai merakit.";
    focusTag = "Fokus hari ini · Bentuk Komponen";
  } else if (!progress.modules.series_circuit) {
    currentLessonTitle = "Rangkaian Seri";
    currentLessonSub = "Pelajaran 2 dari 12 • Menengah";
    currentLessonDesc = "Hubungkan baterai ke saklar dan lampu dalam satu lintasan tertutup searah.";
    focusTag = "Fokus hari ini · Rangkaian Seri";
  } else {
    currentLessonTitle = "Rangkaian Paralel";
    currentLessonSub = "Pelajaran 3 dari 12 • Lanjutan";
    currentLessonDesc = "Gunakan kabel cabang T untuk membagi aliran listrik ke dua lampu mandiri.";
    focusTag = "Fokus hari ini · Rangkaian Paralel";
  }

  const startLesson = () => setLessonStarted(true);
  const readLesson = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      normalizeIndonesianPhonetics(`Pelajaran hari ini tentang ${currentLessonTitle}. ${currentLessonDesc}`)
    );
    u.lang = "id-ID";
    u.rate = 0.94;
    window.speechSynthesis.speak(u);
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* greeting + lesson */}
      <div className="row2 row2-hero">
        <Card
          delay={0}
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDeep} 55%, #6D28D9 100%)`,
            border: "none", color: "#fff", padding: 26, position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: -30, bottom: -30, width: 190, height: 190, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
          <div className="flex items-center" style={{ gap: 8, marginBottom: 14 }}>
            <span style={{ background: "rgba(255,255,255,0.22)", padding: "5px 12px", borderRadius: 99, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} /> Dipilihkan Lentera untukmu
            </span>
          </div>
          <div style={{ fontSize: 13.5, opacity: 0.85, fontWeight: 600 }}>Pelajaran hari ini · {currentLessonSub}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 34, lineHeight: 1.05, margin: "6px 0 10px" }}>
            {currentLessonTitle}
          </div>
          <p style={{ fontSize: 14, opacity: 0.9, maxWidth: 340, lineHeight: 1.5, position: "relative" }}>
            {currentLessonDesc}
          </p>
          <div className="flex items-center" style={{ gap: 10, marginTop: 18, flexWrap: "wrap", position: "relative" }}>
            <Link
              href="/aruco"
              style={{ background: "#fff", color: C.primaryDeep, border: "none", padding: "12px 22px", borderRadius: 99, fontWeight: 800, fontSize: 14.5, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            >
              <Play size={17} fill={C.primaryDeep} /> Buka di Edge Lab
            </Link>
            <button onClick={readLesson} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", padding: "12px 18px", borderRadius: 99, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Volume2 size={17} /> Bacakan
            </button>
          </div>
          {lessonStarted && (
            <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,.88)" }}>
              ✓ Pelajaran aktif — lanjutkan menjelajahi papan taktil.
            </div>
          )}
          <div style={{ position: "absolute", right: 18, top: 14, opacity: 0.95 }}>
            <div style={{ transform: "scale(0.9)" }}><LiveCircuit /></div>
          </div>
        </Card>

        {/* level ring */}
        <Card delay={80} style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.primarySoft, color: C.primaryDeep, padding: "5px 13px", borderRadius: 99, fontWeight: 800, fontSize: 13, marginBottom: 16 }}>
            <Zap size={15} fill={C.primaryDeep} /> Level {progress.xp >= 1000 ? "3 · Insinyur" : progress.xp >= 500 ? "2 · Teknisi" : "1 · Penjelajah"}
          </div>
          <Ring value={xpPercent} />
          <div style={{ marginTop: 16, fontSize: 13, color: C.textSoft, fontWeight: 600 }}>
            <span style={{ color: C.text, fontWeight: 800 }}>{progress.xp}</span> / 1000 XP
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, fontSize: 11.5, color: C.textSoft, fontWeight: 700 }}>
            <span style={{ color: progress.xp < 500 ? C.primaryDeep : C.textSoft }}>Penjelajah</span>
            <ChevronRight size={14} />
            <span style={{ color: progress.xp >= 500 && progress.xp < 1000 ? C.primaryDeep : C.textSoft }}>Teknisi</span>
            <ChevronRight size={14} />
            <span style={{ color: progress.xp >= 1000 ? C.primaryDeep : "rgba(124,119,166,0.5)" }}>Insinyur</span>
          </div>
        </Card>
      </div>

      {/* skill map */}
      <Card delay={140} style={{ padding: 24 }}>
        <SectionTitle
          icon={CircuitBoard} title="Peta keterampilanmu"
          sub="Seberapa paham kamu pada setiap konsep menurut Lentera"
          right={<Pill tone="warn">{focusTag}</Pill>}
        />
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {dynamicSkills.map((s) => (
            <div key={s.name} style={{ padding: 15, borderRadius: 18, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.1)", position: "relative" }}>
              {s.locked && (
                <div style={{ position: "absolute", right: 12, top: 12, color: C.textSoft }}><Lock size={15} /></div>
              )}
              <div className="flex items-center" style={{ gap: 10, marginBottom: 11 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}22`, display: "grid", placeItems: "center" }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: C.text }}>{s.name}</div>
              </div>
              <Stars n={s.level} color={s.color} />
              <div style={{ marginTop: 10 }}><ProgressBar value={s.level * 20} color={s.color} /></div>
            </div>
          ))}
        </div>
      </Card>

      {/* activity + streak */}
      <div className="row2 row2-a">
        <Card delay={200} style={{ padding: 24 }}>
          <SectionTitle icon={TrendingUp} title="Minggu ini" sub="Menit belajar di papan, per hari" />
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" stroke="rgba(46,42,94,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: C.textSoft, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textSoft, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(139,92,246,0.06)" }} contentStyle={{ background: "#fff", border: "none", borderRadius: 14, boxShadow: C.shadowSm, fontFamily: BODY, fontSize: 12.5, color: C.text }} />
                <Bar dataKey="min" radius={[9, 9, 3, 3]}>
                  {weekly.map((d, i) => <Cell key={i} fill={d.c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card delay={260} style={{ padding: 24, background: `linear-gradient(140deg, ${C.pinkSoft}, #FFF5FB)` }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 17, color: C.text }}>Runtutan</div>
              <div style={{ fontSize: 12.5, color: C.textSoft, marginTop: 2 }}>Jaga arusnya tetap mengalir</div>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "#fff", display: "grid", placeItems: "center", boxShadow: C.shadowSm }}>
              <Flame size={24} color={C.pink} fill={C.pink} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "18px 0 4px" }}>
            <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 46, color: C.text, lineHeight: 1 }}>7</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textSoft }}>hari</span>
          </div>
          <div className="flex" style={{ gap: 6, marginTop: 14 }}>
            {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 34, borderRadius: 10, background: i < 6 ? C.pink : "rgba(249,168,212,0.25)", display: "grid", placeItems: "center" }}>
                  {i < 6 && <CheckCircle2 size={16} color="#fff" />}
                </div>
                <div style={{ fontSize: 10.5, color: C.textSoft, marginTop: 5, fontWeight: 600 }}>{d}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* achievements */}
      <Card delay={320} style={{ padding: 24 }}>
        <SectionTitle icon={Trophy} title="Pencapaian" sub={`${earnedAchievementsCount} dari ${dynamicAchievements.length} terbuka`} right={<Pill tone="purple">Jalur Master Rangkaian</Pill>} />
        <div style={{ display: "grid", gap: 13, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {dynamicAchievements.map((a) => (
            <div key={a.name} style={{ padding: 15, borderRadius: 18, textAlign: "center", background: a.earned ? "rgba(255,255,255,0.65)" : "rgba(240,239,247,0.6)", border: "1px solid rgba(139,92,246,0.1)", opacity: a.earned ? 1 : 0.6 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 10px", background: a.earned ? `${a.color}22` : "rgba(124,119,166,0.12)", display: "grid", placeItems: "center", position: "relative" }}>
                <a.icon size={26} color={a.earned ? a.color : C.textSoft} fill={a.earned ? a.color : "none"} strokeWidth={a.earned ? 1.5 : 2} />
                {!a.earned && <div style={{ position: "absolute", bottom: -3, right: -3, background: "#fff", borderRadius: "50%", padding: 3, boxShadow: C.shadowSm }}><Lock size={11} color={C.textSoft} /></div>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: C.text }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 3, lineHeight: 1.35 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* =============================================================== TEACHER */
const masteryTrend = [
  { week: "M1", mastery: 42 }, { week: "M2", mastery: 48 }, { week: "M3", mastery: 55 },
  { week: "M4", mastery: 61 }, { week: "M5", mastery: 65 }, { week: "M6", mastery: 68 },
];
const skillRadar = [
  { skill: "Baterai", value: 90 }, { skill: "Kabel", value: 82 }, { skill: "Saklar", value: 76 },
  { skill: "Arus", value: 54 }, { skill: "Seri", value: 63 }, { skill: "Paralel", value: 38 },
];

interface Student { name: string; level: string; mastery: number; status: [string, string]; }
const students: Student[] = [
  { name: "Amara S.", level: "Insinyur", mastery: 88, status: ["blue", "Siap naik level"] },
  { name: "Sinta A.", level: "Insinyur", mastery: 91, status: ["blue", "Siap naik level"] },
  { name: "Lina W.", level: "Teknisi", mastery: 72, status: ["green", "Sesuai target"] },
  { name: "Kai R.", level: "Teknisi", mastery: 64, status: ["green", "Sesuai target"] },
  { name: "Dimas P.", level: "Penjelajah", mastery: 41, status: ["warn", "Perlu bantuan"] },
  { name: "Bagas T.", level: "Penjelajah", mastery: 38, status: ["warn", "Perlu bantuan"] },
];

interface Insight { icon: LucideIcon; tone: string; tag: string; text: string; }
const insights: Insight[] = [
  { icon: AlertTriangle, tone: "warn", tag: "Peringatan media", text: "82% siswa salah meletakkan kabel di terminal kanan. Penanda taktil sisi kanan mungkin terlalu samar — pertimbangkan merevisi tata letak papan." },
  { icon: Brain, tone: "purple", tag: "Miskonsepsi", text: "Aliran Arus adalah konsep terlemah kelas (54%). Kai dan 5 siswa lain tertukar antara kutub + dan −." },
  { icon: TrendingUp, tone: "blue", tag: "Siap naik level", text: "3 siswa telah menguasai rangkaian seri dan siap membuka rangkaian paralel." },
  { icon: Sparkles, tone: "green", tag: "Adaptasi otomatis", text: "Jalur belajar 6 siswa telah dipersonalisasi semalam berdasarkan performa sesi terakhir." },
];

interface Stat { label: string; value: string; icon: LucideIcon; color: string; sub: string; }
const tStats: Stat[] = [
  { label: "Siswa", value: "24", icon: GraduationCap, color: C.primary, sub: "di Kelas 8B" },
  { label: "Rata-rata penguasaan", value: "68%", icon: Target, color: C.green, sub: "+6% bulan ini" },
  { label: "Aktif hari ini", value: "19", icon: Zap, color: C.blue, sub: "dari 24 siswa" },
  { label: "Pelajaran selesai", value: "142", icon: CheckCircle2, color: C.pink, sub: "minggu ini" },
];

function TeacherOverview() {
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const filteredStudents = students.filter((st) =>
    st.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
    st.level.toLowerCase().includes(studentQuery.toLowerCase()) ||
    st.status[1].toLowerCase().includes(studentQuery.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* stat row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {tStats.map((s, i) => (
          <Card key={s.label} delay={i * 60} style={{ padding: 20 }}>
            <div className="flex items-center justify-between">
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `${s.color}22`, display: "grid", placeItems: "center" }}>
                <s.icon size={22} color={s.color} />
              </div>
              <ArrowUpRight size={18} color={C.textSoft} />
            </div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 32, color: C.text, marginTop: 14, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 6 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* trend + radar */}
      <div className="row2 row2-b">
        <Card delay={200} style={{ padding: 24 }}>
          <SectionTitle icon={TrendingUp} title="Penguasaan kelas dari waktu ke waktu" sub="Rata-rata pemahaman seluruh kelas" right={<Pill tone="green">Tren naik</Pill>} />
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={masteryTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.38} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" stroke="rgba(46,42,94,0.06)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: C.textSoft, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: C.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "none", borderRadius: 14, boxShadow: C.shadowSm, fontFamily: BODY, fontSize: 12.5, color: C.text }} />
                <Area type="monotone" dataKey="mastery" stroke={C.primary} strokeWidth={3.5} fill="url(#area)" dot={{ r: 4, fill: C.primary, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card delay={260} style={{ padding: 24 }}>
          <SectionTitle icon={CircuitBoard} title="Profil keterampilan" sub="Rata-rata kelas per konsep" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillRadar} outerRadius="72%">
                <PolarGrid stroke="rgba(46,42,94,0.12)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: C.textSoft, fontSize: 11.5, fontWeight: 600 }} />
                <Radar dataKey="value" stroke={C.primaryDeep} strokeWidth={2.5} fill={C.primary} fillOpacity={0.35} />
                <Tooltip contentStyle={{ background: "#fff", border: "none", borderRadius: 14, boxShadow: C.shadowSm, fontFamily: BODY, fontSize: 12.5, color: C.text }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI insights — the novelty */}
      <Card delay={320} style={{ padding: 24, background: `linear-gradient(140deg, ${C.primarySoft}, #FBFAFF)` }}>
        <SectionTitle icon={Brain} title="Wawasan AI" sub="Lentera tidak hanya menilai — tapi juga mendiagnosis kelas dan papan" right={<Pill tone="purple">Langsung</Pill>} />
        <div style={{ display: "grid", gap: 13, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {insights.map((ins, i) => {
            const tones: Record<string, [string, string]> = {
              warn: [C.pinkSoft, "#DB2777"], purple: [C.primarySoft, C.primaryDeep],
              blue: [C.blueSoft, "#0284C7"], green: [C.greenSoft, "#0F9D6B"],
            };
            const [bg, fg] = tones[ins.tone];
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 17, border: "1px solid rgba(139,92,246,0.1)", display: "flex", gap: 13 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <ins.icon size={20} color={fg} />
                </div>
                <div>
                  <Pill tone={ins.tone}>{ins.tag}</Pill>
                  <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5, marginTop: 8 }}>{ins.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* students */}
      <Card delay={380} style={{ padding: 24 }}>
        <SectionTitle
          icon={GraduationCap}
          title="Siswa"
          sub="Kelas 8B · Kelistrikan"
          right={
            <button
              onClick={() => setShowAllStudents((v) => !v)}
              style={{ background: C.primary, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 99, fontWeight: 700, fontSize: 13 }}
            >
              {showAllStudents ? "Ciutkan" : "Lihat semua"}
            </button>
          }
        />
        <div className="flex items-center" style={{ gap: 8, marginBottom: 12, border: "1px solid rgba(139,92,246,0.12)", background: "#fff", borderRadius: 12, padding: "9px 12px" }}>
          <Search size={16} color={C.textSoft} />
          <input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Cari nama siswa atau status..."
            aria-label="Cari siswa"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: C.text, fontFamily: BODY }}
          />
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {filteredStudents.slice(0, showAllStudents ? filteredStudents.length : 5).map((st) => (
            <div key={st.name} className="navitem" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 2fr auto", gap: 14, alignItems: "center", padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.08)" }}>
              <div className="flex items-center" style={{ gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: C.primarySoft, display: "grid", placeItems: "center", fontWeight: 800, color: C.primaryDeep, fontFamily: HEAD, fontSize: 14 }}>
                  {st.name[0]}
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{st.name}</span>
              </div>
              <span style={{ fontSize: 13, color: C.textSoft, fontWeight: 600 }}>{st.level}</span>
              <div className="flex items-center" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}><ProgressBar value={st.mastery} color={st.mastery > 80 ? C.green : st.mastery > 55 ? C.primary : C.pink} h={8} /></div>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.text, width: 40, textAlign: "right" }}>{st.mastery}%</span>
              </div>
              <Pill tone={st.status[0]}>{st.status[1]}</Pill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* =============================================================== PARENT */
interface TeacherNote { date: string; text: string; tag: string; tone: string; }
const teacherNotes: TeacherNote[] = [
  { date: "8 Jul 2026", text: "Kai sudah menguasai rangkaian seri dan bisa merakitnya tanpa bantuan.", tag: "Berkembang pesat", tone: "green" },
  { date: "3 Jul 2026", text: "Masih sering tertukar kutub + dan − baterai. Perlu lebih banyak latihan meraba tekstur kutub di rumah.", tag: "Perlu latihan", tone: "warn" },
  { date: "28 Jun 2026", text: "Sangat aktif bertanya kepada AI Tutor dan pantang menyerah saat rangkaian tidak berfungsi.", tag: "Catatan positif", tone: "purple" },
  { date: "20 Jun 2026", text: "Baru mengenal komponen dasar. Perlu bimbingan dekat di sesi lab pertama.", tag: "Baru mulai", tone: "blue" },
];

const childProgress = [
  { week: "M1", mastery: 28 }, { week: "M2", mastery: 40 }, { week: "M3", mastery: 51 },
  { week: "M4", mastery: 58 }, { week: "M5", mastery: 64 }, { week: "M6", mastery: 72 },
];

const parentTips = [
  "Ajak Kai meraba kembali kutub + dan − baterai sebelum lanjut ke rangkaian paralel — bagian ini masih perlu diperkuat menurut catatan guru.",
  "Dengarkan bersama rekaman/percakapan AI Tutor dari pelajaran yang sudah selesai, lalu tanyakan apa yang masih Kai ingat.",
  "Rayakan pencapaian kecil (seperti lencana baru) agar Kai tetap termotivasi berlatih mandiri di rumah.",
];

function AskAIParent() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const ask = async () => {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    setErr("");
    setAnswer("");
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `(Pertanyaan ini dari orang tua siswa, bukan langsung dari siswa) ${question}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Terjadi kesalahan yang tidak terduga.");
        return;
      }
      setAnswer(data.text);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="flex items-center" style={{ gap: 9 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder="contoh: Bagaimana cara membantu Kai berlatih rangkaian paralel di rumah?"
          disabled={loading}
          style={{ flex: 1, border: "1px solid rgba(139,92,246,0.2)", background: "#fff", borderRadius: 12, padding: "11px 14px", fontSize: 13.5, color: C.text, fontFamily: BODY, outline: "none" }}
        />
        <button onClick={ask} disabled={loading} style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, border: "none", display: "grid", placeItems: "center", flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
          {loading ? <Loader2 size={18} color="#fff" className="spin" /> : <Send size={18} color="#fff" />}
        </button>
      </div>
      {err && (
        <div className="flex items-center" style={{ gap: 8, fontSize: 12.5, color: "#DB2777", background: C.pinkSoft, padding: "9px 13px", borderRadius: 12, fontWeight: 600 }}>
          <AlertTriangle size={14} /> {err}
        </div>
      )}
      {answer && (
        <div style={{ padding: "13px 16px", borderRadius: 14, background: "#fff", border: "1px solid rgba(139,92,246,0.12)", fontSize: 13.5, color: C.text, lineHeight: 1.55 }}>
          {answer}
        </div>
      )}
    </div>
  );
}

const parentStats: Stat[] = [
  { label: "Progres keseluruhan", value: "72%", icon: TrendingUp, color: C.primary, sub: "+8% dari minggu lalu" },
  { label: "Lencana diraih", value: "4 / 6", icon: Award, color: "#F59E0B", sub: "2 lagi untuk mencapai Master Rangkaian" },
  { label: "Runtutan belajar", value: "7 hari", icon: Flame, color: C.pink, sub: "runtutan saat ini" },
];

function ParentDashboard() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* summary strip */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {parentStats.map((s, i) => (
          <Card key={s.label} delay={i * 60} style={{ padding: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `${s.color}22`, display: "grid", placeItems: "center" }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 32, color: C.text, marginTop: 14, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 6 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="row2 row2-a">
        {/* teacher notes */}
        <Card delay={160} style={{ padding: 24 }}>
          <SectionTitle icon={BookOpen} title="Laporan Guru" sub="Catatan progres Kai dari Bu Sari" />
          <div style={{ display: "grid", gap: 12, marginTop: 6 }}>
            {teacherNotes.map((n, i) => (
              <div key={i} style={{ padding: 15, borderRadius: 16, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 7, gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.textSoft }}>{n.date}</span>
                  <Pill tone={n.tone}>{n.tag}</Pill>
                </div>
                <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{n.text}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* progress chart */}
        <Card delay={220} style={{ padding: 24 }}>
          <SectionTitle icon={TrendingUp} title="Progres Belajar Anak" sub="Rata-rata pemahaman Kai per minggu" right={<Pill tone="green">Tren naik</Pill>} />
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={childProgress} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaParent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.38} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" stroke="rgba(46,42,94,0.06)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: C.textSoft, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: C.textSoft, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "none", borderRadius: 14, boxShadow: C.shadowSm, fontFamily: BODY, fontSize: 12.5, color: C.text }} />
                <Area type="monotone" dataKey="mastery" stroke={C.primary} strokeWidth={3.5} fill="url(#areaParent)" dot={{ r: 4, fill: C.primary, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI suggestions for parent */}
      <Card delay={280} style={{ padding: 24 }}>
        <SectionTitle icon={Sparkles} title="Saran AI untuk Orang Tua" sub="Cara mendampingi belajar Kai di rumah berdasarkan progres terkini" />
        <div style={{ display: "grid", gap: 10, marginBottom: 20, marginTop: 4 }}>
          {parentTips.map((tip, i) => (
            <div key={i} className="flex items-start" style={{ gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.primarySoft, color: C.primaryDeep, fontWeight: 800, fontSize: 11.5, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55 }}>{tip}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(139,92,246,0.1)", paddingTop: 18 }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 10, fontSize: 13, fontWeight: 800, color: C.text }}>
            <Mic size={15} color={C.primaryDeep} /> Tanya AI Tutor
          </div>
          <AskAIParent />
        </div>
      </Card>
    </div>
  );
}
interface Msg { role: "ai" | "user"; text: string; note?: string | null; error?: boolean; }

interface CircuitState {
  battery_connected: boolean;
  switch_state: "on" | "off";
  lamp_connected: boolean;
  circuit_closed: boolean;
  polarity_correct: boolean;
}

interface Scenario { id: string; label: string; icon: LucideIcon; state: CircuitState; prompt: string; }
const scenarios: Scenario[] = [
  {
    id: "polarity",
    label: "Polaritas Terbalik",
    icon: AlertTriangle,
    state: { battery_connected: true, switch_state: "on", lamp_connected: true, circuit_closed: true, polarity_correct: false },
    prompt: "Saya sudah menyambungkan semua kabel, tapi lampu tidak menyala. Mengapa?",
  },
  {
    id: "open",
    label: "Rangkaian Terbuka",
    icon: Unlink2,
    state: { battery_connected: true, switch_state: "off", lamp_connected: true, circuit_closed: false, polarity_correct: true },
    prompt: "Saya sudah menggerakkan saklar, tapi lampu masih mati.",
  },
  {
    id: "closed",
    label: "Rangkaian Berfungsi",
    icon: CheckCircle2,
    state: { battery_connected: true, switch_state: "on", lamp_connected: true, circuit_closed: true, polarity_correct: true },
    prompt: "Saya sudah selesai merakit rangkaian. Tolong periksa apakah sudah benar.",
  },
];

function AITutor() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Halo! Siap merakit rangkaian hari ini? Raba papanmu kapan saja, atau coba tombol simulasi di bawah untuk menguji beberapa skenario.", note: null },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [circuitState, setCircuitState] = useState<CircuitState | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voices load asynchronously in most browsers — populate the list once
  // available, and again whenever the browser updates it.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Utamakan suara Bahasa Indonesia
  const idVoice =
    voices.find((v) => v.lang.toLowerCase() === "id-id") ||
    voices.find((v) => v.lang.toLowerCase().startsWith("id")) ||
    null;

  const speak = (text: string) => {
    if (!voiceOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(normalizeIndonesianPhonetics(text));
    if (idVoice) {
      utter.voice = idVoice;
      utter.lang = idVoice.lang;
    } else {
      utter.lang = "id-ID";
    }
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  const callTutor = async (userText: string, state?: CircuitState | null) => {
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          circuitState: state ?? circuitState,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: "ai", text: `Tidak dapat terhubung ke AI: ${data.error ?? "kesalahan tidak diketahui"}. Periksa apakah GROQ_API_KEY sudah terkonfigurasi di .env.local.`, error: true }]);
        return;
      }
      setMessages((m) => [...m, { role: "ai", text: data.text, note: data.note }]);
      speak(data.text);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: `Gagal menghubungi server: ${(err as Error).message}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setInput("");
    callTutor(t);
  };

  const runScenario = (s: Scenario) => {
    setCircuitState(s.state);
    callTutor(s.prompt, s.state);
  };

  const chips = ["Pandu saya langkah demi langkah", "Jelaskan arah arus listrik", "Saya sudah selesai!"];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card hover={false} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "min(64vh, 600px)" }}>
        {/* header */}
        <div className="flex items-center justify-between" style={{ padding: "16px 22px", borderBottom: "1px solid rgba(139,92,246,0.1)", background: "rgba(255,255,255,0.5)" }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`, display: "grid", placeItems: "center", boxShadow: C.shadowSm }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 16, color: C.text }}>Lentera AI Tutor</div>
              <div className="flex items-center" style={{ gap: 6, fontSize: 12, color: C.textSoft, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} /> Explain-Before-Answer engine · Groq (Llama 3.3)
              </div>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            {voiceOn && (
              <div className="hidden lg:flex items-center" style={{ gap: 6, fontSize: 11, fontWeight: 700, color: idVoice ? C.green : "#DB2777", background: idVoice ? C.greenSoft : C.pinkSoft, padding: "5px 10px", borderRadius: 99 }}>
                {idVoice ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {idVoice ? `Suara Indonesia: ${idVoice.name}` : "Suara default (id-ID)"}
              </div>
            )}
            <button
              aria-label={voiceOn ? "Matikan suara" : "Nyalakan suara"}
              onClick={() => { setVoiceOn((v) => !v); if (voiceOn && "speechSynthesis" in window) window.speechSynthesis.cancel(); }}
              style={{ width: 40, height: 40, borderRadius: 12, background: C.primarySoft, border: "none", display: "grid", placeItems: "center" }}
            >
              {voiceOn ? <Volume2 size={19} color={C.primaryDeep} /> : <VolumeX size={19} color={C.textSoft} />}
            </button>
          </div>
        </div>

        {/* messages */}
        <div className="cs-scroll" style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "76%" }}>
                <div
                  style={{
                    padding: "13px 17px", borderRadius: 20, fontSize: 14, lineHeight: 1.55,
                    ...(m.role === "user"
                      ? { background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, color: "#fff", borderBottomRightRadius: 6 }
                      : m.error
                      ? { background: C.pinkSoft, color: "#DB2777", border: "1px solid rgba(219,39,119,0.2)", borderBottomLeftRadius: 6 }
                      : { background: "#fff", color: C.text, border: "1px solid rgba(139,92,246,0.12)", borderBottomLeftRadius: 6, boxShadow: C.shadowSm }),
                  }}
                >
                  {m.text}
                </div>
                {m.note && (
                  <div className="flex items-center" style={{ gap: 6, marginTop: 7, marginLeft: 4, fontSize: 11.5, fontWeight: 700, color: C.primaryDeep, background: C.primarySoft, padding: "5px 10px", borderRadius: 99, width: "fit-content" }}>
                    <Brain size={13} /> {m.note}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex" }}>
              <div className="flex items-center" style={{ gap: 8, background: "#fff", border: "1px solid rgba(139,92,246,0.12)", padding: "13px 18px", borderRadius: 20, borderBottomLeftRadius: 6, fontSize: 13, color: C.textSoft, fontWeight: 600 }}>
                <Loader2 size={15} className="spin" /> Sedang berpikir…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* quick chips */}
        <div className="flex" style={{ gap: 8, padding: "0 22px 12px", flexWrap: "wrap" }}>
          {chips.map((c) => (
            <button key={c} className="chip" onClick={() => send(c)} disabled={loading} style={{ background: C.primarySoft, color: C.primaryDeep, border: "1px solid rgba(139,92,246,0.18)", padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 700, opacity: loading ? 0.5 : 1 }}>
              {c}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="flex items-center" style={{ gap: 10, padding: "14px 18px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(255,255,255,0.6)" }}>
          <button aria-label="Input suara" style={{ width: 44, height: 44, borderRadius: 14, background: C.pinkSoft, border: "none", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Mic size={20} color={C.pink} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Tanyakan apa saja ke LENTERA…"
            disabled={loading}
            style={{ flex: 1, border: "1px solid rgba(139,92,246,0.18)", background: "#fff", borderRadius: 14, padding: "13px 16px", fontSize: 14, color: C.text, fontFamily: BODY, outline: "none" }}
          />
          <button aria-label="Kirim" onClick={() => send()} disabled={loading} style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, border: "none", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: C.shadowSm, opacity: loading ? 0.6 : 1 }}>
            <Send size={19} color="#fff" />
          </button>
        </div>
      </Card>

      {/* simulator panel — for testing/demo without hardware */}
      <Card style={{ padding: 22 }}>
        <SectionTitle
          icon={SlidersHorizontal}
          title="Panel Simulasi"
          sub="Uji alur AI Tutor tanpa perangkat fisik — berguna untuk latihan demo"
          right={circuitState && (
            <button onClick={() => setCircuitState(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid rgba(139,92,246,0.2)", color: C.textSoft, padding: "7px 12px", borderRadius: 99, fontSize: 12.5, fontWeight: 700 }}>
              <RefreshCw size={13} /> Reset
            </button>
          )}
        />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => runScenario(s)}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(139,92,246,0.14)", background: "rgba(255,255,255,0.6)", textAlign: "left", opacity: loading ? 0.6 : 1 }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, background: C.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <s.icon size={19} color={C.primaryDeep} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{s.label}</div>
            </button>
          ))}
        </div>
        {circuitState && (
          <div className="flex items-center" style={{ gap: 8, marginTop: 14, fontSize: 12, color: C.textSoft, fontWeight: 600, flexWrap: "wrap" }}>
            <PlugZap size={14} /> Status simulasi: baterai {circuitState.battery_connected ? "✓" : "✗"} · saklar {circuitState.switch_state === "on" ? "ON" : "OFF"} · lampu {circuitState.lamp_connected ? "✓" : "✗"} · jalur {circuitState.circuit_closed ? "tertutup" : "terbuka"} · polaritas {circuitState.polarity_correct ? "benar" : "terbalik"}
          </div>
        )}
      </Card>
    </div>
  );
}

/* =============================================================== HANDBOOK */
function MiniBattery({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-16" y="-10" width="32" height="20" rx="4" fill="#fff" stroke={C.primaryDeep} strokeWidth="2.4" />
      <line x1="-8" y1="-10" x2="-8" y2="10" stroke={C.primaryDeep} strokeWidth="3.4" />
      <line x1="7" y1="-5" x2="7" y2="5" stroke={C.primaryDeep} strokeWidth="2" />
      <text x="-17" y="-14" fontFamily={HEAD} fontSize="11" fontWeight={800} fill={C.primaryDeep}>+</text>
      <text x="8" y="-14" fontFamily={HEAD} fontSize="11" fontWeight={800} fill={C.textSoft}>−</text>
    </g>
  );
}

function MiniLamp({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g transform={`translate(${x},${y})`} className={on ? "lamp" : ""}>
      <circle r="13" fill={on ? C.yellow : "#EDEBF5"} stroke={on ? "#F59E0B" : "rgba(124,119,166,0.4)"} strokeWidth="2" />
      <path d="M-5 5 L0 13 L5 5" fill="none" stroke={on ? "#B45309" : "rgba(124,119,166,0.5)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function MiniSwitch({ x, y, closed }: { x: number; y: number; closed: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="-13" cy="0" r="3" fill={C.primaryDeep} />
      <circle cx="13" cy="0" r="3" fill={C.primaryDeep} />
      <line x1="-13" y1="0" x2={closed ? 13 : 3} y2={closed ? 0 : -16} stroke={C.primaryDeep} strokeWidth="2.8" strokeLinecap="round" />
    </g>
  );
}

function Wire({ x1, y1, x2, y2, dashed = false }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={dashed ? "rgba(124,119,166,0.45)" : C.primary}
      strokeWidth="4" strokeLinecap="round"
      strokeDasharray={dashed ? "3 7" : undefined}
    />
  );
}

function CurrentDots({ path }: { path: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <circle key={i} r="3.6" fill={i % 2 ? C.pink : C.primary} className="dot">
          <animateMotion path={path} dur="2.6s" begin={`${i * 0.85}s`} repeatCount="indefinite" rotate="auto" />
        </circle>
      ))}
    </>
  );
}

function CircuitDiagram({ variant }: { variant: "closed" | "open" | "series" | "parallel" }) {
  const label: Record<string, string> = {
    closed: "Rangkaian tertutup — jalur tersambung penuh, arus mengalir, dan lampu menyala.",
    open: "Rangkaian terbuka — jalur terputus, arus tidak dapat mengalir, dan lampu mati.",
    series: "Rangkaian seri — komponen disusun berurutan dalam satu jalur tunggal.",
    parallel: "Rangkaian paralel — komponen disusun bercabang, masing-masing cabang memiliki jalurnya sendiri.",
  };
  const loopPath = "M60,40 L260,40 L260,130 L60,130 Z";
  const branchPath = "M60,40 L230,40 L230,130 L60,130 Z";

  return (
    <div>
      <svg viewBox="0 0 340 170" style={{ width: "100%", maxWidth: 380 }} role="img" aria-label={label[variant]}>
        <Wire x1={60} y1={40} x2={60} y2={130} />
        <Wire x1={60} y1={130} x2={144} y2={130} />
        <MiniBattery x={160} y={130} />
        <Wire x1={176} y1={130} x2={260} y2={130} />

        {variant === "closed" && (
          <>
            <Wire x1={60} y1={40} x2={144} y2={40} />
            <MiniSwitch x={160} y={40} closed />
            <Wire x1={176} y1={40} x2={260} y2={40} />
            <Wire x1={260} y1={40} x2={260} y2={72} />
            <MiniLamp x={260} y={85} on />
            <Wire x1={260} y1={98} x2={260} y2={130} />
            <CurrentDots path={loopPath} />
          </>
        )}

        {variant === "open" && (
          <>
            <Wire x1={60} y1={40} x2={144} y2={40} />
            <MiniSwitch x={160} y={40} closed={false} />
            <Wire x1={176} y1={40} x2={260} y2={40} dashed />
            <Wire x1={260} y1={40} x2={260} y2={72} />
            <MiniLamp x={260} y={85} on={false} />
            <Wire x1={260} y1={98} x2={260} y2={130} />
          </>
        )}

        {variant === "series" && (
          <>
            <Wire x1={60} y1={40} x2={260} y2={40} />
            <Wire x1={260} y1={40} x2={260} y2={57} />
            <MiniLamp x={260} y={70} on />
            <Wire x1={260} y1={83} x2={260} y2={87} />
            <MiniLamp x={260} y={100} on />
            <Wire x1={260} y1={113} x2={260} y2={130} />
            <CurrentDots path={loopPath} />
          </>
        )}

        {variant === "parallel" && (
          <>
            <Wire x1={60} y1={40} x2={260} y2={40} />
            <circle cx={260} cy={40} r="3.6" fill={C.primaryDeep} />
            <circle cx={260} cy={130} r="3.6" fill={C.primaryDeep} />
            <Wire x1={260} y1={40} x2={230} y2={40} />
            <Wire x1={230} y1={40} x2={230} y2={72} />
            <MiniLamp x={230} y={85} on />
            <Wire x1={230} y1={98} x2={230} y2={130} />
            <Wire x1={230} y1={130} x2={260} y2={130} />
            <Wire x1={260} y1={40} x2={296} y2={40} />
            <Wire x1={296} y1={40} x2={296} y2={72} />
            <MiniLamp x={296} y={85} on />
            <Wire x1={296} y1={98} x2={296} y2={130} />
            <Wire x1={296} y1={130} x2={260} y2={130} />
            <CurrentDots path={branchPath} />
          </>
        )}
      </svg>
      <div style={{ textAlign: "center", fontSize: 12.5, color: C.textSoft, fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>
        {label[variant]}
      </div>
    </div>
  );
}

/** Small isometric-style block illustration mimicking the real 3D-printed
 * component casings — flat colors, no photos, matches the app's design system. */
function IsoBlock({ front, side, symbol }: { front: string; side: string; symbol: "battery" | "switch" | "lamp" | "cable" }) {
  const w = 74, d = 26, h = 62, x = 10, y = 14;
  const top = [
    [x + d, y], [x + d + w, y], [x + w, y + d], [x, y + d],
  ];
  const frontFace = { x, y: y + d, w, h };
  const sideFace = [
    [x + w, y + d], [x + w + d, y], [x + w + d, y + h], [x + w, y + d + h],
  ];
  const pts = (arr: number[][]) => arr.map((p) => p.join(",")).join(" ");

  return (
    <svg viewBox="0 0 122 112" style={{ width: 78, height: 72 }} aria-hidden="true">
      <polygon points={pts(top)} fill="#fff" stroke="rgba(124,119,166,0.25)" strokeWidth="1" />
      <rect x={frontFace.x} y={frontFace.y} width={frontFace.w} height={frontFace.h} rx="3" fill={front} />
      <polygon points={pts(sideFace)} fill={side} />
      {/* braille-style dot texture on the front face */}
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => (
          <circle key={`${row}-${col}`} cx={frontFace.x + 14 + col * 11} cy={frontFace.y + frontFace.h - 16 + row * 9} r="1.6" fill="rgba(255,255,255,0.55)" />
        ))
      )}
      {/* symbol on the top face */}
      {symbol === "battery" && (
        <>
          <text x={x + d + 16} y={y + 17} fontFamily={HEAD} fontWeight={800} fontSize="13" fill={side}>+</text>
          <text x={x + d + w - 20} y={y + 17} fontFamily={HEAD} fontWeight={800} fontSize="13" fill={side}>−</text>
        </>
      )}
      {symbol === "switch" && (
        <line x1={x + d + 18} y1={y + 13} x2={x + d + w - 18} y2={y + 13} stroke={side} strokeWidth="3" strokeLinecap="round" />
      )}
      {symbol === "lamp" && <circle cx={x + d + w / 2} cy={y + 13} r="4.5" fill="none" stroke={side} strokeWidth="2.4" />}
      {symbol === "cable" && (
        <path d={`M${x + d + 16},${y + 13} q8,-7 16,0 q8,7 16,0`} fill="none" stroke={side} strokeWidth="2.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

interface TactilePart { name: string; symbol: "battery" | "switch" | "lamp" | "cable"; front: string; side: string; braille: string; texture: string; }
const tactileParts: TactilePart[] = [
  { name: "Baterai", symbol: "battery", front: C.blue, side: "#1D4ED8", braille: "Braille “B” + tanda plus/minus timbul", texture: "Kedua kutub bertanda taktil timbul: simbol plus (+) dan simbol minus (-)" },
  { name: "Saklar", symbol: "switch", front: C.green, side: "#15803D", braille: "Braille “S” + tuas klik", texture: "Tuas timbul yang dapat digeser ON/OFF dengan rabaan" },
  { name: "Lampu", symbol: "lamp", front: "#F59E0B", side: "#B45309", braille: "Braille “L” + permukaan bulat timbul", texture: "Terasa hangat / bergetar halus saat dinyalakan" },
  { name: "Kabel", symbol: "cable", front: C.primary, side: C.primaryDeep, braille: "Jalur karet timbul di sepanjang papan", texture: "Kasar dan timbul dibanding permukaan papan" },
];

function TactilePartCard({ part, delay }: { part: TactilePart; delay: number }) {
  return (
    <div className="rise" style={{ animationDelay: `${delay}ms`, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.65)", border: "1px solid rgba(139,92,246,0.1)" }}>
      <div className="flex items-center" style={{ gap: 13, marginBottom: 10 }}>
        <div style={{ width: 78, height: 72, flexShrink: 0, display: "grid", placeItems: "center" }}>
          <IsoBlock front={part.front} side={part.side} symbol={part.symbol} />
        </div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 15, color: C.text }}>{part.name}</div>
      </div>
      <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>{part.texture}</div>
      <div className="flex items-center" style={{ gap: 6, fontSize: 11.5, fontWeight: 700, color: C.primaryDeep, background: C.primarySoft, padding: "6px 10px", borderRadius: 99 }}>
        <Fingerprint size={13} /> {part.braille}
      </div>
    </div>
  );
}

interface HandbookSection {
  id: string;
  title: string;
  icon: LucideIcon;
  badge: string;
  summary: string;
  points: string[];
  tip: string;
  diagram?: "closed-open" | "series" | "parallel" | "intro";
}
const handbookSections: HandbookSection[] = [
  {
    id: "pengertian",
    title: "Pengertian Rangkaian Listrik",
    icon: CircuitBoard,
    badge: "Dasar",
    summary: "Rangkaian listrik adalah jalur yang dilalui arus listrik dari sumber (baterai), melalui komponen seperti kabel, saklar, dan lampu, lalu kembali ke sumber.",
    points: [
      "Arus hanya dapat mengalir saat jalurnya tersambung utuh dari awal sampai akhir tanpa putus.",
      "Papan LENTERA menggunakan baterai sebagai sumber energi, dengan dua kutub: + (positif) dan − (negatif).",
      "Bayangkan seperti air yang mengalir dalam pipa melingkar — jika pipa bocor atau terputus, aliran akan berhenti.",
    ],
    tip: "Ajak siswa menelusuri jalur papan LENTERA dengan jari, mulai dari kutub + baterai hingga kembali ke kutub −. Biarkan mereka menyadari bahwa jalur harus membentuk loop tertutup agar arus bisa “mengalir”.",
    diagram: "intro",
  },
  {
    id: "komponen",
    title: "Komponen Listrik untuk Siswa Tunanetra",
    icon: Fingerprint,
    badge: "Alat",
    summary: "Setiap komponen di Papan LENTERA dimodifikasi dengan label Braille, tekstur, dan bentuk timbul yang berbeda agar dapat dikenali lewat rabaan tanpa melihat.",
    points: [
      "Setiap balok komponen memiliki bentuk dan tekstur permukaan berbeda untuk kemudahan identifikasi.",
      "Label Braille diletakkan di sisi setiap balok untuk mengenali komponen.",
      "Jalur kabel berupa rel karet timbul di papan grid, dengan tekstur yang lebih kasar daripada permukaan papan.",
    ],
    tip: "Sebelum merakit rangkaian, minta siswa meraba dan mengenali setiap balok komponen (baterai, saklar, lampu, kabel) satu per satu — ini adalah tahap “pengenalan komponen” dalam alur belajar LENTERA.",
  },
  {
    id: "jenis",
    title: "Jenis Rangkaian: Terbuka & Tertutup",
    icon: Link2,
    badge: "Konsep",
    summary: "Rangkaian tertutup adalah jalur listrik yang tersambung penuh sehingga arus mengalir dan lampu menyala. Rangkaian terbuka terputus di satu titik, sehingga arus berhenti dan lampu mati.",
    points: [
      "Tertutup: semua sambungan aman, saklar ON → lampu menyala.",
      "Terbuka: kabel terlepas atau saklar OFF → lampu mati.",
      "Saklar adalah komponen yang sengaja digunakan untuk membuka atau menutup jalur listrik.",
    ],
    tip: "Gunakan saklar untuk demonstrasi langsung: minta siswa menggeser ke ON (tertutup) lalu OFF (terbuka), dan rasakan/dengarkan perbedaannya — lampu menyala versus mati.",
    diagram: "closed-open",
  },
  {
    id: "seri",
    title: "Rangkaian Seri",
    icon: Layers,
    badge: "Praktik",
    summary: "Pada rangkaian seri, komponen seperti dua lampu disusun berurutan satu demi satu dalam satu jalur tunggal.",
    points: [
      "Arus yang sama mengalir melewati setiap komponen secara berurutan.",
      "Ciri utamanya: jika satu lampu dilepas atau terputus, semua lampu lain ikut mati karena jalurnya putus total.",
      "Di Papan LENTERA, siswa merakit dua lampu berurutan dalam satu jalur lurus.",
    ],
    tip: "Minta siswa merakit dua lampu berurutan lalu melepas salah satunya. Biarkan mereka menyadari bahwa lampu lainnya ikut mati — pengalaman kunci untuk memahami rangkaian seri.",
    diagram: "series",
  },
  {
    id: "paralel",
    title: "Rangkaian Paralel",
    icon: GitBranch,
    badge: "Praktik",
    summary: "Pada rangkaian paralel, komponen disusun bercabang — setiap komponen memiliki jalurnya sendiri kembali ke baterai.",
    points: [
      "Jika satu lampu dilepas, lampu lainnya tetap menyala karena jalurnya tetap tersambung.",
      "Ini berguna untuk instalasi rumah karena setiap perangkat bisa dinyalakan atau dimatikan secara terpisah.",
      "Di Papan LENTERA, siswa merakit dua lampu pada dua cabang rangkaian yang terpisah.",
    ],
    tip: "Setelah mencoba rangkaian seri, bandingkan di papan yang sama: lepas satu lampu dari rangkaian paralel dan biarkan siswa merasakan perbedaannya — lampu lainnya tetap menyala.",
    diagram: "parallel",
  },
];

function TeacherHandbook() {
  const [active, setActive] = useState(0);
  const section = handbookSections[active];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Card delay={0} style={{ padding: 24, background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDeep} 100%)`, border: "none", color: "#fff" }}>
        <div className="flex items-center justify-between" style={{ gap: 14, flexWrap: "wrap" }}>
          <div className="flex items-center" style={{ gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center" }}>
              <BookOpen size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 19 }}>Handbook Guru Digital</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3, maxWidth: 480 }}>
                Materi rangkaian listrik sederhana yang dirancang sebagai panduan mengajar untuk siswa tunanetra dan low vision di tingkat SMPLB.
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} style={{ background: "#fff", color: C.primaryDeep, border: "none", padding: "11px 18px", borderRadius: 99, fontWeight: 800, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Printer size={16} /> Cetak / Unduh
          </button>
        </div>
      </Card>

      <div className="row2 row2-handbook">
        {/* section rail */}
        <Card delay={60} style={{ padding: 12 }} hover={false}>
          <div style={{ display: "grid", gap: 6 }}>
            {handbookSections.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  className="navitem"
                  style={{
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    padding: "13px 14px", borderRadius: 16, border: "none",
                    background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})` : "transparent",
                    color: isActive ? "#fff" : C.text,
                    boxShadow: isActive ? C.shadowSm : "none",
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: isActive ? "rgba(255,255,255,0.2)" : C.primarySoft }}>
                    <s.icon size={17} color={isActive ? "#fff" : C.primaryDeep} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: isActive ? 0.85 : 0.55, letterSpacing: 0.5 }}>{s.badge.toUpperCase()} · {i + 1}/5</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, marginTop: 1 }}>{s.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* content */}
        <Card delay={120} style={{ padding: 26 }}>
          <SectionTitle icon={section.icon} title={section.title} sub={`Bagian ${active + 1} dari 5 · Handbook LENTERA`} right={<Pill tone="purple">{section.badge}</Pill>} />

          <p style={{ fontSize: 14.5, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>{section.summary}</p>

          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            {section.points.map((p, i) => (
              <div key={i} className="flex items-start" style={{ gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.primarySoft, color: C.primaryDeep, fontWeight: 800, fontSize: 11.5, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55 }}>{p}</div>
              </div>
            ))}
          </div>

          {/* diagrams / illustrations */}
          {section.diagram === "intro" && (
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 20px" }}>
              <LiveCircuit />
            </div>
          )}
          {section.diagram === "closed-open" && (
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", padding: "6px 0 20px" }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.1)" }}><CircuitDiagram variant="closed" /></div>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.1)" }}><CircuitDiagram variant="open" /></div>
            </div>
          )}
          {section.diagram === "series" && (
            <div style={{ padding: "6px 0 20px", maxWidth: 420, margin: "0 auto" }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.1)" }}><CircuitDiagram variant="series" /></div>
            </div>
          )}
          {section.diagram === "parallel" && (
            <div style={{ padding: "6px 0 20px", maxWidth: 420, margin: "0 auto" }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(139,92,246,0.1)" }}><CircuitDiagram variant="parallel" /></div>
            </div>
          )}
          {section.id === "komponen" && (
            <div style={{ display: "grid", gap: 13, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", padding: "6px 0 20px" }}>
              {tactileParts.map((p, i) => <TactilePartCard key={p.name} part={p} delay={i * 60} />)}
            </div>
          )}

          {/* teaching tip */}
          <div style={{ display: "flex", gap: 13, padding: 17, borderRadius: 18, background: `linear-gradient(135deg, ${C.primarySoft}, ${C.pinkSoft})` }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Hand size={19} color={C.primaryDeep} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.primaryDeep, marginBottom: 4 }}>Tips Mengajar</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{section.tip}</div>
            </div>
          </div>

          {/* prev/next */}
          <div className="flex items-center justify-between" style={{ marginTop: 22 }}>
            <button
              onClick={() => setActive((v) => Math.max(0, v - 1))}
              disabled={active === 0}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: `1px solid rgba(139,92,246,0.2)`, color: active === 0 ? "rgba(124,119,166,0.4)" : C.text, padding: "10px 16px", borderRadius: 99, fontWeight: 700, fontSize: 13 }}
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            <button
              onClick={() => setActive((v) => Math.min(handbookSections.length - 1, v + 1))}
              disabled={active === handbookSections.length - 1}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: active === handbookSections.length - 1 ? "rgba(139,92,246,0.15)" : `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, border: "none", color: active === handbookSections.length - 1 ? "rgba(124,119,166,0.5)" : "#fff", padding: "10px 18px", borderRadius: 99, fontWeight: 700, fontSize: 13, boxShadow: active === handbookSections.length - 1 ? "none" : C.shadowSm }}
            >
              Selanjutnya <ChevronRight size={16} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =============================================================== LOGIN */
function LoginPage({ onLogin }: { onLogin: (role: "student" | "teacher" | "parent", email: string, password: string) => void | Promise<void> }) {
  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roleCopy = {
    student: {
      title: "Masuk sebagai Siswa",
      desc: "Lanjutkan pelajaranmu, raih lencana, dan belajar merakit rangkaian bersama AI Tutor.",
      cta: "Masuk & Mulai Belajar",
      placeholder: "student@lentera.demo",
      label: "Email",
    },
    teacher: {
      title: "Masuk sebagai Guru",
      desc: "Pantau progres kelas dan buka Handbook Digital untuk mengajar siswa tunanetra dan low vision.",
      cta: "Buka Dashboard Guru",
      placeholder: "teacher@lentera.demo",
      label: "Email",
    },
    parent: {
      title: "Masuk sebagai Orang Tua",
      desc: "Lihat laporan guru, progres belajar anak, dan panduan belajar di rumah.",
      cta: "Buka Dashboard Orang Tua",
      placeholder: "parent@lentera.demo",
      label: "Email",
    },
  }[role];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    if (!email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    if (!password.trim()) {
      setError("Password wajib diisi.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onLogin(role, email.trim(), password);
    } catch (err) {
      setError((err as Error).message || "Gagal masuk. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const roleTabs: [typeof role, string, LucideIcon][] = [
    ["student", "Siswa", User],
    ["teacher", "Guru", GraduationCap],
    ["parent", "Orang Tua", Hand],
  ];

  return (
    <div style={{ height: "100vh", overflow: "hidden", fontFamily: BODY, color: C.text, position: "relative" }}>
      <Background />
      <div className="cs-scroll login-wrap" style={{ position: "relative", zIndex: 10, height: "100vh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div className="login-grid" style={{ display: "grid", gridTemplateColumns: "1fr", maxWidth: 880, width: "100%", gap: 0, borderRadius: 28, overflow: "hidden", boxShadow: C.shadow }}>
          {/* brand side */}
          <div className="login-brand" style={{ background: `linear-gradient(150deg, ${C.primary} 0%, ${C.primaryDeep} 60%, #5B21B6 100%)`, padding: "28px 30px", color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
            <div style={{ marginBottom: 16, position: "relative" }}><Logo /></div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 20, lineHeight: 1.25, marginBottom: 9, position: "relative" }}>
              Pendamping lab sains adaptif — belajar melalui sentuhan, suara, dan AI yang memahami.
            </div>
            <p style={{ fontSize: 12.5, opacity: 0.88, lineHeight: 1.55, maxWidth: 560, position: "relative" }}>
              LENTERA menghadirkan Smart Tactile Experiment Board dan Context-Aware Learning Engine untuk siswa tunanetra dan low vision di tingkat SMPLB, dirancang untuk siswa, guru, dan orang tua.
            </p>
            <div className="flex items-center" style={{ gap: 8, marginTop: 18, fontSize: 11.5, fontWeight: 700, opacity: 0.9, position: "relative" }}>
              <ShieldCheck size={15} /> Dibuat untuk semua pembelajar — dukungan Braille &amp; suara
            </div>
          </div>

          {/* form side */}
          <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", padding: "26px 30px" }}>
            <div className="flex" style={{ gap: 5, padding: 5, borderRadius: 13, background: "rgba(139,92,246,0.08)", marginBottom: 18 }}>
              {roleTabs.map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 4px", borderRadius: 10, border: "none", background: role === id ? "#fff" : "transparent", color: role === id ? C.primaryDeep : C.textSoft, fontWeight: 700, fontSize: 12, boxShadow: role === id ? C.shadowSm : "none" }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 19, color: C.text, marginBottom: 4 }}>{roleCopy.title}</div>
            <p style={{ fontSize: 12.5, color: C.textSoft, lineHeight: 1.45, marginBottom: 16 }}>{roleCopy.desc}</p>

            <form onSubmit={submit} style={{ display: "grid", gap: 11 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.text, display: "block", marginBottom: 5 }}>{roleCopy.label}</label>
                <div className="flex items-center" style={{ gap: 9, border: "1px solid rgba(139,92,246,0.2)", background: "#fff", borderRadius: 12, padding: "10px 14px" }}>
                  <User size={16} color={C.textSoft} />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={roleCopy.placeholder}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, fontFamily: BODY, color: C.text, background: "transparent" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.text, display: "block", marginBottom: 5 }}>Password</label>
                <div className="flex items-center" style={{ gap: 9, border: "1px solid rgba(139,92,246,0.2)", background: "#fff", borderRadius: 12, padding: "10px 14px" }}>
                  <KeyRound size={16} color={C.textSoft} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, fontFamily: BODY, color: C.text, background: "transparent" }}
                  />
                  <button type="button" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw((v) => !v)} style={{ background: "none", border: "none", display: "grid", placeItems: "center", color: C.textSoft }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center" style={{ gap: 8, fontSize: 12, color: "#DB2777", background: C.pinkSoft, padding: "8px 12px", borderRadius: 11, fontWeight: 600 }}>
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <div className="flex" style={{ gap: 8, marginTop: 3 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, color: "#fff", border: "none", padding: "12px 18px", borderRadius: 13, fontWeight: 800, fontSize: 13.5, boxShadow: C.shadowSm, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? .65 : 1 }}>
                  {submitting ? "Sedang masuk…" : roleCopy.cta} <ChevronRight size={16} />
                </button>
                <button type="button" onClick={() => onLogin(role, roleCopy.placeholder, "lentera123")} disabled={submitting} style={{ background: C.pinkSoft, color: "#DB2777", border: "none", padding: "12px 18px", borderRadius: 13, fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Sparkles size={16} /> Demo
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
              <div className="flex items-center" style={{ gap: 7, fontSize: 11, color: C.textSoft }}>
                <Info size={13} /> Masuk aman didukung oleh LENTERA
              </div>
              <a href="/" style={{ fontSize: 11, fontWeight: 700, color: C.primaryDeep, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <ArrowLeft size={12} /> Kembali ke Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================== SHELL */
function Logo({ small = false }: { small?: boolean }) {
  const size = small ? 34 : 42;
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <img
        src="/logo-lentera.png"
        alt="Logo Lentera"
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: 12, boxShadow: C.shadowSm, flexShrink: 0, objectFit: "cover" }}
      />
      {!small && (
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 18, color: C.text, lineHeight: 1 }}>Lentera</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.primary, letterSpacing: 1.3 }}>TOUCH · UNDERSTAND · LEARN INDEPENDENTLY</div>
        </div>
      )}
    </div>
  );
}

interface ShellProps {
  view: string;
  setView: (v: string) => void;
  role: string;
  name: string;
  onLogout: () => void;
}

function Sidebar({ view, setView, role, onLogout }: ShellProps) {
  const homeLabel = role === "student" ? "Dashboard Saya" : role === "parent" ? "Progres Anak" : "Ringkasan";
  const nav: { id: string; label: string; icon: LucideIcon; href?: string }[] = [
    { id: "home", label: homeLabel, icon: LayoutDashboard },
    ...(role === "teacher" ? [{ id: "handbook", label: "Handbook", icon: BookOpen }] : []),
    { id: "ai", label: "AI Tutor", icon: Sparkles },
    { id: "lab", label: "Lentera Lab", icon: ScanEye, href: "/aruco" },
  ];
  return (
    <aside
      className="hidden lg:flex"
      style={{ width: 260, flexShrink: 0, flexDirection: "column", padding: 22, gap: 8, ...glassStyle({ borderRadius: 0, border: "none", boxShadow: "none", background: "rgba(255,255,255,0.55)" }) }}
    >
      <Link href="/" style={{ marginBottom: 22, display: "block" }} aria-label="Kembali ke Portal LENTERA"><Logo /></Link>

      <div style={{ fontSize: 11, fontWeight: 800, color: C.textSoft, letterSpacing: 1, padding: "0 6px 8px" }}>MENU</div>
      {nav.map((n) => {
        const active = view === n.id;
        const Icon = n.icon;
        
        if (n.href) {
          return (
            <Link key={n.id} href={n.href} className="navitem" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: "none", background: "transparent", color: C.text, fontWeight: 700, fontSize: 14, textAlign: "left", textDecoration: "none" }}>
              <Icon size={20} /> {n.label}
            </Link>
          );
        }

        return (
          <button key={n.id} onClick={() => setView(n.id)} className="navitem" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: "none", background: active ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})` : "transparent", color: active ? "#fff" : C.text, fontWeight: 700, fontSize: 14, textAlign: "left", boxShadow: active ? C.shadowSm : "none" }}>
            <Icon size={20} /> {n.label}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <div style={{ padding: 14, borderRadius: 16, background: `linear-gradient(135deg, ${C.primarySoft}, ${C.pinkSoft})`, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Hand size={20} color={C.primaryDeep} />
        <div style={{ fontSize: 12, color: C.text, fontWeight: 600, lineHeight: 1.4 }}>Dibuat untuk semua pembelajar — siap pembaca layar &amp; Braille.</div>
      </div>

      <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 14, border: "none", background: "transparent", color: C.textSoft, fontWeight: 700, fontSize: 13.5, textAlign: "left" }}>
        <LogOut size={17} /> Keluar
      </button>
    </aside>
  );
}

function TopBar({ view, setView, role, name, onLogout }: ShellProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const nav: { id: string; label: string; icon: LucideIcon; href?: string }[] = [
    { id: "home", label: "Beranda", icon: LayoutDashboard },
    ...(role === "teacher" ? [{ id: "handbook", label: "Handbook", icon: BookOpen }] : []),
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "lab", label: "Lab", icon: ScanEye, href: "/aruco" },
  ];
  const fallbackName = role === "student" ? "Kai Rahman" : role === "parent" ? "Orang Tua / Wali" : "Bu Sari";
  const tag = role === "student" ? "Teknisi · Lv 2" : role === "parent" ? "Orang tua siswa" : "Kelas 8B · Guru";
  const person = { name: name || fallbackName, tag };
  return (
    <header
      className="flex items-center justify-between"
      style={{ padding: "14px 22px", gap: 14, flexShrink: 0, zIndex: 20, ...glassStyle({ borderRadius: 0, border: "none", background: "rgba(252,251,255,0.75)", boxShadow: "0 6px 24px -18px rgba(124,58,237,0.4)" }) }}
    >
      {/* left: mobile logo + mobile nav + desktop search */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <Link href="/" className="lg:hidden" aria-label="Kembali ke Portal LENTERA"><Logo small /></Link>
        <div className="lg:hidden flex" style={{ gap: 4, padding: 4, borderRadius: 12, background: "rgba(139,92,246,0.08)" }}>
          {nav.map((n) => {
            const Icon = n.icon;
            if (n.href) {
              return (
                <Link key={n.id} href={n.href} style={{ padding: "7px 12px", borderRadius: 9, border: "none", background: "transparent", color: C.textSoft, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                  <Icon size={15} /> {n.label}
                </Link>
              );
            }
            return (
              <button key={n.id} onClick={() => setView(n.id)} style={{ padding: "7px 12px", borderRadius: 9, border: "none", background: view === n.id ? "#fff" : "transparent", color: view === n.id ? C.primaryDeep : C.textSoft, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, boxShadow: view === n.id ? C.shadowSm : "none" }}>
                <Icon size={15} /> {n.label}
              </button>
            );
          })}
        </div>
        <div className="hidden lg:flex items-center" style={{ gap: 9, background: "#fff", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 13, padding: "10px 15px", width: 300 }}>
          <Search size={17} color={C.textSoft} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                setView(role === "teacher" ? "home" : "ai");
              }
            }}
            placeholder="Cari siswa, pelajaran…"
            aria-label="Cari siswa atau pelajaran"
            style={{ border: "none", outline: "none", fontSize: 13.5, color: C.text, fontFamily: BODY, background: "transparent", width: "100%" }}
          />
        </div>
      </div>

      {/* right */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button
            aria-label="Notifikasi"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((v) => !v)}
            style={{ position: "relative", width: 42, height: 42, borderRadius: 13, background: "#fff", border: "1px solid rgba(139,92,246,0.14)", display: "grid", placeItems: "center" }}
          >
            <Bell size={19} color={C.text} />
            <span style={{ position: "absolute", top: 10, right: 11, width: 8, height: 8, borderRadius: "50%", background: C.pink, border: "2px solid #fff" }} />
          </button>
          {notificationsOpen && (
            <div className="notif-popover">
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 14 }}>Notifikasi LENTERA</div>
              <div className="notif-item"><CheckCircle2 size={15} color={C.green} /> Progres belajar tersimpan.</div>
              <div className="notif-item"><Sparkles size={15} color={C.primaryDeep} /> AI Tutor siap mendampingi sesi lab.</div>
              <div className="notif-item"><Info size={15} color={C.blue} /> Coba Panel Simulasi untuk demo tanpa perangkat fisik.</div>
            </div>
          )}
        </div>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${C.pink}, ${C.primary})`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontFamily: HEAD, fontSize: 15 }}>
            {person.name[0]}
          </div>
          <div className="hidden lg:block">
            <div style={{ fontWeight: 800, fontSize: 13.5, color: C.text, lineHeight: 1 }}>{person.name}</div>
            <div style={{ fontSize: 11.5, color: C.textSoft, marginTop: 3 }}>{person.tag}</div>
          </div>
        </div>
        <button aria-label="Keluar" onClick={onLogout} className="lg:hidden" style={{ width: 42, height: 42, borderRadius: 13, background: "#fff", border: "1px solid rgba(139,92,246,0.14)", display: "grid", placeItems: "center" }}>
          <LogOut size={18} color={C.text} />
        </button>
      </div>
    </header>
  );
}

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: C.bg }}>
      <div className="blob1" style={{ position: "absolute", top: -80, left: -60, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 68%)", filter: "blur(20px)" }} />
      <div className="blob2" style={{ position: "absolute", top: 140, right: -80, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,168,212,0.42), transparent 68%)", filter: "blur(24px)" }} />
      <div className="blob3" style={{ position: "absolute", bottom: -120, left: "35%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.4), transparent 68%)", filter: "blur(26px)" }} />
    </div>
  );
}

export default function CircuitSenseDashboard() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("home");
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lentera-session");
      if (saved) {
        const session = JSON.parse(saved);
        if (session?.name && session?.role) {
          setName(session.name);
          setRole(session.role);
          setView("home");
          setAuthed(true);
        }
      }
    } catch {
      localStorage.removeItem("lentera-session");
    } finally {
      setReady(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("lentera-session");
    setAuthed(false);
    setName("");
    setRole("student");
    setView("home");
  };

  if (!ready) return null;

  if (!authed) {
    return (
      <LoginPage
        onLogin={async (r, email, password) => {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              role: r,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(
              data.error ?? "Login failed."
            );
          }

          if (!data.session) {
            throw new Error(
              "Server tidak mengembalikan session pengguna."
            );
          }

          // IMPORTANT:
          // Gunakan role dan nama yang SUDAH diverifikasi
          // oleh Supabase/server.
          const verifiedSession = {
            id: data.session.id,
            email: data.session.email,
            name: data.session.name,
            role: data.session.role,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          };

          localStorage.setItem(
            "lentera-session",
            JSON.stringify(verifiedSession)
          );

          // Jangan gunakan r/email dari form sebagai identitas.
          setRole(verifiedSession.role);
          setName(verifiedSession.name);
          setView("home");
          setAuthed(true);
        }}
      />

    );
  }

  const firstName = name ? name.split(" ")[0] : role === "student" ? "Kai" : role === "parent" ? "Bpk/Ibu" : "Bu Sari";
  const heading = view === "ai"
    ? "AI Tutor"
    : view === "handbook"
    ? "Handbook Digital"
    : role === "student"
    ? `Halo, ${firstName}`
    : role === "parent"
    ? `Halo, ${firstName}`
    : `Selamat datang kembali, ${firstName}`;
  const subheading = view === "ai"
    ? "Raba papannya, pikirkan baik-baik, pahami alasannya."
    : view === "handbook"
    ? "Handbook panduan mengajar rangkaian listrik sederhana untuk siswa tunanetra dan low vision."
    : role === "student"
    ? "Kamu tinggal satu pelajaran lagi untuk meraih lencana berikutnya."
    : role === "parent"
    ? "Berikut progres belajar anak Anda minggu ini."
    : "Berikut perkembangan Kelas 8B hari ini.";

  return (
    <div style={{ height: "100vh", overflow: "hidden", fontFamily: BODY, color: C.text, position: "relative" }}>
      <Background />

      <div className="relative" style={{ zIndex: 10, display: "flex", height: "100vh" }}>
        <Sidebar view={view} setView={setView} role={role} name={name} onLogout={logout} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
          <TopBar view={view} setView={setView} role={role} name={name} onLogout={logout} />

          <main className="cs-scroll" style={{ flex: 1, overflowY: "auto", padding: "26px clamp(16px, 4vw, 34px) 40px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
              <div className="rise" style={{ marginBottom: 22 }}>
                <h1 style={{ fontFamily: HEAD, fontWeight: 800, fontSize: "clamp(26px, 4vw, 36px)", color: C.text, lineHeight: 1.05 }}>{heading}</h1>
                <p style={{ fontSize: 14.5, color: C.textSoft, marginTop: 6 }}>{subheading}</p>
              </div>

              {view === "ai" ? <AITutor /> : view === "handbook" ? <TeacherHandbook /> : role === "student" ? <StudentHome /> : role === "parent" ? <ParentDashboard /> : <TeacherOverview />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
