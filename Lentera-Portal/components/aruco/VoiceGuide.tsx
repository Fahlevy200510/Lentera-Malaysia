"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lock,
  HelpCircle,
  AlertTriangle,
  Compass,
  Zap,
  ArrowRight,
} from "lucide-react";
import {
  completeModule,
  getStudentProgress,
  getActiveStudent,
  PRESET_STUDENTS,
  DEFAULT_PROGRESS,
  type StudentProgress,
  type StudentProfile,
} from "@/utils/progress";
import { playEarcon } from "@/utils/soundEffects";

/* ---------------------------------------------------------------- Types */
type CellData = { component: string; rotation: number };
type StepDef = {
  instruction: string;
  voice: string;
  targetCells?: Record<string, string>; // cell -> expected component
  validator?: (cells: Record<string, any>, status: string, graphType?: string) => boolean;
  hint?: string;
  explanation?: string;
};

/* ---------------------------------------------------------------- Guide Data */
const RECOGNITION_STEPS: StepDef[] = [
  {
    instruction: "Ambil balok Baterai, letakkan di posisi C3",
    voice: "Mari berkenalan dengan komponen listrik! Pertama, raba dan cari balok Baterai. Letakkan balok Baterai di posisi C3, tepat di tengah papan.",
    targetCells: { "C3": "battery" },
    hint: "Baterai memiliki simbol plus-minus timbul. Letakkan di posisi C3 (tengah papan).",
    explanation: "Bagus sekali! Ini adalah balok Baterai, sumber energi utama rangkaian. Baterai menghasilkan tegangan untuk mendorong arus listrik. Raba kedua ujungnya: kamu akan merasakan simbol timbul tanda plus untuk kutub positif, dan simbol timbul tanda minus garis mendatar untuk kutub negatif. Keduanya memiliki tanda taktil timbul agar mudah dibedakan dengan jari. Arus listrik mengalir keluar dari kutub positif menuju kutub negatif.",
  },
  {
    instruction: "Angkat baterai, lalu letakkan balok Saklar di posisi C3",
    voice: "Bagus! Sekarang angkat baterai. Selanjutnya, ambil balok Saklar, lalu letakkan di posisi C3.",
    targetCells: { "C3": "switch" },
    hint: "Saklar memiliki tuas mekanik timbul yang dapat digeser atau ditekan.",
    explanation: "Tepat sekali! Ini adalah balok Saklar. Saklar berfungsi menghubungkan dan memutuskan aliran listrik. Raba bagian atasnya, terdapat tuas yang dapat diklik. Saat saklar ditutup atau dinyalakan, arus listrik mengalir. Saat saklar dibuka, aliran listrik terputus dan lampu akan padam.",
  },
  {
    instruction: "Angkat saklar, lalu letakkan balok Lampu di posisi C3",
    voice: "Hebat! Sekarang angkat saklar. Ambil balok Lampu, lalu letakkan di posisi C3.",
    targetCells: { "C3": "lamp" },
    hint: "Lampu memiliki kubah indikator bundar timbul di bagian atasnya.",
    explanation: "Luar biasa! Ini adalah balok Lampu, yang berperan sebagai komponen beban. Lampu mengubah energi listrik menjadi energi cahaya. Di dalamnya terdapat LED atau filamen yang akan bersinar terang saat dialiri arus listrik yang cukup.",
  },
  {
    instruction: "Angkat lampu, lalu letakkan balok Kabel Lurus di posisi C3",
    voice: "Sekarang angkat lampu. Ambil balok Kabel Lurus, lalu letakkan di posisi C3.",
    targetCells: { "C3": "straight_cable" },
    hint: "Kabel lurus memiliki alur garis lurus timbul melintang.",
    explanation: "Bagus sekali! Ini adalah balok Kabel Lurus. Di dalamnya terdapat jalur konduktor tembaga untuk mengalirkan arus listrik secara mendatar atau tegak dalam satu garis lurus tanpa belokan.",
  },
  {
    instruction: "Angkat kabel lurus, lalu letakkan balok Kabel Sudut L di posisi C3",
    voice: "Sekarang angkat kabel lurus. Ambil balok Kabel Sudut L, lalu letakkan di posisi C3.",
    targetCells: { "C3": "l_cable" },
    hint: "Kabel L memiliki alur timbul siku-siku seperti huruf L.",
    explanation: "Hebat! Ini adalah balok Kabel Sudut L. Kabel ini membelokkan aliran listrik sebesar 90 derajat. Kabel L digunakan di setiap sudut papan agar rangkaian dapat berputar kembali ke baterai dan membentuk lintasan tertutup.",
  },
  {
    instruction: "Angkat kabel sudut, lalu letakkan balok Kabel Cabang T di posisi C3",
    voice: "Terakhir, angkat kabel sudut. Ambil balok Kabel Cabang T, lalu letakkan di posisi C3.",
    targetCells: { "C3": "t_cable" },
    hint: "Kabel T memiliki alur timbul bercabang tiga membentuk huruf T.",
    explanation: "Luar biasa! Ini adalah balok Kabel Cabang T. Kabel ini memiliki tiga percabangan koneksi. Kabel T sangat penting pada rangkaian paralel karena membagi aliran listrik menjadi beberapa cabang terpisah untuk masing-masing lampu.",
  },
];

const QUIZ_STEPS: StepDef[] = [
  {
    instruction: "Tebak: Sumber Energi Listrik",
    voice: "Kuis Taktil dimulai! Pertanyaan pertama: Komponen manakah yang berfungsi sebagai penyimpan energi dan sumber tegangan listrik? Raba dan letakkan komponen tersebut di posisi mana saja di papan untuk menjawab.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Cari balok yang memiliki simbol timbul plus dan minus di kedua ujungnya.",
    explanation: "Hebat sekali! Jawabanmu tepat! Baterai adalah sumber energi listrik yang menghasilkan tegangan untuk mendorong arus.",
  },
  {
    instruction: "Tebak: Pengubah Listrik Menjadi Cahaya",
    voice: "Pertanyaan kedua! Angkat baterai. Komponen manakah yang berfungsi mengubah energi listrik menjadi energi cahaya? Letakkan di papan untuk menjawab.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "lamp"),
    hint: "Cari balok yang memiliki kubah bulat timbul di bagian atasnya.",
    explanation: "Luar biasa! Benar sekali, itu adalah Lampu! Lampu berperan sebagai beban yang bersinar terang saat dialiri arus listrik.",
  },
  {
    instruction: "Tebak: Pengendali Aliran Listrik",
    voice: "Pertanyaan ketiga! Angkat lampu. Komponen manakah yang berfungsi menghubungkan dan memutuskan aliran listrik? Letakkan di papan untuk menjawab.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "switch"),
    hint: "Cari balok yang memiliki tuas mekanik timbul yang dapat diklik atau digeser.",
    explanation: "Tepat sekali! Itu adalah Saklar. Saat saklar ditutup rangkaian terhubung, dan saat dibuka rangkaian terputus.",
  },
  {
    instruction: "Tebak: Kabel Cabang T Rangkaian Paralel",
    voice: "Pertanyaan terakhir! Angkat saklar. Kabel manakah yang memiliki tiga percabangan untuk membagi aliran listrik pada rangkaian paralel? Letakkan di papan untuk menjawab.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "t_cable"),
    hint: "Cari kabel yang memiliki alur timbul bercabang tiga seperti huruf T.",
    explanation: "Sempurna! Itu adalah Kabel Cabang T. Kabel T membagi arus listrik menjadi cabang-cabang mandiri untuk setiap lampu.",
  },
];

