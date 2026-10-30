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
  Radio,
  Power,
  BatteryCharging,
  Lightbulb,
  BellRing,
  Cpu,
  Camera,
  CreditCard,
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

type TactileBlockSpec = {
  cell: string;
  id: string;
  name: string;
  brailleDots: string;
  brailleLabel: string;
  arucoIds: string;
  tactileShape: string;
  voiceText: string;
};

const TACTILE_BOARD_BLOCKS: Record<string, TactileBlockSpec> = {
  B2: {
    cell: "B2",
    id: "baterai",
    name: "Baterai 9V",
    brailleDots: "⠿🄱",
    brailleLabel: "Huruf B Braille",
    arucoIds: "ID #1 – #4",
    tactileShape: "Tonjolan kutub positif (+) dan lekukan negatif (-) di tepi atas balok.",
    voiceText:
      "Petak B 2: Balok Baterai 9 Volt. Memiliki huruf Braille B dan tonjolan kutub positif di sisi kanan sebagai sumber arus utama.",
  },
  C2: {
    cell: "C2",
    id: "saklar",
    name: "Saklar",
    brailleDots: "⠿🅂",
    brailleLabel: "Huruf S Braille",
    arucoIds: "ID #5 – #8",
    tactileShape: "Tuas geser timbul di bagian tengah untuk memutus atau menyambung arus.",
    voiceText:
      "Petak C 2: Balok Saklar. Memiliki huruf Braille S dan tuas timbul untuk menyambung atau memutus aliran listrik.",
  },
  D2: {
    cell: "D2",
    id: "kabel_belok",
    name: "Kabel Belok",
    brailleDots: "⠿└",
    brailleLabel: "Garis Siku Timbul",
    arucoIds: "ID #25 – #34",
    tactileShape: "Jalur rel timbul berbentuk siku 90 derajat yang membelokkan arus.",
    voiceText:
      "Petak D 2: Balok Kabel Belok. Memiliki jalur rel timbul siku sembilan puluh derajat untuk membelokkan arah rangkaian ke baris bawah.",
  },
  D3: {
    cell: "D3",
    id: "lampu",
    name: "Lampu LED",
    brailleDots: "⠿🄻",
    brailleLabel: "Huruf L Braille",
    arucoIds: "ID #9 – #12",
    tactileShape: "Kubah lentera bulat timbul di tengah balok yang menyala saat arus tertutup.",
    voiceText:
      "Petak D 3: Balok Lampu L E D. Memiliki huruf Braille L dan kubah bulat timbul di bagian tengah.",
  },
  C3: {
    cell: "C3",
    id: "buzzer",
    name: "Buzzer Audio",
    brailleDots: "⠿🅉",
    brailleLabel: "Huruf Z Braille",
    arucoIds: "ID #13 – #16",
    tactileShape: "Cincin silinder berlubang di tengah yang berbunyi saat dialiri listrik.",
    voiceText:
      "Petak C 3: Balok Buzzer Audio. Memiliki huruf Braille Z dan cincin akustik timbul yang menghasilkan bunyi saat rangkaian tertutup.",
  },
  B3: {
    cell: "B3",
    id: "kabel_lurus",
    name: "Kabel Lurus",
    brailleDots: "⠿─",
    brailleLabel: "Garis Lurus Timbul",
    arucoIds: "ID #17 – #24",
    tactileShape: "Satu garis rel timbul memanjang dari sisi kiri ke kanan balok.",
    voiceText:
      "Petak B 3: Balok Kabel Lurus. Memiliki rel garis lurus timbul yang mengembalikan arus menuju kutub negatif baterai.",
  },
};

const GRID_COLS = ["A", "B", "C", "D", "E"];
const GRID_ROWS = [1, 2, 3, 4, 5];

