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
import { speakNarration } from "@/utils/audioCoordinator";
import StudentAvatarBadge from "@/components/StudentAvatarBadge";

export default function StudentProfileSwitcher({ compact = false }: { compact?: boolean }) {
  const [profiles, setProfiles] = useState<StudentProfile[]>(PRESET_STUDENTS);
  const [active, setActive] = useState<StudentProfile>(PRESET_STUDENTS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("Kelas 11 SMA");
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
    speakNarration(`Siswa aktif: ${profile.name}`, { tag: "student-switch" });

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
    <div className={`relative z-40 max-w-full ${compact ? "w-full" : "inline-block"}`} ref={containerRef}>
      {/* Tombol Utama Switcher */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          compact
            ? "flex w-full max-w-full items-center justify-between gap-2 rounded-xl border border-[#735CDD]/25 bg-white px-2.5 py-2 text-xs font-semibold text-[#1D1836] shadow-sm transition-all hover:border-[#735CDD]/50 hover:bg-[#FAF8FF] focus:outline-none focus:ring-2 focus:ring-[#735CDD]/30"
            : "flex w-full max-w-full items-center justify-between gap-2 rounded-full border border-[#735CDD]/25 bg-[#F4F1FF] px-3 py-1.5 text-xs font-semibold text-[#1D1836] shadow-sm transition-all hover:border-[#735CDD]/50 hover:bg-[#EAE4FF] focus:outline-none focus:ring-2 focus:ring-[#735CDD]/30"
        }
        title={`Ganti Siswa Aktif (${active.name} - ${active.grade})`}
      >
        <div className="flex min-w-0 items-center gap-2 flex-1">
          <StudentAvatarBadge
            id={active.id}
            name={active.name}
            avatar={active.avatar}
            size="xs"
            theme="light"
            className="shrink-0"
          />
          <div className="text-left min-w-0 flex-1 truncate leading-tight">
            <span className="font-extrabold text-xs text-[#1D1836]">
              {active.name}
            </span>{" "}
            <span className="text-[10px] font-medium text-[#5E548E]">
              ({active.grade})
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#735CDD] transition-transform shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Dialog */}
      {isOpen && (
        <div
          style={{ backgroundColor: "#FFFFFF" }}
          className={`absolute z-50 rounded-2xl border-2 border-[#735CDD]/25 bg-white p-3.5 shadow-[0_20px_50px_-12px_rgba(29,24,54,0.28)] max-h-[calc(100vh-3rem)] flex flex-col ${
            compact ? "w-full min-w-[230px] left-0" : `w-72 max-w-[calc(100vw-2rem)] ${alignLeft ? "left-0" : "right-0"}`
          } ${
            openUpward
              ? "bottom-full mb-2.5 animate-in fade-in slide-in-from-bottom-2"
              : "top-full mt-2 animate-in fade-in slide-in-from-top-2"
          }`}
        >
          <div className="mb-2.5 flex items-start justify-between border-b border-[#735CDD]/15 pb-2 shrink-0">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5840BA]">
                Profil Siswa Aktif
              </div>
              <div className="text-[10.5px] text-[#5E548E] leading-snug mt-0.5">
                Pilih siswa yang sedang belajar:
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-[#6E659F] hover:bg-[#F3EFFE] hover:text-[#1D1836] transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Daftar Siswa */}
          <div className="space-y-1 max-h-64 overflow-y-auto overscroll-contain shrink">
            {profiles.map((p) => {
              const prog = getStudentProgress(p.id);
              const isSelected = p.id === active.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectStudent(p)}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border border-[#735CDD] bg-[#F4F1FF]"
                      : "hover:bg-[#F8F6FF] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <StudentAvatarBadge
                      id={p.id}
                      name={p.name}
                      avatar={p.avatar}
                      size="sm"
                      theme="light"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-extrabold text-[#1D1836] truncate">
                          {p.name}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#735CDD] shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#5E548E] flex items-center gap-1">
                        <span className="truncate">{p.grade}</span>
                        <span>•</span>
                        <span className="text-[#5840BA] font-extrabold shrink-0">
                          {prog.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Reset cepat per siswa */}
                  <button
                    onClick={(e) => handleResetCurrent(e, p.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#6E659F] hover:text-[#9A5B00] hover:bg-[#FFF3D6] rounded-lg transition-all shrink-0"
                    title="Reset progres siswa ini"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Form Tambah Siswa Baru */}
          <div className="mt-2.5 pt-2.5 border-t border-[#735CDD]/15 shrink-0">
            {!showAddInput ? (
              <button
                onClick={() => setShowAddInput(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#735CDD]/35 bg-[#FAF8FF] py-1.5 text-[11px] font-extrabold text-[#5840BA] hover:border-[#735CDD] hover:bg-[#F3EFFE] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Siswa Baru
              </button>
            ) : (
              <form onSubmit={handleAddStudent} className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama Siswa (misal: Budi)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-[#735CDD]/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D1836] placeholder-[#6E659F]/60 focus:outline-none focus:border-[#735CDD]"
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#735CDD] py-1.5 text-xs font-extrabold text-white hover:bg-[#5E47C9] transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddInput(false)}
                    className="rounded-lg bg-[#F4F1FF] px-2.5 py-1.5 text-xs font-bold text-[#5E548E] hover:bg-[#EAE4FF]"
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#735CDD]/25 bg-[#1D1836] px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-[#FFF3D6]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