const SERIES_STEPS: StepDef[] = [
  {
    instruction: "Letakkan Baterai di posisi C5",
    voice: "Ayo mulai membuat rangkaian seri! Pertama, letakkan komponen baterai di posisi C5, tepat di tengah baris atas. Baterai adalah sumber listrik rangkaian kita.",
    targetCells: { "C5": "battery" },
    hint: "Baterai memiliki simbol plus dan minus. Letakkan di tengah baris atas (paling jauh dari kamu).",
  },
  {
    instruction: "Sambungkan kabel dari Baterai ke kedua sisi",
    voice: "Bagus sekali! Sekarang sambungkan baterai ke bagian rangkaian lainnya. Letakkan kabel lurus di posisi B5 dan D5, di kedua sisi baterai.",
    targetCells: { "B5": "straight_cable", "D5": "straight_cable" },
    hint: "Kabel lurus dipasang mendatar untuk menyambungkan komponen dalam satu garis.",
  },
  {
    instruction: "Pasang kabel sudut di A5 dan E5",
    voice: "Sekarang kita perlu membelokkan jalur rangkaian ke atas. Letakkan kabel sudut berbentuk L di posisi A5 dan E5. Kabel ini akan membelokkan arus dari mendatar menjadi tegak.",
    targetCells: { "A5": "l_cable", "E5": "l_cable" },
    hint: "Kabel L membuat belokan 90 derajat. A5 belok ke atas-kanan, E5 belok ke atas-kiri.",
  },
  {
    instruction: "Pasang kabel tegak di sisi kiri: A2, A3, A4",
    voice: "Hebat! Sekarang teruskan rangkaian ke atas di sisi kiri. Letakkan tiga kabel lurus secara tegak di posisi A4, A3, dan A2. Kabel ini membentuk jalur kiri dari loop rangkaian.",
    targetCells: { "A2": "straight_cable", "A3": "straight_cable", "A4": "straight_cable" },
    hint: "Kabel-kabel ini harus dipasang tegak (90 derajat).",
  },
  {
    instruction: "Pasang kabel tegak di sisi kanan: E2, E4",
    voice: "Sekarang lakukan hal yang sama di sisi kanan. Letakkan kabel lurus tegak di posisi E2 dan E4. Biarkan E3 kosong untuk komponen saklar.",
    targetCells: { "E2": "straight_cable", "E4": "straight_cable" },
    hint: "Biarkan E3 kosong dulu, di situlah saklar akan dipasang!",
  },
  {
    instruction: "Letakkan Saklar di E3",
    voice: "Sekarang letakkan saklar di posisi E3 di sisi kanan. Saklar mengatur apakah arus mengalir melalui rangkaian. Saat saklar tertutup, lampu akan menyala!",
    targetCells: { "E3": "switch" },
    hint: "Saklar membuka dan menutup jalur rangkaian.",
  },
  {
    instruction: "Pasang kabel sudut di atas: A1 dan E1",
    voice: "Hampir selesai! Letakkan kabel sudut berbentuk L di posisi A1 dan E1 untuk menyambungkan bagian atas loop rangkaian.",
    targetCells: { "A1": "l_cable", "E1": "l_cable" },
    hint: "Sudut-sudut ini menyambungkan jalur tegak kiri dan kanan melintasi bagian atas.",
  },
  {
    instruction: "Letakkan 2 Lampu di B1 dan D1, dan Saklar di C1",
    voice: "Langkah terakhir! Letakkan dua komponen lampu di posisi B1 dan D1, lalu letakkan saklar kedua tepat di antaranya di C1. Pada rangkaian seri, semua komponen berbagi satu jalur yang sama. Jika satu lampu putus, atau salah satu saklar dibuka, seluruh rangkaian akan terputus! Selamat, kamu berhasil membuat rangkaian seri dengan dua saklar!",
    targetCells: { "B1": "lamp", "D1": "lamp", "C1": "switch" },
    hint: "Saklar kedua di C1 mengendalikan kedua lampu karena tersusun seri.",
  },
];

const PARALLEL_STEPS: StepDef[] = [
  {
    instruction: "Letakkan Baterai di posisi C5",
    voice: "Sekarang ayo buat rangkaian paralel! Mulai dengan meletakkan baterai di posisi C5, di tengah baris atas. Ini adalah sumber listrik kita.",
    targetCells: { "C5": "battery" },
    hint: "Titik awalnya sama seperti rangkaian seri, baterai di tengah baris atas.",
  },
  {
    instruction: "Buat bagian atas",
    voice: "Tambahkan kabel lurus di samping baterai di B5 dan D5, lalu pasang kabel sudut berbentuk L di A5 dan E5 untuk berbelok ke bawah.",
    targetCells: { "B5": "straight_cable", "D5": "straight_cable", "A5": "l_cable", "E5": "l_cable" },
    hint: "Sambungkan kabel dari baterai ke arah luar sampai sudut A5 dan E5.",
  },
  {
    instruction: "Buat cabang tengah",
    voice: "Sekarang ayo buat cabang paralel pertama! Letakkan kabel T di A3 dan E3 untuk membagi arus. Lalu, pasang saklar di B3, lampu di C3, dan kabel lurus di D3.",
    targetCells: { "A3": "t_cable", "E3": "t_cable", "B3": "switch", "C3": "lamp", "D3": "straight_cable" },
    hint: "Cabang tengah membutuhkan kabel T di tepi, saklar di B3, dan lampu di tengah (C3).",
  },
  {
    instruction: "Buat cabang bawah",
    voice: "Terakhir, ayo buat cabang paralel kedua di bagian bawah. Letakkan kabel sudut L di A1 dan E1. Lalu, tambahkan saklar di B1, lampu di C1, dan kabel lurus di D1.",
    targetCells: { "A1": "l_cable", "E1": "l_cable", "B1": "switch", "C1": "lamp", "D1": "straight_cable" },
    hint: "Cabang bawah membutuhkan kabel L di sudut, saklar di B1, dan lampu di tengah (C1).",
  },
  {
    instruction: "Sambungkan cabang-cabangnya",
    voice: "Untuk menyelesaikan rangkaian, kita perlu menyambungkan bagian atas, tengah, dan bawah. Letakkan kabel lurus di sepanjang sisi pada A4, E4, A2, dan E2. Selamat, kamu berhasil membuat rangkaian paralel dengan saklar terpisah untuk setiap lampu!",
    targetCells: { "A4": "straight_cable", "E4": "straight_cable", "A2": "straight_cable", "E2": "straight_cable" },
    hint: "Gunakan kabel lurus untuk menyambungkan kabel T ke sudut di sisi kiri dan kanan.",
  }
];


const ADAPTIVE_SERIES_STEPS: StepDef[] = [
  {
    instruction: "Letakkan Baterai di mana saja",
    voice: "Ayo buat rangkaian seri bebas! Mulai dengan meletakkan baterai di mana saja di papan.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Letakkan balok baterai di mana pun kamu suka.",
  },
  {
    instruction: "Letakkan Lampu di mana saja",
    voice: "Bagus! Sekarang letakkan balok lampu di posisi lain di papan.",
    validator: (cells) => Object.values(cells).filter((c: any) => c && c.component === "lamp").length >= 1,
    hint: "Letakkan balok lampu di mana saja.",
  },
  {
    instruction: "Sambungkan dalam satu jalur seri",
    voice: "Sekarang, gunakan kabel dan saklar untuk menyambungkan baterai dan lampu sehingga membentuk satu lintasan loop tertutup. Pastikan tidak ada jalur yang bercabang!",
    validator: (cells, status, graphType) => status === "success" && graphType === "series",
    hint: "Sambungkan baterai ke lampu hingga membentuk loop tertutup.",
  },
];

