import { normalizeIndonesianPhonetics } from "./phonetics";

let activeTimer: ReturnType<typeof setTimeout> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  tag?: string;
}

export function cancelSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
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

  // Jeda 80ms agar antrean speech engine Chrome di Windows bersih sebelum memutar ucapan baru
  activeTimer = setTimeout(() => {
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
      utterance.rate = options.rate ?? 0.94;
      utterance.pitch = options.pitch ?? 1.02;

      let hasEnded = false;
      const finish = () => {
        if (hasEnded) return;
        hasEnded = true;
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        (window as any).__lenteraSpeaking = false;
        (window as any).__lenteraActiveUtterance = null;
        options.onEnd?.();
      };

      utterance.onstart = () => {
        (window as any).__lenteraSpeaking = true;
      };

      utterance.onend = finish;
      utterance.onerror = (err) => {
        console.warn("[audioCoordinator] Speech error:", err);
        finish();
      };

      (window as any).__lenteraActiveUtterance = utterance;

      // Keepalive khusus voice network/remote di Chrome agar narasi >15s tidak terputus
      if (idVoice && idVoice.localService === false) {
        keepAliveTimer = setInterval(() => {
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
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      (window as any).__lenteraSpeaking = false;
      options.onEnd?.();
    }
  }, 80);
}
