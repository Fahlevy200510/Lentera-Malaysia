"use client";

import { useEffect, useState, useRef } from "react";
import {
  User, Check, Plus, RotateCcw, ChevronDown, Sparkles, X, UserCheck
} from "lucide-react";
import {
  getActiveStudent, setActiveStudent, getStudentProfiles, addStudentProfile,
  resetStudentProgress, getStudentProgress, PRESET_STUDENTS, type StudentProfile
} from "@/utils/progress";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";
import StudentAvatarBadge from "@/components/StudentAvatarBadge";

export default function StudentProfileSwitcher({ compact = false }: { compact?: boolean }) {
  const [profiles, setProfiles] = useState<StudentProfile[]>(PRESET_STUDENTS);
  const [active, setActive] = useState<StudentProfile>(PRESET_STUDENTS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("Kelas 8B");
  const [toast, setToast] = useState<string | null>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const reloadData = () => {
    setProfiles(getStudentProfiles());
    setActive(getActiveStudent());
  };

  useEffect(() => {
    reloadData();

    const handleUpdate = () => reloadData();
    window.addEventListener("lentera-active-student-update", handleUpdate);
    window.addEventListener("lentera-progress-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("lentera-active-student-update", handleUpdate);
      window.removeEventListener("lentera-progress-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Hitung posisi aman dropdown agar tidak terpotong tepi layar bawah/kiri
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      setOpenUpward(spaceBelow < 380 && spaceAbove > spaceBelow);
      setAlignLeft(rect.left < 220 || (viewportWidth - rect.right > 320 && rect.left < 320));
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectStudent = (profile: StudentProfile) => {
    setActiveStudent(profile);
    setActive(profile);
    setIsOpen(false);

    // Audio pemberitahuan
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(normalizeIndonesianPhonetics(`Siswa aktif: ${profile.name}`));
      utterance.lang = "id-ID";
      window.speechSynthesis.speak(utterance);
    }

    setToast(`Siswa aktif diganti ke ${profile.name}`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProfile = addStudentProfile(newName, newGrade);
    setNewName("");
    setShowAddInput(false);
    reloadData();
    handleSelectStudent(newProfile);
  };

  const handleResetCurrent = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (confirm("Reset seluruh modul, XP, dan lencana untuk profil siswa ini?")) {
      resetStudentProgress(profileId);
      reloadData();
      setToast("Progres siswa berhasil di-reset ke awal.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="relative inline-block z-40" ref={containerRef}>
      {/* Tombol Utama Switcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full border border-violet-400/30 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-violet-100 shadow-md backdrop-blur-md transition-all hover:border-violet-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        title="Ganti Siswa Aktif"
      >
        <StudentAvatarBadge
          id={active.id}
          name={active.name}
          avatar={active.avatar}
          size="xs"
          theme="dark"
        />
        <div className="text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-bold text-white max-w-[130px] truncate">{active.name}</span>
            <span className="text-[10px] text-violet-300 font-normal">({active.grade})</span>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-violet-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating Dropdown Dialog */}
      {isOpen && (
        <div
          className={`absolute z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-violet-500/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-4rem)] flex flex-col ${
            openUpward
              ? "bottom-full mb-2 animate-in fade-in slide-in-from-bottom-2"
              : "top-full mt-2 animate-in fade-in slide-in-from-top-2"
          } ${
            alignLeft ? "left-0" : "right-0"
          }`}
        >
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-violet-300">Profil Siswa Aktif</div>
              <div className="text-[11px] text-slate-400">Pilih siapa yang sedang merangkai di papan:</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Daftar Siswa */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 cs-scroll overscroll-contain shrink">
            {profiles.map((p) => {
              const prog = getStudentProgress(p.id);
              const isSelected = p.id === active.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectStudent(p)}
                  className={`group flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border border-violet-500/60 bg-violet-950/50 shadow-inner"
                      : "hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StudentAvatarBadge
                      id={p.id}
                      name={p.name}
                      avatar={p.avatar}
                      size="sm"
                      theme="dark"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{p.grade}</span>
                        <span>•</span>
                        <span className="text-violet-300 font-medium">{prog.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Reset cepat per siswa */}
                  <button
                    onClick={(e) => handleResetCurrent(e, p.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded transition-all shrink-0"
                    title="Reset progres siswa ini"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Form Tambah Siswa Baru */}
          <div className="mt-3 pt-3 border-t border-white/10 shrink-0">
            {!showAddInput ? (
              <button
                onClick={() => setShowAddInput(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-400/40 py-2 text-xs font-semibold text-violet-300 hover:border-violet-300 hover:bg-violet-950/30 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Siswa Baru
              </button>
            ) : (
              <form onSubmit={handleAddStudent} className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama Siswa (misal: Budi Santoso)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-violet-500/40 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-violet-600 py-1.5 text-xs font-bold text-white hover:bg-violet-500 transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddInput(false)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-violet-500/40 bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-violet-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