const destinations = [
  {
    href: "/aruco",
    title: "LENTERA Lab",
    tagline: "Eksperimen Taktil & Kamera ArUco",
    description:
      "Ruang praktik langsung dengan papan akrilik 5×5, pemindaian kamera bawah secara real-time, serta panduan suara Sokratik langkah demi langkah.",
    Icon: ScanEye,
    accent: "#735CDD",
    accentSoft: "#EAE4FC",
  },
  {
    href: "/dashboard",
    title: "LENTERA Learn",
    tagline: "Kurikulum & AI Tutor",
    description:
      "Pusat belajar mandiri berisi modul rangkaian seri-paralel, kuis adaptif, pencapaian siswa, dan percakapan suara bersama AI Tutor.",
    Icon: LayoutDashboard,
    accent: "#B45309",
    accentSoft: "#FFF3D6",
  },
];

function WingedLanternGlyph({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="120" height="120" rx="28" fill="#735CDD" />
      {/* Left wing */}
      <path
        d="M19 42C24 55 34 62 44 64C34 63 26 59 20 53C24 62 33 67 43 68C35 68 27 65 23 61C27 68 35 72 44 71C37 73 30 73 26 70C31 76 39 77 45 74"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right wing */}
      <path
        d="M101 42C96 55 86 62 76 64C86 63 94 59 100 53C96 62 87 67 77 68C85 68 93 65 97 61C93 68 85 72 76 71C83 73 90 73 94 70C89 76 81 77 75 74"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top ring & rays */}
      <circle cx="60" cy="31" r="6.5" stroke="#FFFFFF" strokeWidth="3.5" />
      <line x1="45" y1="35" x2="48" y2="39" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="41" y1="41" x2="45" y2="43" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="35" x2="72" y2="39" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="79" y1="41" x2="75" y2="43" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      {/* Lantern cap & body */}
      <path d="M50 43C53 39 67 39 70 43H50Z" fill="#FFFFFF" />
      <rect x="51" y="45" width="18" height="8" rx="2" fill="#FFFFFF" />
      {/* Lantern glass in warm buttercream */}
      <path
        d="M51 55H69L72 73C72 78 67 82 60 82C53 82 48 78 48 73L51 55Z"
        fill="#FCE6B4"
        stroke="#FFFFFF"
        strokeWidth="3.5"
      />
      {/* Inner flame */}
      <path
        d="M60 64C63 69 65 73 63 77C61 80 57 79 57 75C57 71 58.5 67 60 64Z"
        fill="#FFFFFF"
      />
      <path
        d="M60 70C61.5 73 62 75.5 60.8 77.5C59.8 79 58.5 78.2 58.5 76C58.5 74 59.2 72 60 70Z"
        fill="#F5B841"
      />
      {/* Outer handle wire */}
      <path
        d="M50 49H47C45 49 44 51 43 55L41 75C40.5 79 43 82 47 83M70 49H73C75 49 76 51 77 55L79 75C79.5 79 77 82 73 83"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Base */}
      <rect x="49" y="83" width="22" height="5" rx="2" fill="#FFFFFF" />
      <rect x="46" y="89" width="28" height="4" rx="2" fill="#FFFFFF" />
    </svg>
  );
}

