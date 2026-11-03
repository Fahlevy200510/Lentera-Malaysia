"use client";

import { useEffect, useState, useRef } from "react";
import { Gauge, Check, ChevronDown, Volume2 } from "lucide-react";
import { getSavedSpeechRate, setSavedSpeechRate, speakNarration } from "@/utils/audioCoordinator";

export const SPEED_OPTIONS = [
  { rate: 1.0, name: "Normal", label: "1.0x Normal", desc: "Tempo wajar pemula" },
  { rate: 1.6, name: "Sedang", label: "1.6x Sedang", desc: "Tempo percakapan lincah" },
  { rate: 2.3, name: "Cepat", label: "2.3x Cepat", desc: "Efisien & jelas" },
  { rate: 3.2, name: "Sangat Cepat", label: "3.2x Sangat Cepat", desc: "Ritme TalkBack harian" },
  { rate: 4.0, name: "Maksimal", label: "4.0x Maksimal", desc: "Mentok batas engine TTS" },
];

export default function SpeechSpeedSelector({
  compact = false,
  className = "",
  align = "auto",
}: {
  compact?: boolean;
  className?: string;
  align?: "left" | "right" | "auto";
}) {
  const [currentRate, setCurrentRate] = useState<number>(1.0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentRate(getSavedSpeechRate());

    const handleUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent?.detail) {
        setCurrentRate(customEvent.detail);
      } else {
        setCurrentRate(getSavedSpeechRate());
      }
    };

    window.addEventListener("lentera-speech-rate-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lentera-speech-rate-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const activeOption =
    SPEED_OPTIONS.find((opt) => Math.abs(opt.rate - currentRate) < 0.05) || SPEED_OPTIONS[0];

  const handleSelectRate = (rate: number, name: string) => {
    setCurrentRate(rate);
    setSavedSpeechRate(rate);
    setIsOpen(false);

    // Jika sedang hening (tidak sedang membaca arahan lab), bunyikan preview konfirmasi
    if (typeof window !== "undefined" && !(window as any).__lenteraSpeaking) {
      speakNarration(`Kecepatan ${name} aktif.`, {
        rate,
        pitch: 1.02,
        tag: "speed-preview",
      });
    }
  };

  const alignClass =
    align === "left" ? "left-0" : align === "right" ? "right-0" : compact ? "left-0" : "right-0";

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Pilih kecepatan suara narasi"
        title="Pengaturan Kecepatan Suara Narasi (Non-Tunanetra / Guru / Juri)"
        className={`inline-flex items-center gap-1.5 rounded-full border transition-all shadow-2xs font-extrabold cursor-pointer ${
          compact
            ? "px-2.5 py-1 text-[10.5px] border-[#735CDD]/20 bg-[#F8F6FF] text-[#5840BA] hover:bg-[#F3EFFE]"
            : "px-3 py-1.5 text-xs border-[#735CDD]/25 bg-white text-[#4A3E8A] hover:border-[#735CDD]/40 hover:bg-[#FAF8FF]"
        }`}
      >
        <Gauge className={compact ? "h-3 w-3 text-[#735CDD]" : "h-3.5 w-3.5 text-[#735CDD]"} />
        <span>{compact ? `${activeOption.rate}x` : activeOption.label}</span>
        <ChevronDown
          className={`transition-transform duration-200 ${
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          } opacity-60 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Daftar kecepatan suara"
          className={`absolute ${alignClass} top-full mt-1.5 w-48 rounded-2xl border border-[#735CDD]/20 bg-white p-1.5 shadow-2xl backdrop-blur-xl z-[999] animate-fade-in ring-1 ring-black/5`}
        >
          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#6E659F] border-b border-slate-100 flex items-center justify-between">
            <span>Kecepatan Suara</span>
            <Volume2 className="h-3 w-3 text-[#735CDD]" />
          </div>

          <div className="mt-1 space-y-0.5">
            {SPEED_OPTIONS.map((opt) => {
              const isSelected = Math.abs(opt.rate - currentRate) < 0.05;
              return (
                <button
                  key={opt.rate}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectRate(opt.rate, opt.name)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#735CDD] text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-[#F4F1FF] hover:text-[#5840BA]"
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{opt.label}</span>
                    </div>
                    <div
                      className={`text-[9.5px] ${
                        isSelected ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {opt.desc}
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-amber-300 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
