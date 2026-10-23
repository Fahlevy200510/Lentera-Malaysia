"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause, SkipForward, RotateCcw, CheckCircle2, Sparkles, ChevronDown, ChevronUp, BookOpen, Lock, HelpCircle, AlertTriangle } from "lucide-react";
import { completeModule, getStudentProgress, DEFAULT_PROGRESS, type StudentProgress } from "@/utils/progress";
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

  const nextGuide = NEXT_GUIDE_MAP[mode];

  useEffect(() => {
    setStudentProgress(getStudentProgress());
    const handleProg = () => setStudentProgress(getStudentProgress());
    window.addEventListener("lentera-progress-update", handleProg);
    window.addEventListener("storage", handleProg);
    return () => {
      window.removeEventListener("lentera-progress-update", handleProg);
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
              speak("Pilihan diterima: Kuis Taktil! Angkat balok dari A1 untuk memulai kuis.", () => {
                setTimeout(() => startGuide("quiz"), 1200);
              });
            } else if (cells["B1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Misi Rangkaian Seri! Angkat balok dari B1 untuk memulai panduan.", () => {
                setTimeout(() => startGuide("series"), 1200);
              });
            } else if (cells["C1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Misi Rangkaian Paralel! Angkat balok dari C1 untuk memulai panduan.", () => {
                setTimeout(() => startGuide("parallel"), 1200);
              });
            } else if (cells["D1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("click");
              speak("Pilihan diterima: Tantangan Detektif Sirkuit! Angkat balok dari D1 untuk memulai tantangan.", () => {
                setTimeout(() => startGuide("troubleshoot"), 1200);
              });
            } else if (cells["E1"]) {
              lastMenuSelectRef.current = now;
              playEarcon("clue");
              speak("Menu Pilihan LENTERA: Letakkan satu balok di A1 untuk Kuis Taktil, di B1 untuk Rangkaian Seri, di C1 untuk Rangkaian Paralel, atau di D1 untuk Tantangan Detektif Sirkuit. Silakan angkat balok dari E1 dan tentukan pilihanmu!");
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
    return (
      <div className="card rounded-2xl border border-cs-text/10 bg-white/80 p-5 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-extrabold text-cs-text">Panduan Suara Interaktif</h3>
            <p className="text-[11px] text-cs-text/50">Asisten suara inklusif langkah demi langkah</p>
          </div>
        </div>
        
        <p className="text-xs text-cs-text/65 leading-5 mb-3">
          Pilih mode di bawah. Mulai dari pengenalan blok komponen terlebih dahulu, atau langsung merakit rangkaian di papan.
        </p>

        {/* Menu Papan Taktil (Zero-Screen TUI) Info Banner */}
        <div className="mb-4 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/80 via-indigo-50/50 to-purple-50/80 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-700 bg-white/90 px-2 py-0.5 rounded-full shadow-xs border border-violet-100">
              <Sparkles className="h-3 w-3 text-violet-500" /> Navigasi Papan Taktil (Zero-Screen)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Taruh 1 balok di baris 1</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-4 mb-2.5">
            Siswa tunanetra dapat langsung meletakkan 1 balok di baris atas papan (A1 - D1) untuk memilih materi secara mandiri:
          </p>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <button
              onClick={() => startGuide("quiz")}
              className="p-1.5 rounded-lg bg-white/90 border border-violet-100 hover:border-violet-300 font-bold text-violet-800 transition-colors shadow-xs"
            >
              <div className="font-mono text-xs font-black text-violet-600">A1</div>
              <div>Kuis Taktil</div>
            </button>
            <button
              onClick={() => startGuide("series")}
              className="p-1.5 rounded-lg bg-white/90 border border-violet-100 hover:border-violet-300 font-bold text-violet-800 transition-colors shadow-xs"
            >
              <div className="font-mono text-xs font-black text-violet-600">B1</div>
              <div>Rangkaian Seri</div>
            </button>
            <button
              onClick={() => startGuide("parallel")}
              className="p-1.5 rounded-lg bg-white/90 border border-violet-100 hover:border-violet-300 font-bold text-violet-800 transition-colors shadow-xs"
            >
              <div className="font-mono text-xs font-black text-violet-600">C1</div>
              <div>Rangkaian Paralel</div>
            </button>
            <button
              onClick={() => startGuide("troubleshoot")}
              className="p-1.5 rounded-lg bg-white/90 border border-violet-100 hover:border-violet-300 font-bold text-rose-700 transition-colors shadow-xs"
            >
              <div className="font-mono text-xs font-black text-rose-600">D1</div>
              <div>Detektif Sirkuit</div>
            </button>
          </div>
        </div>

        {/* Tahap 1: Pengenalan Blok Komponen */}
        <div className="mb-3">
          <button
            onClick={() => startGuide("recognition")}
            className="group relative w-full overflow-hidden rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-3.5 text-left transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                  studentProgress.modules.component_recognition
                    ? "text-emerald-700 bg-emerald-100/90"
                    : "text-amber-700 bg-amber-100/90"
                }`}>
                  {studentProgress.modules.component_recognition ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Tahap 1 • Dikuasai
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3 w-3" /> Tahap 1 • Mulai Dari Sini
                    </>
                  )}
                </span>
                <div className="font-heading text-sm font-extrabold text-cs-text">
                  Pengenalan Blok Komponen
                </div>
                <p className="text-[11px] text-cs-text/65 mt-1 max-w-[280px] leading-4">
                  Ambil dan letakkan balok di C3. Asisten menjelaskan bentuk taktil & fungsi tiap komponen.
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200 group-hover:scale-105 transition-transform">
                <Play className="h-3.5 w-3.5 fill-white translate-x-0.5" />
              </div>
            </div>
          </button>
        </div>

        {/* Kuis Taktil: Tebak Komponen */}
        <div className="mb-4">
          <button
            onClick={() => startGuide("quiz")}
            className="group relative w-full overflow-hidden rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-3.5 text-left transition-all hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                  studentProgress.modules.component_quiz
                    ? "text-emerald-700 bg-emerald-100/90"
                    : "text-indigo-700 bg-indigo-100/90"
                }`}>
                  {studentProgress.modules.component_quiz ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Kuis • Selesai
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-3 w-3" /> Gamifikasi TUI
                    </>
                  )}
                </span>
                <div className="font-heading text-sm font-extrabold text-cs-text">
                  Kuis Tebak Komponen Taktil
                </div>
                <p className="text-[11px] text-cs-text/65 mt-1 max-w-[280px] leading-4">
                  Lentera menanyakan fungsi komponen, jawab dengan meletakkan balok di papan fisik.
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Play className="h-3.5 w-3.5 fill-white translate-x-0.5" />
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-px flex-1 bg-slate-200/80" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-cs-text/45">
            Tahap 2 • Merakit Rangkaian
          </span>
          <div className="h-px flex-1 bg-slate-200/80" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <button
            onClick={() => startGuide("series")}
            className="group relative overflow-hidden rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-3.5 text-left transition-all hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">
              <span>Bertahap</span>
              {studentProgress.modules.series_circuit && (
                <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Selesai
                </span>
              )}
            </div>
            <div className="font-heading text-xs font-extrabold text-cs-text">Rangkaian Seri</div>
            <Play className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-violet-300 group-hover:text-violet-500 transition-colors" />
          </button>
          <button
            onClick={() => startGuide("parallel")}
            className="group relative overflow-hidden rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-3.5 text-left transition-all hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
              <span>Bertahap</span>
              {studentProgress.modules.parallel_circuit && (
                <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Selesai
                </span>
              )}
            </div>
            <div className="font-heading text-xs font-extrabold text-cs-text">Rangkaian Paralel</div>
            <Play className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-sky-300 group-hover:text-sky-500 transition-colors" />
          </button>
          <button
            onClick={() => startGuide("adaptive_series")}
            className="group relative overflow-hidden rounded-xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-3.5 text-left transition-all hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-100"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 mb-1">Bebas</div>
            <div className="font-heading text-xs font-extrabold text-cs-text">Seri Bebas</div>
            <Play className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-fuchsia-300 group-hover:text-fuchsia-500 transition-colors" />
          </button>
          <button
            onClick={() => startGuide("adaptive_parallel")}
            className="group relative overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 text-left transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Bebas</div>
            <div className="font-heading text-xs font-extrabold text-cs-text">Paralel Bebas</div>
            <Play className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>

        <div className="flex items-center gap-2 my-2.5">
          <div className="h-px flex-1 bg-slate-200/80" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 font-extrabold">
            Tahap 3 • Tingkat Mahir
          </span>
          <div className="h-px flex-1 bg-slate-200/80" />
        </div>

        {/* Tahap 3: Tantangan Detektif Sirkuit */}
        <div>
          <button
            onClick={() => startGuide("troubleshoot")}
            className="group relative w-full overflow-hidden rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 p-3.5 text-left transition-all hover:border-rose-400 hover:shadow-lg hover:shadow-rose-100 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                  studentProgress.modules.circuit_troubleshoot
                    ? "text-emerald-700 bg-emerald-100/90"
                    : "text-rose-700 bg-rose-100/90"
                }`}>
                  {studentProgress.modules.circuit_troubleshoot ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Mahir • Selesai
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" /> Detektif Sirkuit (Troubleshooting)
                    </>
                  )}
                </span>
                <div className="font-heading text-sm font-extrabold text-cs-text">
                  Tantangan Detektif Sirkuit
                </div>
                <p className="text-[11px] text-cs-text/65 mt-1 max-w-[280px] leading-4">
                  Misi analisis kendali saklar dan uji rangkaian paralel bebas tanpa bantuan panduan visual.
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
                <Play className="h-3.5 w-3.5 fill-white translate-x-0.5" />
              </div>
            </div>
          </button>
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