function InteractiveTactileBoard({
  wsConnected,
}: {
  wsConnected: boolean;
}) {
  const [selectedCell, setSelectedCell] = useState<string>("D3");
  const [circuitClosed, setCircuitClosed] = useState<boolean>(true);

  const selectedBlock = TACTILE_BOARD_BLOCKS[selectedCell] || TACTILE_BOARD_BLOCKS.D3;

  const handleSelectBlock = (cell: string) => {
    const spec = TACTILE_BOARD_BLOCKS[cell];
    if (!spec) return;
    setSelectedCell(cell);
    speakNarration(normalizeIndonesianPhonetics(spec.voiceText), {
      tag: "board-preview",
    });
  };

  const handleToggleSwitch = () => {
    const nextState = !circuitClosed;
    setCircuitClosed(nextState);
    const msg = nextState
      ? "Saklar ditutup. Arus mengalir melewati jalur B 2 ke D 3. Lampu lentera menyala dan buzzer berbunyi."
      : "Saklar dibuka. Aliran arus terputus dan lampu lentera padam.";
    speakNarration(normalizeIndonesianPhonetics(msg), {
      tag: "board-switch",
    });
  };

  return (
    <div className="w-full rounded-[28px] bg-[#735CDD] p-5 sm:p-7 text-white border-2 border-[#5B43C6]">
      {/* Board Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-11 w-11 place-items-center rounded-2xl border transition-colors ${
              circuitClosed
                ? "bg-[#FFF3D6] text-[#1E1938] border-[#F5B841]"
                : "bg-white/15 text-white border-white/25"
            }`}
          >
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <div className="font-heading text-base font-bold tracking-tight text-white">
              Papan Taktil 5×5 (A1 – E5)
            </div>
            <div className="text-xs text-[#EAE4FC]">
              Klik balok untuk mendengar bentuk rabaan & Braille
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleSwitch}
          aria-pressed={circuitClosed}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-transform active:scale-95 border ${
            circuitClosed
              ? "bg-[#FFF3D6] text-[#1E1938] border-[#F5B841]"
              : "bg-[#5B43C6] text-white border-white/30 hover:bg-white/15"
          }`}
        >
          <Power className="h-3.5 w-3.5" />
          <span>{circuitClosed ? "Saklar: ON (Menyala)" : "Saklar: OFF (Terputus)"}</span>
        </button>
      </div>

      {/* Column Headers A - E */}
      <div className="mt-4 grid grid-cols-6 gap-2 text-center text-xs font-extrabold text-[#EAE4FC]">
        <div className="text-left pl-1 opacity-75">GRID</div>
        {GRID_COLS.map((col) => (
          <div key={col}>{col}</div>
        ))}
      </div>

      {/* 5x5 Matrix */}
      <div className="mt-1.5 space-y-2" role="grid" aria-label="Simulasi papan taktil 5 kali 5">
        {GRID_ROWS.map((row) => (
          <div key={row} className="grid grid-cols-6 gap-2 items-center" role="row">
            <div className="text-xs font-extrabold text-[#EAE4FC] pl-1">{row}</div>
            {GRID_COLS.map((col) => {
              const coord = `${col}${row}`;
              const block = TACTILE_BOARD_BLOCKS[coord];
              const isSelected = selectedCell === coord;
              const isIlluminatedOutput =
                circuitClosed && (coord === "D3" || coord === "C3");
              const isActiveLoop = Boolean(block) && circuitClosed;

              if (!block) {
                return (
                  <div
                    key={coord}
                    role="gridcell"
                    aria-label={`Petak kosong ${coord}`}
                    className="aspect-square rounded-xl border border-white/15 bg-[#5B43C6]/55 flex flex-col items-center justify-center select-none"
                  >
                    <span className="text-[11px] font-semibold text-white/45">
                      {coord}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={coord}
                  type="button"
                  role="gridcell"
                  onClick={() => handleSelectBlock(coord)}
                  aria-label={`${coord}: ${block.name}, ${block.brailleLabel}`}
                  aria-selected={isSelected}
                  className={` relative aspect-square rounded-xl p-1.5 flex flex-col items-center justify-between text-center transition-all focus:outline-none focus:ring-2 focus:ring-[#FFF3D6] ${
                    isIlluminatedOutput
                      ? "bg-[#FFF3D6] text-[#1E1938] border-2 border-[#F5B841] scale-[1.03]"
                      : isSelected
                      ? "bg-white text-[#1E1938] border-2 border-[#FFF3D6] scale-[1.03]"
                      : isActiveLoop
                      ? "bg-white/95 text-[#1E1938] border-2 border-white hover:bg-white"
                      : "bg-white/20 text-white border border-white/35 hover:bg-white/30"
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] font-extrabold leading-none">
                    <span>{coord}</span>
                    <span aria-hidden="true">{block.brailleDots}</span>
                  </div>

                  <div className="my-auto flex items-center justify-center">
                    {block.id === "baterai" && (
                      <BatteryCharging className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    {block.id === "saklar" && <Power className="h-4 w-4 sm:h-5 sm:w-5" />}
                    {block.id === "lampu" && (
                      <Lightbulb
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          isIlluminatedOutput ? "lantern-flame-pulse text-[#D97706]" : ""
                        }`}
                      />
                    )}
                    {block.id === "buzzer" && (
                      <BellRing
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          isIlluminatedOutput ? "lantern-flame-pulse text-[#D97706]" : ""
                        }`}
                      />
                    )}
                    {(block.id === "kabel_lurus" || block.id === "kabel_belok") && (
                      <span className="font-heading text-xs sm:text-sm font-extrabold">
                        {block.id === "kabel_lurus" ? "───" : "──┐"}
                      </span>
                    )}
                  </div>

                  <div className="w-full truncate text-[10px] font-bold leading-tight">
                    {block.name.split(" ")[0]}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected Block Tactile Inspector Card (Warm Buttercream / Alabaster) */}
      <div className="mt-5 rounded-2xl bg-[#FAF8F4] p-4 text-[#1E1938] border border-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#735CDD] text-xs font-extrabold text-white">
              {selectedBlock.cell}
            </span>
            <div>
              <div className="font-heading text-sm font-bold text-[#1E1938]">
                {selectedBlock.name}
              </div>
              <div className="text-xs font-semibold text-[#5A5376]">
                {selectedBlock.brailleLabel} ({selectedBlock.brailleDots}) · Kamera Bawah{" "}
                {selectedBlock.arucoIds}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectBlock(selectedBlock.cell)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAE4FC] px-3 py-1.5 text-xs font-bold text-[#5B43C6] hover:bg-[#735CDD] hover:text-white transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Dengar Rabaan</span>
          </button>
        </div>

        <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-[#1E1938]/85">
          <strong>Kontur Fisik 3D:</strong> {selectedBlock.tactileShape}
        </p>
      </div>

      {/* Bottom Camera Status Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#EAE4FC]">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              wsConnected ? "bg-[#FFF3D6]" : "bg-white/50"
            }`}
          />
          <span className="font-semibold">
            {wsConnected
              ? "Kamera Bawah Raspberry Pi Terhubung (ws://8765)"
              : "Sensor Papan Fisik Siaga (Otomatis masuk Lab saat balok diletakkan)"}
          </span>
        </div>
        <span className="font-bold text-[#FFF3D6]">6 Jenis Balok Taktil</span>
      </div>
    </div>
  );
}

export default function PortalLandingPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [session, setSession] = useState<{ name: string; role: string } | null>(null);

  // Pre-load daftar voice browser agar bahasa Indonesia langsung siap
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

  // Background WebSocket Listener: Auto-redirect ke /aruco saat kartu siswa (35/36/37) atau balok diletakkan
  useEffect(() => {
    let ws: WebSocket | null = null;
    let redirectTriggered = false;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const initBackgroundWS = () => {
      try {
        const host = window.location.hostname || "localhost";
        ws = new WebSocket(`ws://${host}:8765`);

        ws.onopen = () => {
          setWsConnected(true);
        };

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

                speakNarration(normalizeIndonesianPhonetics(cardInfo.greeting), {
                  tag: "student-card-welcome",
                });
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

        ws.onerror = () => {
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
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
      "Selamat datang di portal LENTERA: Learning Electricity through Non-visual Tactile Exploration and Real-time Audio. Letakkan kartu siswa atau balok rangkaian di atas papan akrilik untuk membuka Lentera Lab secara otomatis, atau pilih Lentera Learn untuk mengakses modul kurikulum.";

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
    <main className="portal-page relative min-h-screen overflow-x-hidden selection:bg-[#735CDD] selection:text-white">
      {/* Top Header Navigation */}
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
            className="portal-ghost-btn hidden lg:inline-flex"
          >
            <ScanEye className="h-4 w-4 text-[#735CDD]" />
            <span>LENTERA Lab</span>
          </Link>

          <Link
            href="/dashboard"
            className="portal-ghost-btn hidden lg:inline-flex"
          >
            <LayoutDashboard className="h-4 w-4 text-[#D97706]" />
            <span>LENTERA Learn</span>
          </Link>

          <button
            id="btn-voice-guide"
            type="button"
            onClick={readIntro}
            className="portal-ghost-btn"
            aria-label={
              speaking ? "Matikan panduan suara" : "Dengarkan panduan suara"
            }
          >
            <Volume2 className="h-4 w-4 text-[#735CDD]" />
            <span className="hidden sm:inline">
              {speaking ? "Matikan Suara" : "Panduan Suara"}
            </span>
          </button>

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

      {/* CHAPTER 1: HERO — Editorial Poster Statement + Live 5x5 Tactile Board */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Left 7 Columns: Editorial Headline & Direct Controls */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#735CDD]/25 bg-[#EAE4FC] px-4 py-1.5 text-xs font-bold text-[#5B43C6]">
              <Radio className="h-3.5 w-3.5" />
              <span>
                Media Pembelajaran Fisika Inklusif Tunanetra & Low Vision
              </span>
            </div>

            <h1 className="mt-6 font-heading text-[2.35rem] sm:text-[3.35rem] lg:text-[3.85rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-[#1E1938]">
              Meraba arus listrik,{" "}
              <span className="inline-flex items-center align-middle mx-1 -translate-y-1 rounded-2xl bg-[#735CDD] px-3 py-1.5 text-white border-2 border-[#5B43C6]">
                <WingedLanternGlyph className="h-8 w-8 sm:h-10 sm:w-10" />
                <span className="ml-2 font-heading text-lg sm:text-2xl font-extrabold text-[#FFF3D6]">
                  ⠿🄻
                </span>
              </span>{" "}
              mendengar cahaya menyala.
            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#5A5376]">
              <strong>LENTERA</strong> (
              <em>
                Learning Electricity through Non-visual Tactile Exploration and
                Real-time Audio
              </em>
              ) memadukan papan akrilik berpetak{" "}
              <strong className="text-[#1E1938]">A1–E5</strong>, balok komponen
              berhuruf Braille 3D, kamera pemindai bawah, dan tutor suara
              bahasa Indonesia agar siswa tunanetra dapat merangkai listrik
              secara mandiri dan aman.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link href="/aruco" className="portal-primary-btn">
                <ScanEye className="h-5 w-5" />
                <span>Buka LENTERA Lab</span>
              </Link>

              <Link href="/dashboard" className="portal-secondary-btn">
                <LayoutDashboard className="h-5 w-5 text-[#735CDD]" />
                <span>Buka LENTERA Learn</span>
              </Link>

              <button
                type="button"
                onClick={readIntro}
                className="portal-secondary-btn"
                aria-label={
                  speaking ? "Matikan panduan suara" : "Dengarkan pengantar LENTERA"
                }
              >
                <Volume2 className="h-5 w-5 text-[#D97706]" />
                <span>{speaking ? "Matikan Suara" : "Dengarkan Pengantar"}</span>
              </button>
            </div>

            {/* Hands-free Physical Board Callout */}
            <div className="mt-7 rounded-2xl border-2 border-[#735CDD]/20 bg-[#F3EFFB] p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <span className="mt-1 relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#735CDD] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#735CDD]" />
                </span>
                <div className="text-sm leading-relaxed text-[#1E1938]">
                  <strong className="font-bold">
                    Tanpa Klik Layar (Hands-Free Launch):
                  </strong>{" "}
                  Tempelkan{" "}
                  <span className="underline decoration-[#735CDD] decoration-2 underline-offset-2 font-semibold">
                    Kartu Belajar Siswa (Via #35, Amira #36, Ajib #37)
                  </span>{" "}
                  atau letakkan balok komponen apa saja di papan fisik untuk
                  langsung membuka LENTERA Lab dengan sapaan suara otomatis.
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Live Interactive 5x5 Tactile Board */}
          <div className="lg:col-span-5">
            <InteractiveTactileBoard wsConnected={wsConnected} />
          </div>
        </div>
      </section>

      {/* CHAPTER 2: FULL-BLEED LOGO PERIWINKLE CHAPTER — How the Hardware Works */}
      <section
        aria-labelledby="heading-cara-kerja"
        className="mt-12 bg-[#735CDD] py-16 sm:py-20 text-white border-y-2 border-[#5B43C6]"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <h2
              id="heading-cara-kerja"
              className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
            >
              Tiga lapisan fisik yang mengubah sentuhan tangan menjadi suara.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#EAE4FC]">
              Siswa tidak perlu menyentuh kabel telanjang bertegangan. Seluruh
              komponen dibungkus balok taktil yang dipindai dari bawah papan
              akrilik.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-3xl bg-[#5B43C6] p-6 sm:p-7 border border-white/20 flex flex-col justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3D6] text-[#1E1938]">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-white">
                  Permukaan Atas: Grid Akrilik 5×5 & Braille 3D
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#EAE4FC]">
                  Papan dibagi menjadi 25 petak berbingkai timbul (kolom A–E,
                  baris 1–5). Enam jenis balok (Baterai, Saklar, Lampu, Buzzer,
                  Kabel Lurus, dan Kabel Belok) memiliki kontur bentuk berbeda
                  serta label huruf Braille di permukaan atasnya.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/15 text-xs font-bold text-[#FFF3D6]">
                25 Petak Koordinat Taktil (A1 – E5)
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl bg-[#5B43C6] p-6 sm:p-7 border border-white/20 flex flex-col justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3D6] text-[#1E1938]">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-white">
                  Bagian Bawah: Kamera ArUco & 4 LED Putih
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#EAE4FC]">
                  Di dasar kotak papan, kamera Raspberry Pi bersama 4 lampu LED
                  putih (GPIO 18) memindai penanda ArUco di bagian bawah setiap
                  balok secara real-time—mendeteksi posisi petak sekaligus arah
                  rotasi kutub komponen tanpa jeda.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/15 text-xs font-bold text-[#FFF3D6]">
                Pemindaian Lokal Tanpa Ketergantungan Internet
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl bg-[#5B43C6] p-6 sm:p-7 border border-white/20 flex flex-col justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3D6] text-[#1E1938]">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-white">
                  Kartu Identitas Taktil & Panduan Suara Sokratik
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#EAE4FC]">
                  Setiap siswa memiliki kartu ArUco pribadi untuk masuk ke akun
                  belajarnya tanpa mengetik kata sandi. Saat merangkai, sistem
                  memberikan petunjuk arah koordinat secara bertahap dan memutar
                  bunyi sirene atau bel nyata ketika rangkaian berhasil tertutup.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/15 text-xs font-bold text-[#FFF3D6]">
                Mode Eksplorasi, Seri, Paralel & Tantangan Kuis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 3: WORKSPACE SELECTION — LENTERA Lab vs LENTERA Learn */}
      <section
        aria-labelledby="heading-ruang-kerja"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2
              id="heading-ruang-kerja"
              className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1E1938]"
            >
              Pilih ruang kerja pembelajaran.
            </h2>
            <p className="mt-2 text-base text-[#5A5376]">
              Dua modul terhubung untuk praktik eksperimen fisik dan pendalaman
              teori bersama guru maupun mandiri.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: LENTERA Lab */}
          <Link
            href="/aruco"
            className="group flex flex-col justify-between rounded-[28px] border-2 border-[#1E1938]/12 bg-white p-7 sm:p-8 transition-all hover:border-[#735CDD] hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#735CDD] text-white">
                  <ScanEye className="h-7 w-7" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAE4FC] px-3.5 py-1.5 text-xs font-extrabold text-[#5B43C6]">
                  <span>Papan Fisik & Kamera</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>

              <h3 className="mt-6 font-heading text-2xl font-extrabold text-[#1E1938]">
                LENTERA Lab (Edge Vision)
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#5A5376]">
                Hubungkan papan taktil Raspberry Pi, pantau deteksi balok pada
                matriks 5×5 secara langsung, ikuti misi pengenalan komponen,
                rangkaian seri, rangkaian paralel, hingga kuis tebak balok
                dengan panduan suara penuh.
              </p>
            </div>

            <div className="mt-7 pt-5 border-t border-[#1E1938]/10 flex items-center justify-between text-sm font-extrabold text-[#735CDD]">
              <span>Masuk ke LENTERA Lab</span>
              <span>/aruco →</span>
            </div>
          </Link>

          {/* Card 2: LENTERA Learn */}
          <Link
            href="/dashboard"
            className="group flex flex-col justify-between rounded-[28px] border-2 border-[#1E1938]/12 bg-white p-7 sm:p-8 transition-all hover:border-[#735CDD] hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3D6] text-[#1E1938] border border-[#F5B841]">
                  <LayoutDashboard className="h-7 w-7" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3D6] px-3.5 py-1.5 text-xs font-extrabold text-[#92400E]">
                  <span>Modul & Progres Siswa</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>

              <h3 className="mt-6 font-heading text-2xl font-extrabold text-[#1E1938]">
                LENTERA Learn (Dashboard & AI Tutor)
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#5A5376]">
                Pelajari konsep dasar arus listrik, tegangan, dan hambatan
                melalui kurikulum ramah pembaca layar, pantau perolehan XP dan
                lencana setiap siswa (Via, Amira, Ajib), serta berdiskusi dua
                arah dengan AI Tutor.
              </p>
            </div>

            <div className="mt-7 pt-5 border-t border-[#1E1938]/10 flex items-center justify-between text-sm font-extrabold text-[#5B43C6]">
              <span>Buka LENTERA Learn</span>
              <span>/dashboard →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E1938]/10 bg-[#F3EFFB] py-10 px-5 sm:px-8 print:hidden">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-[#735CDD] shrink-0 border border-[#5B43C6]">
              <img
                src="/logo-lentera.png"
                alt="Logo Lentera"
                width={40}
                height={40}
                className="h-full w-full object-cover scale-[1.34]"
              />
            </div>
            <div>
              <div className="font-heading text-base font-extrabold text-[#1E1938]">
                LENTERA
              </div>
              <div className="text-xs text-[#5A5376]">
                Learning Electricity through Non-visual Tactile Exploration and
                Real-time Audio
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#5A5376]">
            <Link href="/aruco" className="hover:text-[#735CDD]">
              LENTERA Lab
            </Link>
            <span>·</span>
            <Link href="/dashboard" className="hover:text-[#735CDD]">
              LENTERA Learn
            </Link>
            <span>·</span>
            <Link href="/login" className="hover:text-[#735CDD]">
              Portal Akun
            </Link>
          </div>
        </div>
      </footer>

      {/* Backdrop for Sidebar Drawer */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#1E1938]/45 backdrop-blur-xs transition-opacity duration-300 print:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-over Navigation Drawer */}
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
              <div className="text-[11px] font-bold tracking-wider text-[#735CDD]">
                MENU PORTAL
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
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-bold"
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
                  <span className="mt-1 block text-[11px] font-bold uppercase tracking-wider text-[#735CDD]">
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
                <div className="text-[11px] text-[#5A5376] font-semibold uppercase">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#735CDD] hover:bg-[#5B43C6] p-3.5 text-xs font-bold text-white transition-all"
            >
              Masuk / Login Sekarang
            </Link>
          )}

          <div className="rounded-2xl border border-[#735CDD]/20 bg-[#EAE4FC] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#5B43C6]" />
              <div>
                <div className="text-sm font-bold text-[#1E1938]">
                  Dirancang untuk aksesibilitas penuh
                </div>
                <div className="mt-1 text-xs leading-5 text-[#5A5376]">
                  Dukungan pembaca layar, navigasi keyboard, huruf Braille 3D,
                  dan deteksi kartu belajar otomatis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