const ADAPTIVE_PARALLEL_STEPS: StepDef[] = [
  {
    instruction: "Letakkan Baterai di mana saja",
    voice: "Ayo buat rangkaian paralel bebas! Mulai dengan meletakkan baterai di mana saja di papan.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Letakkan balok baterai di mana pun kamu suka.",
  },
  {
    instruction: "Letakkan dua Lampu di mana saja",
    voice: "Bagus! Sekarang letakkan dua lampu di tempat lain di papan.",
    validator: (cells) => Object.values(cells).filter((c: any) => c && c.component === "lamp").length >= 2,
    hint: "Letakkan dua lampu di mana saja.",
  },
  {
    instruction: "Sambungkan dengan beberapa jalur",
    voice: "Sekarang, gunakan kabel untuk menyambungkan baterai dan kedua lampu sehingga setiap lampu memiliki jalurnya sendiri. Kamu akan membutuhkan kabel T untuk membagi aliran listrik!",
    validator: (cells, status, graphType) => status === "success" && graphType === "parallel",
    hint: "Sambungkan sehingga rangkaian bercabang menjadi beberapa jalur.",
  },
];

const TROUBLESHOOT_STEPS: StepDef[] = [
  {
    instruction: "Tantangan 1: Rangkai Sirkuit Kendali Saklar",
    voice: "Tantangan Detektif Sirkuit dimulai! Misi pertama: Buatlah rangkaian satu lampu dengan saklar di posisi mana saja di papan. Pastikan seluruh jalur tersambung hingga lampu berhasil menyala!",
    validator: (cells, status) => {
      const hasBattery = Object.values(cells).some((c: any) => c && c.component === "battery");
      const hasLamp = Object.values(cells).some((c: any) => c && c.component === "lamp");
      const hasSwitch = Object.values(cells).some((c: any) => c && c.component === "switch");
      return status === "success" && hasBattery && hasLamp && hasSwitch;
    },
    hint: "Gunakan baterai, saklar, lampu, dan kabel hingga lampu menyala sempurna.",
    explanation: "Hebat sekali, detektif! Sirkuit kendali saklar berhasil menyala!",
  },
  {
    instruction: "Tantangan 2: Uji Pemutus Aliran Arus",
    voice: "Misi kedua! Tanpa melepas balok komponen dari papan, putar tuas saklar ke posisi terbuka atau mati untuk memutus aliran listrik!",
    validator: (cells, status) => {
      const placedCount = Object.values(cells).filter(Boolean).length;
      return placedCount >= 4 && status !== "success" && status !== "short_circuit";
    },
    hint: "Raba tuas timbul di atas saklar, lalu putar untuk mematikan sirkuit.",
    explanation: "Sempurna! Kamu telah membuktikan saklar dapat memutuskan aliran listrik secara aman tanpa harus membongkar rangkaian.",
  },
  {
    instruction: "Tantangan 3: Rancang Sirkuit Paralel Mandiri",
    voice: "Misi ketiga: Buatlah rangkaian bercabang paralel dengan minimal dua lampu menggunakan kabel cabang T. Pastikan kedua lampu menyala bersamaan!",
    validator: (cells, status, graphType) => {
      const lamps = Object.values(cells).filter((c: any) => c && c.component === "lamp").length;
      return status === "success" && graphType === "parallel" && lamps >= 2;
    },
    hint: "Gunakan kabel cabang T untuk membagi aliran arus ke dua lampu terpisah.",
    explanation: "Luar biasa! Kamu resmi menjadi Master Sirkuit Taktil Lentera! Kemampuan analisismu setara ilmuwan cilik sejati.",
  },
];

const COMPONENT_LABEL: Record<string, string> = {
  battery: "baterai", straight_cable: "kabel lurus", l_cable: "kabel L", t_cable: "kabel T",
  lamp: "lampu", resistor: "resistor", switch: "saklar",
};

const COMPONENT_TACTILE_HINT: Record<string, string> = {
  battery: "memiliki simbol plus dan minus timbul di kedua ujungnya",
  switch: "memiliki tuas mekanik timbul yang dapat diklik atau digeser di atasnya",
  lamp: "memiliki kubah indikator bundar timbul di bagian atasnya",
  straight_cable: "memiliki alur garis lurus timbul melintang",
  l_cable: "memiliki alur timbul siku-siku seperti huruf L",
  t_cable: "memiliki alur timbul bercabang tiga seperti huruf T",
};

const NEXT_GUIDE_MAP: Record<string, { mode: "recognition" | "quiz" | "series" | "parallel" | "troubleshoot"; title: string }> = {
  recognition: { mode: "quiz", title: "Kuis Taktil" },
  quiz: { mode: "series", title: "Rangkaian Seri" },
  series: { mode: "parallel", title: "Rangkaian Paralel" },
  adaptive_series: { mode: "parallel", title: "Rangkaian Paralel" },
  parallel: { mode: "troubleshoot", title: "Tantangan Detektif Sirkuit" },
  adaptive_parallel: { mode: "troubleshoot", title: "Tantangan Detektif Sirkuit" },
};

type GuideMode =
  | "idle"
  | "recognition"
  | "quiz"
  | "series"
  | "parallel"
  | "adaptive_series"
  | "adaptive_parallel"
  | "troubleshoot";

