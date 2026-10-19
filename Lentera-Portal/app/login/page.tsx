"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User, GraduationCap, Hand, ArrowLeft, ShieldCheck,
  Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertTriangle, KeyRound,
  type LucideIcon,
} from "lucide-react";

const C = {
  bg: "#FCFBFF",
  primary: "#8B5CF6",
  primaryDeep: "#7C3AED",
  primarySoft: "#EDE9FE",
  pink: "#F9A8D4",
  pinkSoft: "#FCE7F3",
  blue: "#38BDF8",
  blueSoft: "#E0F2FE",
  text: "#2E2A5E",
  textSoft: "#7C77A6",
  shadow: "0 18px 50px -20px rgba(124,58,237,0.35)",
  shadowSm: "0 10px 30px -16px rgba(124,58,237,0.3)",
};

const HEAD = "'Poppins', system-ui, sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Jika sudah ada session aktif, langsung arahkan ke target
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lentera-session");
      if (saved) {
        const session = JSON.parse(saved);
        if (session?.name && session?.role) {
          router.replace(redirectTarget);
        }
      }
    } catch {
      localStorage.removeItem("lentera-session");
    }
  }, [router, redirectTarget]);

  const roleCopy = {
    student: {
      title: "Masuk sebagai Siswa",
      desc: "Lanjutkan pelajaranmu, raih lencana XP, dan jelajahi rangkaian listrik di papan fisik bersama AI Tutor.",
      cta: "Masuk & Mulai Belajar",
      defaultEmail: "student@lentera.demo",
    },
    teacher: {
      title: "Masuk sebagai Guru",
      desc: "Pantau penguasaan konsep kelas 8B, evaluasi miskonsepsi siswa, dan akses Handbook Digital interaktif.",
      cta: "Buka Dashboard Guru",
      defaultEmail: "teacher@lentera.demo",
    },
    parent: {
      title: "Masuk sebagai Orang Tua",
      desc: "Lihat laporan perkembangan belajar anak, catatan guru, dan panduan pendampingan sains di rumah.",
      cta: "Buka Dashboard Orang Tua",
      defaultEmail: "parent@lentera.demo",
    },
  }[role];

  const fillDemo = () => {
    setEmail(roleCopy.defaultEmail);
    setPassword("lentera123");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email atau Username wajib diisi.");
      return;
    }

    if (!password.trim()) {
      setError("Password wajib diisi.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk. Periksa kembali kredensial Anda.");
      }

      if (!data.session) {
        throw new Error("Server tidak mengembalikan sesi yang valid.");
      }

      const verifiedSession = {
        id: data.session.id,
        email: data.session.email,
        name: data.session.name,
        role: data.session.role,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };

      localStorage.setItem("lentera-session", JSON.stringify(verifiedSession));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("lentera-auth-update", { detail: verifiedSession }));

      // Redirect ke target
      router.push(redirectTarget);
    } catch (err) {
      setError((err as Error).message || "Terjadi kesalahan saat masuk.");
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
    <div className="relative min-h-screen overflow-hidden bg-[#FCFBFF] font-body text-[#2E2A5E]">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-16 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.25),transparent_70%)] blur-2xl" />
        <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(249,168,212,0.25),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)] backdrop-blur-2xl md:grid md:grid-cols-2">
          {/* Brand Left Panel */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 p-8 text-white sm:p-10">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-pink-500/15 blur-2xl" />

            <div className="relative z-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-violet-100 backdrop-blur-md transition-all hover:bg-white/25 hover:text-white mb-8"
              >
                <ArrowLeft className="h-4 w-4" /> Beranda LENTERA
              </Link>

              <div className="flex items-center gap-3 mb-6">
                <img src="/logo-lentera.png" alt="Logo LENTERA" className="h-12 w-12 rounded-2xl object-cover shadow-lg" />
                <div>
                  <div className="font-heading text-xl font-extrabold tracking-tight">LENTERA</div>
                  <div className="text-[9px] font-bold tracking-[0.22em] text-violet-200">
                    SMART TACTILE LAB
                  </div>
                </div>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold leading-snug">
                Masuk untuk memulai eksplorasi sainsmu.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-violet-100/80 leading-relaxed max-w-sm">
                Hubungkan papan fisik eksperimen dengan modul interaktif <strong>Lentera Learn</strong> dan deteksi komponen real-time <strong>Lentera Lab</strong>.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center gap-3 text-xs font-semibold text-violet-100/90">
              <ShieldCheck className="h-5 w-5 text-cyan-300 shrink-0" />
              <span>Satu akun untuk seluruh ekosistem pembelajaran inklusif.</span>
            </div>
          </div>

          {/* Form Right Panel */}
          <div className="p-7 sm:p-10 flex flex-col justify-center">
            {/* Role Switcher */}
            <div className="mb-6 flex rounded-2xl bg-violet-50/80 p-1.5 border border-violet-100">
              {roleTabs.map(([r, label, Icon]) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setError("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    role === r
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#2E2A5E]">
                {roleCopy.title}
              </h1>
              <p className="mt-1 text-xs text-[#7C77A6] leading-relaxed">
                {roleCopy.desc}
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-5">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email / Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roleCopy.defaultEmail}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-[#2E2A5E] placeholder-slate-400 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 pr-11 text-sm font-semibold text-[#2E2A5E] placeholder-slate-400 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={fillDemo}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Isi Akun Demo ({role})
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi akun...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>{roleCopy.cta}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FCFBFF] flex items-center justify-center">Memuat LENTERA...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
