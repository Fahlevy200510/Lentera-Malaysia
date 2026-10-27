"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { speakNarration, cancelSpeech } from "@/utils/audioCoordinator";
import { playEarcon } from "@/utils/soundEffects";

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

export default function AITutorLab() {
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
  const [circuitTelemetry, setCircuitTelemetry] = useState<{
    status?: string;
    graph_type?: string;
    placedCount?: number;
  }>({});

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const latestCircuitRef = useRef<any>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Dengarkan live telemetry sirkuit dari kamera ArUco di lab
  useEffect(() => {
    const handleCircuitUpdate = (e: any) => {
      if (e?.detail) {
        latestCircuitRef.current = e.detail;
        const placed = e.detail.cells
          ? Object.values(e.detail.cells).filter(Boolean).length
          : 0;
        setCircuitTelemetry({
          status: e.detail.status,
          graph_type: e.detail.graph_type,
          placedCount: placed,
        });
      }
    };

    window.addEventListener("circuit-update", handleCircuitUpdate);
    return () => window.removeEventListener("circuit-update", handleCircuitUpdate);
  }, []);

  const speak = (text: string) => {
    if (!voiceOn) return;
    speakNarration(text, {
      tag: "lab-ai-tutor-response",
      rate: 0.95,
      pitch: 1.0,
    });
  };

  const toggleListening = () => {
    if (typeof window === "undefined") return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Browser Anda belum mendukung pengenalan suara mikrofon langsung. Silakan gunakan Google Chrome atau Microsoft Edge."
      );
      return;
    }

    try {
      cancelSpeech();
      playEarcon("click");
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          setIsListening(false);
          send(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[AITutorLab] Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("[AITutorLab] Gagal memulai speech recognition:", err);
      setIsListening(false);
    }
  };

  const send = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

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