/* ---------------------------------------------------------------- Component */
export default function VoiceGuide() {
  const [mode, setMode] = useState<GuideMode>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [checkpointPhase, setCheckpointPhase] = useState<"idle" | "waiting_clear" | "waiting_choice" | "confirmed">("idle");
  const [boardBlockCount, setBoardBlockCount] = useState<number>(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const latestCellsRef = useRef<Record<string, any>>({});
  const lastRemindRef = useRef<number>(0);
  const lastClueRef = useRef<number>(0);
  const lastShortCircuitRef = useRef<number>(0);
  const lastMenuSelectRef = useRef<number>(0);
  const hasTriggeredSuccessEarconRef = useRef<boolean>(false);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>(DEFAULT_PROGRESS);
  const [activeStudentState, setActiveStudentState] = useState<StudentProfile>(PRESET_STUDENTS[0]);
  const [mounted, setMounted] = useState<boolean>(false);

  const nextGuide = NEXT_GUIDE_MAP[mode];

  useEffect(() => {
    setMounted(true);
    setStudentProgress(getStudentProgress());
    setActiveStudentState(getActiveStudent());
    const handleProg = () => {
      setStudentProgress(getStudentProgress());
      setActiveStudentState(getActiveStudent());
    };
    const handleStudent = (e: any) => {
      if (e?.detail) setActiveStudentState(e.detail);
      setStudentProgress(getStudentProgress());
    };
    window.addEventListener("lentera-progress-update", handleProg);
    window.addEventListener("lentera-active-student-update", handleStudent);
    window.addEventListener("storage", handleProg);
    return () => {
      window.removeEventListener("lentera-progress-update", handleProg);
      window.removeEventListener("lentera-active-student-update", handleStudent);
      window.removeEventListener("storage", handleProg);
    };
  }, []);

  const handleGuideFinish = useCallback((targetMode: string) => {
    if (targetMode === "recognition") {
      completeModule("component_recognition");
    } else if (targetMode === "quiz") {
      completeModule("component_quiz");
    } else if (targetMode === "series" || targetMode === "adaptive_series") {
      completeModule("series_circuit");
    } else if (targetMode === "parallel" || targetMode === "adaptive_parallel") {
      completeModule("parallel_circuit");
    } else if (targetMode === "troubleshoot") {
      completeModule("circuit_troubleshoot");
    }
  }, []);

  const steps =
    mode === "recognition"
      ? RECOGNITION_STEPS
      : mode === "quiz"
      ? QUIZ_STEPS
      : mode === "series"
      ? SERIES_STEPS
      : mode === "parallel"
      ? PARALLEL_STEPS
      : mode === "adaptive_series"
      ? ADAPTIVE_SERIES_STEPS
      : mode === "adaptive_parallel"
      ? ADAPTIVE_PARALLEL_STEPS
      : mode === "troubleshoot"
      ? TROUBLESHOOT_STEPS
      : [];
  const step = steps[currentStep];
  const totalSteps = steps.length;
  const isFinished = totalSteps > 0 && currentStep >= totalSteps;

  useEffect(() => {
    if (isFinished && mode !== "idle") {
      handleGuideFinish(mode);
    }
  }, [isFinished, mode, handleGuideFinish]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (typeof window !== "undefined") {
        (window as any).__lenteraGuideMode = "idle";
        (window as any).__lenteraSpeaking = false;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__lenteraGuideMode = mode;
    }
  }, [mode]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current || isMuted) {
      if (onEnd) onEnd();
      return;
    }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (typeof window !== "undefined") (window as any).__lenteraSpeaking = true;
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      if (typeof window !== "undefined") (window as any).__lenteraSpeaking = false;
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      setIsSpeaking(false);
      if (typeof window !== "undefined") (window as any).__lenteraSpeaking = false;
      if (onEnd && (e as any)?.error !== "interrupted" && (e as any)?.error !== "canceled") {
        onEnd();
      }
    };
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [isMuted]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      if (typeof window !== "undefined") (window as any).__lenteraSpeaking = false;
    }
  }, []);

  // Checkpoint Handler: saat panduan selesai, pandu pembersihan papan dan pilihan taktil A1/E1
  useEffect(() => {
    if (!isFinished || mode === "idle" || checkpointPhase !== "idle") return;

    const currentCells = latestCellsRef.current || {};
    const placed = Object.values(currentCells).filter(Boolean).length;
    setBoardBlockCount(placed);

    const targetNext = NEXT_GUIDE_MAP[mode];

    if (placed > 0) {
      setCheckpointPhase("waiting_clear");
      if (mode === "recognition") {
        speak(
          "Selamat! Kamu telah menyelesaikan pengenalan seluruh balok komponen Lentera. Kerja yang luar biasa! Sebelum kita lanjut ke panduan berikutnya, silakan angkat terlebih dahulu semua balok yang ada di papan."
        );
      } else if (mode === "series" || mode === "adaptive_series") {
        speak(
          "Hebat sekali! Kamu berhasil menyelesaikan Rangkaian Seri dan lampu menyala! Sebelum kita lanjut ke Rangkaian Paralel, silakan angkat terlebih dahulu semua balok dari papan."
        );
      } else {
        speak(
          "Selamat! Kamu telah menyelesaikan seluruh rangkaian! Kerja yang luar biasa! Silakan angkat semua balok dari papan jika ingin merangkai bebas."
        );
      }
    } else {
      if (targetNext) {
        setCheckpointPhase("waiting_choice");
        speak(
          `Selamat! Kamu telah menyelesaikan ${
            mode === "recognition" ? "pengenalan komponen" : "rangkaian seri"
          }. Papan sudah bersih. Apakah kamu ingin lanjut ke panduan ${
            targetNext.title
          }? Letakkan balok di sudut kiri posisi A1 untuk IYA, atau di sudut kanan posisi E1 untuk TIDAK.`
        );
      } else {
        setCheckpointPhase("confirmed");
        speak(
          "Selamat! Kamu telah menyelesaikan seluruh materi rangkaian dasar Lentera! Papan sudah bersih dan siap untuk eksplorasi bebas."
        );
      }
    }
  }, [isFinished, mode, checkpointPhase, speak]);

  // Listen to circuit-update events to track progress and tangible menu
  useEffect(() => {
    const handleCircuitUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const cells = detail?.cells || {};
      latestCellsRef.current = cells;

      const placedCount = Object.values(cells).filter(Boolean).length;
      setBoardBlockCount(placedCount);

      // KETIKA SEDANG MODE IDLE (TANGIBLE GRID MENU A1 - E1)
      if (mode === "idle") {
        if (placedCount === 1) {
          const now = Date.now();
          if (now - lastMenuSelectRef.current > 4000) {
            if (cells["A1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Tahap 1, Pengenalan Komponen! Angkat balok dari A1 untuk mulai meraba balok di sel C3.", () => {
                setTimeout(() => startGuide("recognition"), 1200);
              });
            } else if (cells["B1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Tahap 2, Kuis Taktil! Angkat balok dari B1 untuk mulai menjawab tebak fungsi komponen.", () => {
                setTimeout(() => startGuide("quiz"), 1200);
              });
            } else if (cells["C1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Tahap 3, Rangkaian Seri! Angkat balok dari C1 untuk mulai merakit sirkuit satu loop.", () => {
                setTimeout(() => startGuide("series"), 1200);
              });
            } else if (cells["D1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Tahap 4, Rangkaian Paralel! Angkat balok dari D1 untuk mulai merakit sirkuit percabangan kabel T.", () => {
                setTimeout(() => startGuide("parallel"), 1200);
              });
            } else if (cells["E1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Tahap 5, Tantangan Detektif Sirkuit Mahir! Angkat balok dari E1 untuk memulai misi analisis.", () => {
                setTimeout(() => startGuide("troubleshoot"), 1200);
              });
            }
          }
        }
        return;
      }

      // Evaluasi Darurat Korsleting Fisika (Short Circuit Safety Alert)
      if (detail?.status === "short_circuit") {
        const now = Date.now();
        if (now - lastShortCircuitRef.current > 9000) {
          lastShortCircuitRef.current = now;
          playEarcon("warning");
          speak("Peringatan korsleting arus pendek! Arus listrik mengalir tanpa hambatan beban. Segera lepaskan salah satu kabel atau pasang balok lampu agar baterai aman!");
        }
      }

      // Earcon Sirkuit Berhasil Menyala
      if (detail?.isComplete && !hasTriggeredSuccessEarconRef.current) {
        hasTriggeredSuccessEarconRef.current = true;
        playEarcon("success");
      } else if (!detail?.isComplete) {
        hasTriggeredSuccessEarconRef.current = false;
      }

      // KETIKA MODUL TELAH SELESAI (CHECKPOINT TAKTIL A1 / E1)
      if (isFinished) {
        const targetNext = NEXT_GUIDE_MAP[mode];

        if (checkpointPhase === "waiting_clear") {
          if (placedCount === 0) {
            playEarcon("clear");
            if (targetNext) {
              setCheckpointPhase("waiting_choice");
              speak(
                `Papan sudah bersih. Apakah kamu ingin lanjut ke panduan ${targetNext.title}? Letakkan balok di sudut kiri posisi A1 untuk IYA, atau di sudut kanan posisi E1 untuk TIDAK.`
              );
            } else {
              setCheckpointPhase("confirmed");
              speak(
                "Papan sudah bersih. Selamat bereksplorasi bebas merangkai apa saja di papan fisik!"
              );
            }
          }
        } else if (checkpointPhase === "waiting_choice") {
          if (cells["A1"]) {
            playEarcon("click");
            setCheckpointPhase("confirmed");
            speak(
              `Pilihan IYA diterima! Silakan angkat kembali balok dari A1, kita mulai panduan ${targetNext?.title}.`,
              () => {
                setTimeout(() => {
                  if (targetNext) {
                    startGuide(targetNext.mode);
                  }
                }, 1200);
              }
            );
          } else if (cells["E1"]) {
            playEarcon("click");
            setCheckpointPhase("confirmed");
            speak(
              "Baik, kamu memilih istirahat. Silakan angkat kembali baloknya. Kamu bisa merangkai bebas di papan fisik kapan saja.",
              () => {
                setTimeout(() => {
                  resetGuide();
                }, 1200);
              }
            );
          } else if (placedCount > 0) {
            const now = Date.now();
            if (now - lastRemindRef.current > 7000) {
              lastRemindRef.current = now;
              speak("Letakkan balok di sudut kiri A1 untuk IYA, atau di sudut kanan E1 untuk TIDAK.");
            }
          }
        }
        return;
      }

      // KETIKA MASIH DALAM PROSES LANGKAH PANDUAN
      if (!step) return;

      const newCompleted = new Set<string>();
      let allFound = true;
      if (step.targetCells) {
        for (const [cell, expectedComponent] of Object.entries(step.targetCells)) {
          const placed = cells[cell];
          if (placed && placed.component === expectedComponent) {
            newCompleted.add(cell);
          } else {
            allFound = false;
          }
        }
      }
      
      if (step.validator) {
        allFound = step.validator(cells, detail?.status, detail?.graph_type);
      }

      // Socratic Clue Feedback saat komponen yang diletakkan salah di sel target
      if (step.targetCells && !allFound && !stepCompleted) {
        for (const [cell, expectedComponent] of Object.entries(step.targetCells)) {
          const placed = cells[cell];
          if (placed && placed.component !== expectedComponent) {
            const now = Date.now();
            if (now - lastClueRef.current > 8000) {
              lastClueRef.current = now;
              const placedName = COMPONENT_LABEL[placed.component] || placed.component;
              const expectedName = COMPONENT_LABEL[expectedComponent] || expectedComponent;
              const clue = COMPONENT_TACTILE_HINT[expectedComponent] || "bentuk yang sesuai";
              playEarcon("clue");
              speak(`Kamu meletakkan balok ${placedName} di ${cell}. Untuk langkah ini kita membutuhkan ${expectedName}. Coba raba balok yang ${clue}.`);
            }
            break;
          }
        }
      }
      
      // Jika langkah belum selesai, perbarui completed cells
      if (!stepCompleted) {
        setCompletedCells(newCompleted);
      }

      if (allFound && !stepCompleted) {
        setStepCompleted(true);
        setCompletedCells(newCompleted);
        playEarcon("step");
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

        if (step.explanation) {
          // Putar penjelasan komponen lalu jeda sebelum lanjut
          speak(step.explanation, () => {
            advanceTimerRef.current = setTimeout(() => {
              if (currentStep < totalSteps - 1) {
                setCurrentStep((prev) => prev + 1);
                setStepCompleted(false);
                setCompletedCells(new Set());
              } else {
                setCurrentStep(totalSteps);
              }
            }, 3500);
          });
        } else if (currentStep < totalSteps - 1) {
          speak("Bagus sekali! Lanjut ke langkah berikutnya.");
          advanceTimerRef.current = setTimeout(() => {
            setCurrentStep((prev) => prev + 1);
            setStepCompleted(false);
            setCompletedCells(new Set());
          }, 2500);
        } else {
          speak("Bagus sekali! Rangkaian selesai.");
          advanceTimerRef.current = setTimeout(() => {
            setCurrentStep(totalSteps);
          }, 1500);
        }
      }
    };

    window.addEventListener("circuit-update", handleCircuitUpdate);
    return () => window.removeEventListener("circuit-update", handleCircuitUpdate);
  }, [mode, step, stepCompleted, currentStep, totalSteps, isFinished, checkpointPhase, speak]);

  // Speak current step instruction when step changes
  useEffect(() => {
    if (mode !== "idle" && step && !isMuted) {
      speak(step.voice);
    }
  }, [currentStep, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGuide = (guideMode: GuideMode) => {
    if (guideMode === "idle") return;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setMode(guideMode);
    setCurrentStep(0);
    setStepCompleted(false);
    setCompletedCells(new Set());
    setCheckpointPhase("idle");
    setBoardBlockCount(0);
    setIsExpanded(true);
  };

  useEffect(() => {
    const handleStartGuide = (e: Event) => {
      const targetMode = (e as CustomEvent).detail;
      if (
        targetMode &&
        ["recognition", "quiz", "series", "parallel", "adaptive_series", "adaptive_parallel", "troubleshoot"].includes(targetMode)
      ) {
        startGuide(targetMode);
      }
    };
    window.addEventListener("lentera-start-guide", handleStartGuide);
    return () => window.removeEventListener("lentera-start-guide", handleStartGuide);
  }, []);

  const resetGuide = () => {
    stopSpeaking();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setMode("idle");
    setCurrentStep(0);
    setStepCompleted(false);
    setCompletedCells(new Set());
    setCheckpointPhase("idle");
    setBoardBlockCount(0);
    if (typeof window !== "undefined") {
      (window as any).__lenteraGuideMode = "idle";
      (window as any).__lenteraSpeaking = false;
    }
  };

  const skipStep = () => {
    stopSpeaking();
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setStepCompleted(false);
      setCompletedCells(new Set());
    } else {
      setCurrentStep(totalSteps);
    }
  };

  const toggleMute = () => {
    if (!isMuted) stopSpeaking();
    setIsMuted((prev) => !prev);
  };

  const replayVoice = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (stepCompleted && step?.explanation) {
      speak(step.explanation, () => {
        advanceTimerRef.current = setTimeout(() => {
          if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
            setStepCompleted(false);
            setCompletedCells(new Set());
          } else {
            setCurrentStep(totalSteps);
          }
        }, 3500);
      });
    } else if (step) {
      speak(step.voice);
    }
  };

  /* ---------------------------------------------------------------- Idle Mode */
  if (mode === "idle") {
    const activeStudent = mounted ? activeStudentState : PRESET_STUDENTS[0];
    const currentProgress = mounted ? studentProgress : DEFAULT_PROGRESS;
    const completedCount = [
      currentProgress.modules.component_recognition,
      currentProgress.modules.component_quiz,
      currentProgress.modules.series_circuit,
      currentProgress.modules.parallel_circuit,
      currentProgress.modules.circuit_troubleshoot,
    ].filter(Boolean).length;

    // Menentukan modul rekomendasi berikutnya
    let nextRec = {
      mode: "recognition" as GuideMode,
      stage: "Tahap 1",
      title: "Pengenalan Bentuk Taktil Komponen",
      desc: "Langkah awal: Raba dan kenali 6 bentuk timbul balok komponen dasar di sel C3 tengah papan.",
      actionText: "Mulai Tahap 1",
      cell: "A1",
    };

    if (!currentProgress.modules.component_recognition) {
      nextRec = {
        mode: "recognition",
        stage: "Tahap 1 (Dasar)",
        title: "Pengenalan Bentuk Taktil Komponen",
        desc: "Langkah awal: Raba dan kenali 6 bentuk timbul balok komponen dasar di sel C3 tengah papan.",
        actionText: "Mulai Tahap 1",
        cell: "A1",
      };
    } else if (!currentProgress.modules.component_quiz) {
      nextRec = {
        mode: "quiz",
        stage: "Tahap 2 (Kuis)",
        title: "Kuis Tebak Fungsi Komponen",
        desc: "Jawab tebak fungsi komponen listrik secara mandiri dengan meletakkan balok di papan fisik.",
        actionText: "Mulai Kuis Taktil",
        cell: "B1",
      };
    } else if (!currentProgress.modules.series_circuit) {
      nextRec = {
        mode: "series",
        stage: "Tahap 3 (Sirkuit Seri)",
        title: "Rangkaian Listrik Seri",
        desc: "Rakit sirkuit satu loop tertutup dari baterai ke saklar dan dua lampu hingga menyala.",
        actionText: "Mulai Rangkaian Seri",
        cell: "C1",
      };
    } else if (!currentProgress.modules.parallel_circuit) {
      nextRec = {
        mode: "parallel",
        stage: "Tahap 4 (Sirkuit Paralel)",
        title: "Rangkaian Listrik Paralel",
        desc: "Rakit sirkuit percabangan kabel T dengan dua saklar mandiri untuk setiap lampu.",
        actionText: "Mulai Rangkaian Paralel",
        cell: "D1",
      };
    } else if (!currentProgress.modules.circuit_troubleshoot) {
      nextRec = {
        mode: "troubleshoot",
        stage: "Tahap 5 (Mahir)",
        title: "Tantangan Detektif Sirkuit",
        desc: "Misi mandiri tingkat mahir: analisis kendali saklar dan uji rangkaian tanpa panduan visual.",
        actionText: "Mulai Misi Detektif",
        cell: "E1",
      };
    } else {
      nextRec = {
        mode: "troubleshoot",
        stage: "Kurikulum Tuntas",
        title: "Eksplorasi Bebas & Pengujian",
        desc: "Luar biasa! Seluruh 5 modul kurikulum telah kamu tuntaskan dengan mandiri.",
        actionText: "Uji Misi Detektif Lagi",
        cell: "E1",
      };
    }

    const speakMenuGuidance = () => {
      speak(
        "Selamat datang di Panduan Suara LENTERA. Ada lima tahapan belajar yang bisa kamu pilih: Tahap satu, Pengenalan Komponen dengan meletakkan balok di kotak A1. Tahap dua, Kuis Taktil di kotak B1. Tahap tiga, Rangkaian Seri di kotak C1. Tahap empat, Rangkaian Paralel di kotak D1. Dan Tahap lima, Tantangan Detektif Sirkuit di kotak E1. Kamu bisa meletakkan satu balok di baris atas papan fisik untuk mulai belajar secara mandiri."
      );
    };

    return (
      <div className="card rounded-3xl border border-cs-text/10 bg-white/90 p-5 md:p-6 shadow-[0_12px_32px_rgba(46,42,94,0.07)] backdrop-blur-xl space-y-5">
        
        {/* Header Komponen */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-extrabold text-cs-text">
                  Panduan Suara & Taktil Interaktif
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  5 Level Belajar
                </span>
              </div>
              <p className="text-xs text-cs-text/60 mt-0.5">
                Pilih modul di bawah atau gunakan pintasan taktil di papan fisik tanpa layar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={speakMenuGuidance}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors shadow-xs"
              title="Dengarkan panduan suara cara memilih menu"
            >
              <Volume2 className="h-3.5 w-3.5 text-violet-600" />
              <span>Dengarkan Menu</span>
            </button>
            <div
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              <span suppressHydrationWarning>{activeStudent.avatar}</span>
              <span suppressHydrationWarning className="truncate max-w-[100px]">{activeStudent.name.split(" ")[0]}</span>
              <span suppressHydrationWarning className="text-[10px] text-indigo-600 font-extrabold ml-0.5">({currentProgress.xp} XP)</span>
            </div>
          </div>
        </div>

        {/* HERO CARD: Rekomendasi Modul Berikutnya */}
        <div suppressHydrationWarning className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-xs">
                  <Compass className="h-3 w-3" /> Rekomendasi Belajar
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  {nextRec.stage} • Pintasan Papan: {nextRec.cell}
                </span>
              </div>
              <h4 className="font-heading text-sm sm:text-base font-extrabold text-slate-900">
                {nextRec.title}
              </h4>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                {nextRec.desc}
              </p>
            </div>

            <button
              onClick={() => startGuide(nextRec.mode)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-indigo-700 active:scale-95 shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{nextRec.actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* PINTASAN PAPAN TAKTIL (ZERO-SCREEN TUI) */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Zap className="h-3 w-3" />
              </span>
              <span className="font-heading text-xs font-bold text-slate-800">
                Pintasan Papan Taktil (Pilih Modul Bebas Layar)
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              Taruh 1 balok di Baris 1 Papan Fisik
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Siswa tunanetra cukup meraba dan meletakkan 1 balok pada kotak baris atas papan (A1 – E1) untuk langsung memulai materi tanpa melihat layar:
          </p>

          <div className="grid grid-cols-5 gap-2 text-center">
            {/* A1 */}
            <button
              onClick={() => startGuide("recognition")}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:shadow-md active:scale-95 ${
                currentProgress.modules.component_recognition
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : "bg-white border-amber-200 text-slate-800 hover:border-amber-400"
              }`}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] font-black font-mono text-amber-600">A1</span>
                {currentProgress.modules.component_recognition ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-slate-400">1</span>
                )}
              </div>
              <span className="text-[11px] font-extrabold mt-0.5 truncate w-full">Pengenalan</span>
              <span className="text-[9px] text-slate-500 truncate w-full">6 Balok</span>
            </button>

            {/* B1 */}
            <button
              onClick={() => startGuide("quiz")}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:shadow-md active:scale-95 ${
                currentProgress.modules.component_quiz
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : "bg-white border-indigo-200 text-slate-800 hover:border-indigo-400"
              }`}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] font-black font-mono text-indigo-600">B1</span>
                {currentProgress.modules.component_quiz ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-slate-400">2</span>
                )}
              </div>
              <span className="text-[11px] font-extrabold mt-0.5 truncate w-full">Kuis Taktil</span>
              <span className="text-[9px] text-slate-500 truncate w-full">4 Soal</span>
            </button>

            {/* C1 */}
            <button
              onClick={() => startGuide("series")}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:shadow-md active:scale-95 ${
                currentProgress.modules.series_circuit
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : "bg-white border-violet-200 text-slate-800 hover:border-violet-400"
              }`}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] font-black font-mono text-violet-600">C1</span>
                {currentProgress.modules.series_circuit ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-slate-400">3</span>
                )}
              </div>
              <span className="text-[11px] font-extrabold mt-0.5 truncate w-full">Sirkuit Seri</span>
              <span className="text-[9px] text-slate-500 truncate w-full">1 Loop</span>
            </button>

            {/* D1 */}
            <button
              onClick={() => startGuide("parallel")}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:shadow-md active:scale-95 ${
                currentProgress.modules.parallel_circuit
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : "bg-white border-sky-200 text-slate-800 hover:border-sky-400"
              }`}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] font-black font-mono text-sky-600">D1</span>
                {currentProgress.modules.parallel_circuit ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-slate-400">4</span>
                )}
              </div>
              <span className="text-[11px] font-extrabold mt-0.5 truncate w-full">Paralel</span>
              <span className="text-[9px] text-slate-500 truncate w-full">Cabang T</span>
            </button>

            {/* E1 */}
            <button
              onClick={() => startGuide("troubleshoot")}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:shadow-md active:scale-95 ${
                currentProgress.modules.circuit_troubleshoot
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                  : "bg-white border-rose-200 text-slate-800 hover:border-rose-400"
              }`}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] font-black font-mono text-rose-600">E1</span>
                {currentProgress.modules.circuit_troubleshoot ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <span className="text-[9px] text-slate-400">5</span>
                )}
              </div>
              <span className="text-[11px] font-extrabold mt-0.5 truncate w-full">Detektif</span>
              <span className="text-[9px] text-slate-500 truncate w-full">Tingkat Mahir</span>
            </button>
          </div>
        </div>

        {/* KATALOG 5 TAHAPAN KURIKULUM PEMBELAJARAN LENGKAP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-xs font-black uppercase tracking-wider text-slate-700">
              Kurikulum Lengkap 5 Tahap Pembelajaran
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Progres Siswa: {completedCount} / 5 Modul Selesai
            </span>
          </div>

          {/* LEVEL 1: Pengenalan Komponen */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 transition-all hover:border-amber-300 hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 uppercase">
                    Tahap 1 • Kotak A1
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    6 Komponen Fisik • Rabaan Sel C3
                  </span>
                  {currentProgress.modules.component_recognition ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Dikuasai (+50 XP)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      Reward: +50 XP
                    </span>
                  )}
                </div>
                <h5 className="font-heading text-sm font-extrabold text-slate-900">
                  Pengenalan Bentuk Taktil Komponen Listrik
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Siswa meletakkan dan meraba 6 balok sirkuit (baterai, saklar, lampu, kabel lurus, kabel L, kabel T) di posisi C3. Asisten suara menjelaskan simbol timbul dan fungsinya secara detail.
                </p>
              </div>

              <button
                onClick={() => startGuide("recognition")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 active:scale-95 shrink-0 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{currentProgress.modules.component_recognition ? "Ulangi Pengenalan" : "Mulai Pengenalan"}</span>
              </button>
            </div>
          </div>

          {/* LEVEL 2: Kuis Tebak Komponen */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 transition-all hover:border-indigo-300 hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-800 uppercase">
                    Tahap 2 • Kotak B1
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    4 Soal Gamifikasi Taktil
                  </span>
                  {currentProgress.modules.component_quiz ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Dikuasai (+50 XP)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      Reward: +50 XP
                    </span>
                  )}
                </div>
                <h5 className="font-heading text-sm font-extrabold text-slate-900">
                  Kuis Tebak Komponen Taktil & Pemahaman Konsep
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Siswa mendengarkan pertanyaan fungsi (sumber energi, pengubah cahaya, saklar pemutus, kabel T) lalu menjawab secara mandiri dengan meletakkan balok di papan fisik.
                </p>
              </div>

              <button
                onClick={() => startGuide("quiz")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 shrink-0 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{currentProgress.modules.component_quiz ? "Ulangi Kuis" : "Mulai Kuis Taktil"}</span>
              </button>
            </div>
          </div>

          {/* LEVEL 3: Rangkaian Seri */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-4 transition-all hover:border-violet-300 hover:shadow-sm">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-800 uppercase">
                    Tahap 3 • Kotak C1
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Sirkuit 1 Loop Tertutup & Saklar
                  </span>
                  {currentProgress.modules.series_circuit ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Dikuasai (+100 XP)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-full">
                      Reward: +100 XP
                    </span>
                  )}
                </div>
              </div>

              <h5 className="font-heading text-sm font-extrabold text-slate-900">
                Perakitan Rangkaian Listrik Seri
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Menyusun baterai, kabel, saklar, dan lampu dalam satu jalur tertutup tanpa percabangan. Siswa membuktikan bahwa memutus saklar akan memadamkan seluruh lampu sekaligus.
              </p>

              {/* Pilihan Mode Belajar Seri yang Jelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                <button
                  onClick={() => startGuide("series")}
                  className="flex items-start gap-2.5 rounded-xl border border-violet-200 bg-white p-3 text-left hover:border-violet-400 hover:bg-violet-50/50 transition-all shadow-xs"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold text-xs mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-violet-950 flex items-center gap-1">
                      <span>Panduan Langkah per Sel</span>
                      <Play className="h-2.5 w-2.5 fill-violet-700 text-violet-700" />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                      Dipandu langkah demi langkah meletakkan balok ke koordinat (C5, B5, A5, dst). Cocok untuk pemula.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startGuide("adaptive_series")}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-violet-300 hover:bg-slate-50 transition-all shadow-xs"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                      <span>Merakit Bebas (Adaptif)</span>
                      <Play className="h-2.5 w-2.5 fill-slate-700 text-slate-700" />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                      Siswa bebas meletakkan balok di posisi mana saja, AI memvalidasi sirkuit loop tertutup secara otomatis.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* LEVEL 4: Rangkaian Paralel */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/30 p-4 transition-all hover:border-sky-300 hover:shadow-sm">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800 uppercase">
                    Tahap 4 • Kotak D1
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Sirkuit Bercabang Kabel T & 2 Lampu
                  </span>
                  {currentProgress.modules.parallel_circuit ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Dikuasai (+100 XP)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full">
                      Reward: +100 XP
                    </span>
                  )}
                </div>
              </div>

              <h5 className="font-heading text-sm font-extrabold text-slate-900">
                Perakitan Rangkaian Listrik Paralel
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Menyusun sirkuit bercabang menggunakan balok Kabel T dengan saklar mandiri untuk setiap lampu. Lampu cabang pertama tetap menyala meski cabang kedua dimatikan.
              </p>

              {/* Pilihan Mode Belajar Paralel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                <button
                  onClick={() => startGuide("parallel")}
                  className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-white p-3 text-left hover:border-sky-400 hover:bg-sky-50/50 transition-all shadow-xs"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold text-xs mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-sky-950 flex items-center gap-1">
                      <span>Panduan Langkah per Sel</span>
                      <Play className="h-2.5 w-2.5 fill-sky-700 text-sky-700" />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                      Dipandu merakit cabang atas, tengah, dan bawah langkah demi langkah.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => startGuide("adaptive_parallel")}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-sky-300 hover:bg-slate-50 transition-all shadow-xs"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                      <span>Merakit Bebas (Adaptif)</span>
                      <Play className="h-2.5 w-2.5 fill-slate-700 text-slate-700" />
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                      Rancang rangkaian bercabang mandiri dengan minimal dua lampu di mana saja.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* LEVEL 5: Detektif Sirkuit (Tingkat Mahir) */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4 transition-all hover:border-rose-300 hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                    Tahap 5 • Kotak E1 • Tingkat Mahir
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    3 Misi Troubleshooting & Kendali Saklar
                  </span>
                  {currentProgress.modules.circuit_troubleshoot ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" /> Dikuasai (+150 XP)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                      Reward: +150 XP
                    </span>
                  )}
                </div>
                <h5 className="font-heading text-sm font-extrabold text-slate-900">
                  Tantangan Detektif Sirkuit & Pemecahan Masalah
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Tantangan tingkat lanjut tanpa panduan koordinat visual: merakit sirkuit kendali saklar, menguji pemutus arus tanpa melepas balok komponen, dan merancang sirkuit paralel mandiri.
                </p>
              </div>

              <button
                onClick={() => startGuide("troubleshoot")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-rose-600 hover:to-pink-700 active:scale-95 shrink-0 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{currentProgress.modules.circuit_troubleshoot ? "Ulangi Misi Detektif" : "Mulai Misi Detektif"}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  /* ---------------------------------------------------------------- Active Guide */
  const progressPercent = isFinished ? 100 : (currentStep / totalSteps) * 100;
  const headerBg =
    mode === "recognition"
      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
      : mode === "quiz"
      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
      : mode === "troubleshoot"
      ? "bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600"
      : mode === "series" || mode === "adaptive_series"
      ? "bg-gradient-to-r from-violet-500 to-purple-600"
      : "bg-gradient-to-r from-sky-500 to-cyan-600";

  const progressBg =
    mode === "recognition"
      ? "bg-amber-500"
      : mode === "quiz"
      ? "bg-indigo-500"
      : mode === "troubleshoot"
      ? "bg-rose-500"
      : mode === "series" || mode === "adaptive_series"
      ? "bg-violet-500"
      : "bg-sky-500";

  const guideTitle =
    mode === "recognition"
      ? "Pengenalan Blok Komponen"
      : mode === "quiz"
      ? "Kuis Tebak Komponen Taktil"
      : mode === "troubleshoot"
      ? "Tantangan Detektif Sirkuit"
      : `${mode.includes("adaptive") ? "Rangkaian Bebas" : "Panduan"} ${
          mode.includes("series") ? "Seri" : "Paralel"
        }`;

  const stepSubtitle = isFinished
    ? "Selesai! 🎉"
    : mode === "recognition"
    ? `Komponen ${currentStep + 1} dari ${totalSteps}`
    : mode === "quiz"
    ? `Soal ${currentStep + 1} dari ${totalSteps}`
    : mode === "troubleshoot"
    ? `Misi ${currentStep + 1} dari ${totalSteps}`
    : `Langkah ${currentStep + 1} dari ${totalSteps}`;

  return (
    <div className="card rounded-2xl border border-cs-text/10 bg-white/80 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${headerBg}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            {isSpeaking ? (
              <Volume2 className="h-3.5 w-3.5 text-white animate-pulse" />
            ) : mode === "recognition" ? (
              <BookOpen className="h-3.5 w-3.5 text-white" />
            ) : mode === "quiz" ? (
              <HelpCircle className="h-3.5 w-3.5 text-white" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">{guideTitle}</h3>
            <p className="text-[10px] text-white/80">{stepSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/80" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/80" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full transition-all duration-700 ease-out ${progressBg}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {isFinished ? (
            /* Completion & Tactile Checkpoint Screen */
            <div className="text-center py-3 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-cs-text">
                  {mode === "recognition"
                    ? "Pengenalan Selesai! 🎉"
                    : mode === "quiz"
                    ? "Kuis Taktil Tuntas! 🏆"
                    : mode === "troubleshoot"
                    ? "Misi Detektif Selesai! 🕵️"
                    : "Rangkaian Selesai! 🎉"}
                </h3>
                <p className="text-xs text-cs-text/60 mt-0.5 leading-relaxed max-w-xs mx-auto">
                  {mode === "recognition"
                    ? "Hebat sekali! Kamu telah mengenal bentuk taktil dan fungsi seluruh komponen Lentera."
                    : mode === "quiz"
                    ? "Luar biasa! Kamu berhasil menjawab semua tebakan fungsi komponen secara mandiri di papan fisik."
                    : mode === "troubleshoot"
                    ? "Hebat sekali, detektif! Kamu membuktikan pemahaman mendalam tentang kendali saklar dan sirkuit listrik."
                    : mode === "series" || mode === "adaptive_series"
                    ? "Kamu telah membuat rangkaian seri! Semua komponen berbagi satu jalur."
                    : "Kamu telah membuat rangkaian paralel! Setiap cabang bekerja sendiri-sendiri."}
                </p>
              </div>

              {/* KARTU CHECKPOINT TAKTIL & INTERAKTIF */}
              {nextGuide ? (
                <div className="mt-2 text-left rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-3.5 shadow-sm space-y-2.5">
                  {checkpointPhase === "waiting_clear" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        <span>Tahap 1: Kosongkan Papan Fisik</span>
                      </div>
                      <p className="text-[11px] text-cs-text/70 leading-relaxed">
                        Silakan angkat semua balok yang ada di papan fisik agar grid bersih sebelum lanjut ke modul berikutnya.
                      </p>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/80 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                        <span>{boardBlockCount > 0 ? `${boardBlockCount} balok masih di papan` : "Papan sudah bersih..."}</span>
                      </div>
                    </div>
                  ) : checkpointPhase === "waiting_choice" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          Tahap 2: Pilihan di Papan Fisik
                        </span>
                        <span className="text-[10px] text-cs-text/50">Taktil / Layar</span>
                      </div>
                      <p className="text-xs font-bold text-cs-text leading-tight">
                        Lanjut ke {nextGuide.title}?
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Pilihan A1 = IYA */}
                        <button
                          onClick={() => startGuide(nextGuide.mode)}
                          className="group relative flex flex-col items-start rounded-xl border-2 border-emerald-300 bg-emerald-50/80 p-2.5 text-left transition-all hover:border-emerald-500 hover:shadow-md hover:bg-emerald-100/70 active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800">
                              A1 (Sudut Kiri)
                            </span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div className="text-xs font-extrabold text-emerald-950">
                            IYA, Lanjut
                          </div>
                          <div className="text-[10px] text-emerald-700/80 mt-0.5 leading-tight">
                            Mulai {nextGuide.title}
                          </div>
                        </button>

                        {/* Pilihan E1 = TIDAK */}
                        <button
                          onClick={resetGuide}
                          className="group relative flex flex-col items-start rounded-xl border-2 border-slate-200 bg-white p-2.5 text-left transition-all hover:border-slate-400 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-600">
                              E1 (Sudut Kanan)
                            </span>
                            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <div className="text-xs font-extrabold text-slate-800">
                            TIDAK, Istirahat
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Ke Menu Eksplorasi
                          </div>
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-cs-text/50 italic text-center pt-0.5">
                        💡 Letakkan balok di sudut kiri bawah (A1) atau sudut kanan bawah (E1).
                      </p>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Pilihan diterima! Membuka panduan...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={resetGuide}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-cs-text hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Menu Utama
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Current Instruction */}
              <div
                className={`rounded-xl border-2 p-3.5 transition-all ${
                  stepCompleted
                    ? "border-emerald-300 bg-emerald-50/70"
                    : mode === "recognition"
                    ? "border-amber-200 bg-amber-50/40"
                    : mode === "quiz"
                    ? "border-indigo-200 bg-indigo-50/40"
                    : mode === "troubleshoot"
                    ? "border-rose-200 bg-rose-50/40"
                    : mode === "series" || mode === "adaptive_series"
                    ? "border-violet-200 bg-violet-50/50"
                    : "border-sky-200 bg-sky-50/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {stepCompleted && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-1" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-cs-text leading-6">
                      {step?.instruction}
                    </p>
                  </div>
                </div>

                {/* Target cells visual */}
                {step && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {step.targetCells &&
                      Object.entries(step.targetCells).map(([cell, comp]) => {
                        const done = completedCells.has(cell);
                        return (
                          <span
                            key={cell}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                              done
                                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                                : "bg-white text-cs-text/60 ring-1 ring-slate-200"
                            }`}
                          >
                            {done ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {cell}: {COMPONENT_LABEL[comp] ?? comp}
                          </span>
                        );
                      })}
                  </div>
                )}

                {/* Penjelasan Komponen saat terdeteksi */}
                {stepCompleted && step?.explanation && (
                  <div className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/90 p-3 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                      <span>Penjelasan Komponen:</span>
                    </div>
                    <p className="leading-relaxed text-amber-900/90">{step.explanation}</p>
                    <button
                      onClick={skipStep}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.99]"
                    >
                      {currentStep < totalSteps - 1 ? (
                        <>
                          Lanjut ke Komponen Berikutnya <SkipForward className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Selesaikan Pengenalan <CheckCircle2 className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Hint */}
              {step?.hint && (
                <p className="text-[11px] text-cs-text/50 leading-5 px-1 italic">
                  💡 {step.hint}
                </p>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isMuted ? "bg-rose-100 text-rose-500" : "bg-slate-100 text-cs-text/50 hover:text-cs-text"
                    }`}
                    title={isMuted ? "Nyalakan suara" : "Matikan suara"}
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={replayVoice}
                    disabled={isMuted}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-cs-text/50 hover:text-cs-text disabled:opacity-30 transition-colors"
                    title={stepCompleted && step?.explanation ? "Putar ulang penjelasan" : "Putar ulang suara"}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-cs-text/50 hover:text-cs-text transition-colors"
                      title="Hentikan suara"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={skipStep}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-cs-text/60 hover:text-cs-text hover:bg-slate-200 transition-colors"
                  >
                    Lewati <SkipForward className="h-3 w-3" />
                  </button>
                  <button
                    onClick={resetGuide}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Berhenti
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
