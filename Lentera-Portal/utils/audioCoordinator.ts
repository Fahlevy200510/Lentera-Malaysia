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
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) return parsed;
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
      const utterance = new SpeechSynthesisUtterance(phoneticText);

      const voices = synth.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesia")
      );
      if (idVoice) utterance.voice = idVoice;
      utterance.lang = idVoice ? idVoice.lang : "id-ID";
      utterance.rate = options.rate ?? getSavedSpeechRate();
      utterance.pitch = options.pitch ?? 1.02;

      let hasEnded = false;
      const finish = (wasCanceled = false) => {
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

      utterance.onstart = () => {
        if (mySeq === currentSpeechSeq) {
          (window as any).__lenteraSpeaking = true;
        }
      };

      utterance.onend = () => finish(false);
      utterance.onerror = (err) => {
        const errType = (err as any)?.error;
        if (errType === "canceled" || errType === "interrupted") {
          finish(true);
          return;
        }
        console.warn("[audioCoordinator] Speech error:", err);
        finish(false);
      };

      (window as any).__lenteraActiveUtterance = utterance;

      // Keepalive khusus voice network/remote di Chrome agar narasi >15s tidak terputus
      if (idVoice && idVoice.localService === false) {
        keepAliveTimer = setInterval(() => {
          if (mySeq !== currentSpeechSeq) {
            if (keepAliveTimer) {
              clearInterval(keepAliveTimer);
              keepAliveTimer = null;
            }
            return;
          }
          if (!hasEnded && synth.speaking) {
            synth.pause();
            synth.resume();
          } else if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
          }
        }, 12000);
      }

      if (synth.paused) synth.resume();
      synth.speak(utterance);
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
