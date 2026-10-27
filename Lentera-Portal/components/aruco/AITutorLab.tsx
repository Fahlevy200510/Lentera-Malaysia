"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { speakNarration, cancelSpeech } from "@/utils/audioCoordinator";
import { playEarcon } from "@/utils/soundEffects";
import { isStudentToken, getStudentNameFromToken } from "./VoiceGuide";

interface Msg {
  role: "ai" | "user";
  text: string;
  note?: string | null;
  error?: boolean;
}

const LAB_QUICK_CHIPS = [
  "Kenapa lampu belum menyala?",
  "Bagaimana cara kerja saklar geser?",
  "Apakah polaritas baterai sudah benar?",
  "Apa bedanya rangkaian seri dan paralel?",
];

interface AITutorLabProps {
  onBack?: () => void;
}

export default function AITutorLab({ onBack }: AITutorLabProps = {}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "Halo! Aku LENTERA AI Tutor di Edge Lab. Kamu bisa bertanya apa saja tentang rangkaian listrik sambil merakit balok di papan. Tekan tombol mikrofon untuk bertanya lewat suara, atau ketik pertanyaanmu!",
      note: "AI Tutor Siap Mendampingi Lab",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [circuitTelemetry, setCircuitTelemetry] = useState<{
    status?: string;
    graph_type?: string;
    placedCount?: number;
  }>({});

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasResultRef = useRef(false);
  const recordStartTimeRef = useRef<number>(0);
  const lastToggleRef = useRef<number>(0);
  const latestCircuitRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const loadingRef = useRef(false);
  const isTranscribingRef = useRef(false);
  const lastA1StateRef = useRef<boolean>(false);
  const isHandlingNavRef = useRef<boolean>(false);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    isTranscribingRef.current = isTranscribing;
  }, [isTranscribing]);

  // Sambutan & panduan suara saat siswa tunanetra masuk ke layar Tanya AI Tutor
  useEffect(() => {
    const timer = setTimeout(() => {
      speakNarration(
        "Selamat datang di Tanya AI Tutor! Di sini kamu bisa bertanya apa saja tentang sirkuit di mejamu lewat suara. Letakkan satu balok di kotak A1 sudut kiri bawah untuk mulai bicara, dan angkat balok jika sudah selesai bicara. Atau letakkan balok di sudut kanan atas E5 untuk kembali ke panduan modul.",
        {
          tag: "ai-tutor-lab-intro",
          rate: 0.94,
          pitch: 1.0,
        }
      );
    }, 600);
    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, []);

  const speak = (text: string) => {
    if (!voiceOn) return;
    speakNarration(text, {
      tag: "lab-ai-tutor-response",
      rate: 0.95,
      pitch: 1.0,
    });
  };

  const send = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    hasResultRef.current = true;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);
    playEarcon("step");

    try {
      const activeCircuit = latestCircuitRef.current;
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          mode: "troubleshooting",
          circuitState: activeCircuit
            ? {
                status: activeCircuit.status,
                circuit_closed: activeCircuit.status === "closed",
                polarity_correct: activeCircuit.status !== "short",
                graph_type: activeCircuit.graph_type,
                cells: activeCircuit.cells,
              }
            : null,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `Maaf, terjadi gangguan saat menghubungi AI: ${data.error ?? "Coba periksa koneksi."}`,
            error: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "ai", text: data.text, note: data.note }]);
      playEarcon("step");
      speak(data.text);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Gagal menghubungi server tutor: ${(err as Error).message}`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stopListening = useCallback(() => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    isListeningRef.current = false;
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    if (now - lastToggleRef.current < 450) return;
    lastToggleRef.current = now;

    if (loadingRef.current || isListeningRef.current || isTranscribingRef.current) return;

    cancelSpeech();
    playEarcon("click");
    hasResultRef.current = false;
    setVoiceStatus(null);
    setRecordSeconds(0);
    recordStartTimeRef.current = Date.now();

    // 1. Minta akses mikrofon pengguna dengan audio constraint optimal
    let stream: MediaStream | null = null;
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        console.warn("[AITutorLab] getUserMedia error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setVoiceStatus("Akses mikrofon diblokir browser. Silakan izinkan di bilah alamat.");
          playEarcon("wrong");
          return;
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setVoiceStatus("Perangkat mikrofon fisik tidak terdeteksi.");
          playEarcon("wrong");
          return;
        }
      }
    }

    setIsListening(true);
    isListeningRef.current = true;
    playEarcon("step");

    // Hitung detik merekam
    timerIntervalRef.current = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);

    // 2. Gunakan MediaRecorder + Groq Whisper Large v3 Turbo untuk transkripsi audio akurat
    if (stream && typeof MediaRecorder !== "undefined") {
      audioChunksRef.current = [];
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          // Bersihkan stream track di sini setelah recorder selesai mengambil buffer audio
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }

          if (hasResultRef.current) return;
          const duration = Date.now() - recordStartTimeRef.current;
          const chunks = audioChunksRef.current;

          if (chunks.length === 0 || duration < 800) {
            setVoiceStatus("Waktu bicara terlalu singkat.");
            playEarcon("clue");
            return;
          }

          const audioBlob = new Blob(chunks, {
            type: recorder.mimeType || "audio/webm",
          });

          setIsTranscribing(true);
          setVoiceStatus("Menerjemahkan suara...");
          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            const res = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            if (data?.silent || !data?.text || data.text.trim().length <= 1) {
              setVoiceStatus("Suara tidak terdengar jelas. Coba bicara lebih dekat ke mikrofon.");
              playEarcon("clue");
              return;
            }

            hasResultRef.current = true;
            setVoiceStatus(null);
            setInput(data.text);
            send(data.text);
          } catch (tErr) {
            console.error("[AITutorLab] Transcribe API error:", tErr);
            setVoiceStatus("Gagal memproses suara.");
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start(200);
      } catch (recErr) {
        console.warn("[AITutorLab] MediaRecorder setup error:", recErr);
      }
    }

    // 3. Paralel: Web Speech API lokal jika didukung untuk streaming instan
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript && transcript.trim().length > 3) {
            hasResultRef.current = true;
            stopListening();
            setInput(transcript);
            send(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("[AITutorLab] Web Speech warning:", event.error);
        };

        // Jangan hentikan mediaRecorder saat Web Speech selesai otomatis!
        recognition.onend = () => {};

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("[AITutorLab] Gagal memulai Web Speech:", err);
      }
    } else if (!stream) {
      alert(
        "Browser Anda belum mendukung pengenalan suara mikrofon. Silakan gunakan Google Chrome atau Edge terbaru."
      );
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    // Otomatis batas maksimal 12 detik mendengarkan
    listeningTimeoutRef.current = setTimeout(() => {
      stopListening();
    }, 12000);
  }, [send, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // Dengarkan live telemetry sirkuit dari kamera ArUco di lab & kelola pintasan fisik (A1 push-to-talk & E5 kembali)
  useEffect(() => {
    const handleCircuitUpdate = (e: any) => {
      if (e?.detail) {
        latestCircuitRef.current = e.detail;
        const cells = e.detail.cells || {};
        const placed = Object.values(cells).filter(Boolean).length;
        setCircuitTelemetry({
          status: e.detail.status,
          graph_type: e.detail.graph_type,
          placedCount: placed,
        });

        const cellA1 = cells["A1"];
        const cellE5 = cells["E5"];
        const isA1Placed = Boolean(cellA1 && !isStudentToken(cellA1));
        const isE5Placed = Boolean(cellE5 && !isStudentToken(cellE5));
        const isE5Student = isStudentToken(cellE5);

        // 1. Kartu Siswa di E5 -> Selesai / Logout
        if (isE5Student && !isHandlingNavRef.current) {
          isHandlingNavRef.current = true;
          cancelSpeech();
          stopListening();
          playEarcon("clear");
          const sName = getStudentNameFromToken(cellE5);
          localStorage.removeItem("lentera-session");
          const navTimer = setTimeout(() => {
            window.location.href = "/";
          }, 4500);
          speakNarration(
            `Kartu identitas ${sName} terdeteksi di sel keluar E5. Sesi belajar selesai. Sampai jumpa!`,
            {
              onEnd: () => {
                clearTimeout(navTimer);
                window.location.href = "/";
              },
            }
          );
          return;
        }

        // 2. Balok di E5 (sudut kanan atas) -> Kembali ke Panduan Modul (Menu Utama)
        if (isE5Placed && !isHandlingNavRef.current) {
          isHandlingNavRef.current = true;
          cancelSpeech();
          stopListening();
          playEarcon("click");
          speakNarration("Kembali ke panduan modul LENTERA Lab.", {
            onEnd: () => {
              onBack?.();
            },
          });
          return;
        }

        // 3. Tangible Push-To-Talk via balok di A1 (sudut kiri bawah)
        if (!isHandlingNavRef.current) {
          if (isA1Placed && !lastA1StateRef.current) {
            lastA1StateRef.current = true;
            if (!isListeningRef.current && !loadingRef.current && !isTranscribingRef.current) {
              startListening();
            }
          } else if (!isA1Placed && lastA1StateRef.current) {
            lastA1StateRef.current = false;
            if (isListeningRef.current) {
              stopListening();
            }
          }
        }
      }
    };

    window.addEventListener("circuit-update", handleCircuitUpdate);
    return () => window.removeEventListener("circuit-update", handleCircuitUpdate);
  }, [onBack, startListening, stopListening]);

  // Shortcut Aksesibilitas: Tekan tombol 'V' untuk mulai/berhenti bicara
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (!isInput && (e.key === "v" || e.key === "V" || e.key === "Vokal")) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, stopListening, loading]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const handleResetChat = () => {
    cancelSpeech();
    setMessages([
      {
        role: "ai",
        text: "Percakapan telah direset. Silakan tanyakan apa saja seputar sirkuit di meja labmu!",
        note: "AI Tutor Siap",
      },
    ]);
  };

  return (
    <div className="card rounded-[2rem] border border-cs-text/10 bg-white/95 p-5 shadow-[0_18px_50px_-20px_rgba(124,58,237,0.25)] backdrop-blur-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                Lentera AI Tutor (Live Lab)
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Explain-Before-Answer
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tanya lewat mikrofon atau ketik • Analisis sirkuit kamera real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors mr-1"
              title="Kembali ke Panduan Modul"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Panduan Modul</span>
            </button>
          )}
          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Reset percakapan chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (voiceOn) cancelSpeech();
              setVoiceOn(!voiceOn);
            }}
            className={`p-2 rounded-xl transition-all ${
              voiceOn
                ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
            title={voiceOn ? "Suara AI aktif (Klik untuk matikan)" : "Suara AI mati (Klik untuk aktifkan)"}
          >
            {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Telemetry Sensor Bar */}
      <div className="flex items-center justify-between gap-2 py-1.5 px-3 my-2 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900 shrink-0">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-indigo-600 shrink-0" />
          <span className="font-bold">Status Papan Kamera:</span>
          <span>
            {circuitTelemetry.placedCount ? `${circuitTelemetry.placedCount} balok terpasang` : "Papan kosong"}
          </span>
        </div>
        <span className="font-mono font-bold text-indigo-700 uppercase">
          {circuitTelemetry.status === "closed"
            ? "Rangkaian Tertutup (Menyala)"
            : circuitTelemetry.status === "short"
            ? "Korsleting!"
            : "Rangkaian Terbuka"}
        </span>
      </div>

      {/* Tangible Shortcut Info */}
      <div className="flex items-center gap-2 py-1 px-3 mb-2 rounded-xl bg-violet-50/70 border border-violet-100 text-[11px] text-violet-900 shrink-0">
        <strong className="font-extrabold text-violet-950">Pintasan Taktil:</strong>
        <span>
          Taruh balok di <span className="font-mono font-bold text-violet-700">A1</span> untuk bicara & angkat jika selesai. Taruh balok di <span className="font-mono font-bold text-slate-700">E5</span> untuk kembali.
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 cs-scroll">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] ${m.role === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-xs shadow-sm"
                    : m.error
                    ? "bg-rose-50 border border-rose-200 text-rose-700 rounded-bl-xs"
                    : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-2xs"
                }`}
              >
                {m.text}
              </div>
              {m.note && (
                <div className="inline-flex items-center gap-1 mt-1 text-[10.5px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                  <Brain className="h-2.5 w-2.5" />
                  <span>{m.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl text-xs font-bold text-slate-600 shadow-2xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
              <span>AI sedang meraba data sirkuit dan menyusun jawaban...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Chips */}
      <div className="flex items-center gap-1.5 py-2 overflow-x-auto cs-scroll shrink-0">
        {LAB_QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => send(chip)}
            disabled={loading}
            className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 border border-slate-200/70 transition-all active:scale-95 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Voice Status & Real-time Feedback */}
      {isListening && (
        <div className="flex items-center justify-between px-3 py-1.5 my-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="truncate">🎙️ Mendengarkan ({recordSeconds}s)... Bicara sekarang (Tekan mic atau tombol V untuk selesai)</span>
          </div>
          <button
            onClick={stopListening}
            className="underline text-[11px] text-rose-800 hover:text-rose-950 font-extrabold shrink-0 ml-2"
          >
            Selesai
          </button>
        </div>
      )}

      {isTranscribing && (
        <div className="flex items-center gap-2 px-3 py-1.5 my-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shrink-0">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
          <span>⚡ Mentranskripsi suara dengan Groq Whisper...</span>
        </div>
      )}

      {voiceStatus && !isListening && !isTranscribing && (
        <div className="flex items-center justify-between px-3 py-1.5 my-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium shrink-0">
          <span className="truncate">{voiceStatus}</span>
          <button
            onClick={() => setVoiceStatus(null)}
            className="text-amber-600 hover:text-amber-900 font-bold ml-2 text-sm shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
        <button
          onClick={toggleListening}
          aria-label={isListening ? "Sedang mendengarkan... klik untuk berhenti" : "Tanya dengan suara mikrofon"}
          title={isListening ? "Sedang mendengarkan... Bicara sekarang!" : "Tanya AI lewat mikrofon"}
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isListening
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse border-2 border-rose-300"
              : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
          }`}
        >
          <Mic className="h-5 w-5" />
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={
            isListening
              ? "🎙️ Mendengarkan suaramu... silakan bicara..."
              : "Tanyakan apa saja seputar sirkuit di lab..."
          }
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-violet-500 focus:outline-none transition-all disabled:opacity-50"
        />

        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="h-11 w-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 transition-all active:scale-95"
          title="Kirim pertanyaan"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
