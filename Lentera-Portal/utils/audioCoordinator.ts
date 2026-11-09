import { normalizeIndonesianPhonetics } from "./phonetics";

let activeTimer: ReturnType<typeof setTimeout> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let currentSpeechSeq = 0;

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  tag?: string;
}

export function getSavedSpeechRate(): number {
  if (typeof window === "undefined") return 1.0;
  try {
    const saved = localStorage.getItem("lentera-speech-rate");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 5.0) return parsed;
    }
  } catch {}
  return 1.0;
}

export function setSavedSpeechRate(rate: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("lentera-speech-rate", rate.toString());
    window.dispatchEvent(new CustomEvent("lentera-speech-rate-update", { detail: rate }));
  } catch {}
}

export function cancelSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  currentSpeechSeq += 1;
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {}
  (window as any).__lenteraSpeaking = false;
  (window as any).__lenteraActiveUtterance = null;
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return Boolean(activeTimer || (window as any).__lenteraSpeaking || window.speechSynthesis.speaking);
}

function splitIntoSentenceChunks(text: string, maxLen = 170): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= maxLen) return [normalized];

  // Pisahkan berdasarkan akhir kalimat (. ! ?) atau baris baru
  const rawSentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of rawSentences) {
    if (!sentence) continue;
    if (sentence.length > maxLen) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // Jika satu kalimat sangat panjang, bagi pada koma atau titik koma
      const subParts = sentence.split(/(?<=[,;:])\s+/);
      let subCurrent = "";
      for (const part of subParts) {
        if ((subCurrent ? subCurrent.length + 1 + part.length : part.length) <= maxLen) {
          subCurrent = subCurrent ? `${subCurrent} ${part}` : part;
        } else {
          if (subCurrent) chunks.push(subCurrent.trim());
          subCurrent = part;
        }
      }
      if (subCurrent) chunks.push(subCurrent.trim());
    } else if ((current ? current.length + 1 + sentence.length : sentence.length) <= maxLen) {
      current = current ? `${current} ${sentence}` : sentence;
    } else {
      if (current) chunks.push(current.trim());
      current = sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [normalized];
}

export function speakNarration(text: string, options: SpeakOptions = {}): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onEnd?.();
    return;
  }

  const cleanText = text.trim();
  if (!cleanText) {
    options.onEnd?.();
    return;
  }

  const synth = window.speechSynthesis;
  const mySeq = ++currentSpeechSeq;

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  try {
    if (synth.paused) synth.resume();
    synth.cancel();
  } catch {}

  (window as any).__lenteraSpeaking = true;
  (window as any).__lenteraCurrentTag = options.tag || "general";

  // Jeda 80ms agar antrean speech engine Chrome bersih sebelum memutar ucapan baru
  activeTimer = setTimeout(() => {
    if (mySeq !== currentSpeechSeq) return;
    activeTimer = null;
    try {
      const phoneticText = normalizeIndonesianPhonetics(cleanText);
      const chunks = splitIntoSentenceChunks(phoneticText, 170);
      if (chunks.length === 0) {
        (window as any).__lenteraSpeaking = false;
        options.onEnd?.();
        return;
      }

      const voices = synth.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesia")
      );
      const targetRate = options.rate ?? getSavedSpeechRate();
      const targetPitch = options.pitch ?? 1.02;

      let hasEnded = false;
      const finishAll = (wasCanceled = false) => {
        if (hasEnded) return;
        hasEnded = true;
        if (mySeq !== currentSpeechSeq) return;
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        (window as any).__lenteraSpeaking = false;
        (window as any).__lenteraActiveUtterance = null;
        if (!wasCanceled) {
          options.onEnd?.();
          try {
            window.dispatchEvent(new CustomEvent("lentera-speech-ended"));
          } catch {}
        }
      };

      const speakChunkAt = (idx: number) => {
        if (mySeq !== currentSpeechSeq || hasEnded) return;
        if (idx >= chunks.length) {
          finishAll(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[idx]);
        if (idVoice) utterance.voice = idVoice;
        utterance.lang = idVoice ? idVoice.lang : "id-ID";
        utterance.rate = targetRate;
        utterance.pitch = targetPitch;

        utterance.onstart = () => {
          if (mySeq === currentSpeechSeq) {
            (window as any).__lenteraSpeaking = true;
          }
        };

        utterance.onend = () => {
          if (mySeq !== currentSpeechSeq || hasEnded) return;
          if (idx + 1 < chunks.length) {
            speakChunkAt(idx + 1);
          } else {
            finishAll(false);
          }
        };

        utterance.onerror = (err) => {
          const errType = (err as any)?.error;
          if (errType === "canceled" || errType === "interrupted") {
            finishAll(true);
            return;
          }
          console.warn("[audioCoordinator] Speech chunk error:", err);
          if (mySeq === currentSpeechSeq && !hasEnded && idx + 1 < chunks.length) {
            speakChunkAt(idx + 1);
          } else {
            finishAll(false);
          }
        };

        (window as any).__lenteraActiveUtterance = utterance;
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      };

      speakChunkAt(0);
    } catch (e) {
      console.error("[audioCoordinator] speak failed:", e);
      if (mySeq !== currentSpeechSeq) return;
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      (window as any).__lenteraSpeaking = false;
      options.onEnd?.();
    }
  }, 80);
}
