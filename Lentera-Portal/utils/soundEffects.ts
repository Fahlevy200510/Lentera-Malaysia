/**
 * SoundEffects & Haptic Earcon Generator for LENTERA
 * Uses Web Audio API (Zero external assets, instant <10ms response)
 * Dispatches hardware buzzer triggers over WebSocket via "lentera-trigger-buzzer" event.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type EarconType = "click" | "step" | "success" | "warning" | "clue" | "clear" | "wrong" | "victory";

export function playEarcon(type: EarconType) {
  // 1. Trigger hardware buzzer via event (handled by ArUcoDetector WebSocket)
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lentera-trigger-buzzer", { detail: { pattern: type } })
    );
  }

  // 2. Play Web Audio API earcon for local browser feedback
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    if (type === "click") {
      // Subtle tactile click (15ms pop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.02);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (type === "step") {
      // Joyful celebratory ascending chime (C5 -> E5 -> G5 -> C6 shimmer)
      playTone(ctx, 523.25, now, 0.08, "sine", 0.22);
      playTone(ctx, 523.25, now, 0.07, "triangle", 0.14);

      playTone(ctx, 659.25, now + 0.07, 0.09, "sine", 0.24);
      playTone(ctx, 659.25, now + 0.07, 0.08, "triangle", 0.15);

      playTone(ctx, 783.99, now + 0.14, 0.11, "sine", 0.26);
      playTone(ctx, 783.99, now + 0.14, 0.09, "triangle", 0.16);

      // Final sparkling high chime with overtone
      playTone(ctx, 1046.5, now + 0.22, 0.26, "sine", 0.30);
      playTone(ctx, 1046.5, now + 0.22, 0.20, "triangle", 0.18);
      playTone(ctx, 2093.0, now + 0.23, 0.16, "sine", 0.08); // Sparkle overtone
    } else if (type === "success") {
      // Grand celebratory fanfare: C5 -> E5 -> G5 -> C6 -> E6 + C-Major chord burst
      playTone(ctx, 523.25, now, 0.10, "triangle", 0.22);
      playTone(ctx, 659.25, now + 0.09, 0.10, "triangle", 0.24);
      playTone(ctx, 783.99, now + 0.18, 0.12, "triangle", 0.26);
      playTone(ctx, 1046.5, now + 0.27, 0.35, "triangle", 0.30);
      playTone(ctx, 1318.5, now + 0.32, 0.40, "sine", 0.25);
      // Harmonizing chord sustain
      playTone(ctx, 523.25, now + 0.32, 0.45, "sine", 0.15);
      playTone(ctx, 783.99, now + 0.32, 0.45, "sine", 0.18);
    } else if (type === "victory") {
      // Grand celebratory triumphant victory fanfare (C5 -> E5 -> G5 -> C6 -> Chord Burst)
      playTone(ctx, 523.25, now, 0.10, "triangle", 0.24);
      playTone(ctx, 523.25, now, 0.10, "sine", 0.16);

      playTone(ctx, 659.25, now + 0.10, 0.11, "triangle", 0.26);
      playTone(ctx, 659.25, now + 0.10, 0.11, "sine", 0.18);

      playTone(ctx, 783.99, now + 0.21, 0.13, "triangle", 0.28);
      playTone(ctx, 783.99, now + 0.21, 0.13, "sine", 0.20);

      playTone(ctx, 1046.5, now + 0.33, 0.25, "triangle", 0.32);
      playTone(ctx, 1046.5, now + 0.33, 0.25, "sine", 0.24);

      // Triumphant sustained C-Major triad chord burst with sparkle overtones
      playTone(ctx, 523.25, now + 0.52, 0.55, "triangle", 0.18);
      playTone(ctx, 659.25, now + 0.52, 0.55, "triangle", 0.20);
      playTone(ctx, 783.99, now + 0.52, 0.55, "triangle", 0.22);
      playTone(ctx, 1046.5, now + 0.52, 0.60, "sine", 0.30);
      playTone(ctx, 1318.5, now + 0.52, 0.50, "sine", 0.22);
      playTone(ctx, 2093.0, now + 0.54, 0.35, "sine", 0.10); // High shimmer
    } else if (type === "wrong") {
      // Gentle, friendly 2-note descending cue (F4 -> C4, ~260ms) - educational & clear, not scary
      playTone(ctx, 349.23, now, 0.11, "triangle", 0.20);
      playTone(ctx, 349.23, now, 0.11, "sine", 0.14);

      playTone(ctx, 261.63, now + 0.11, 0.20, "triangle", 0.22);
      playTone(ctx, 261.63, now + 0.11, 0.20, "sine", 0.16);
    } else if (type === "clue") {
      // Gentle curious marimba tone (G4 -> A4)
      playTone(ctx, 392.0, now, 0.09, "sine", 0.15);
      playTone(ctx, 440.0, now + 0.08, 0.14, "sine", 0.15);
    } else if (type === "clear") {
      // Crystal chime confirmation (A5 -> C6)
      playTone(ctx, 880.0, now, 0.07, "sine", 0.16);
      playTone(ctx, 1046.5, now + 0.06, 0.16, "sine", 0.2);
    } else if (type === "warning") {
      // 3 rapid square wave alarm pulses (short circuit)
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.11;
        playTone(ctx, 240, t, 0.07, "sawtooth", 0.25);
      }
    }
  } catch (err) {
    // Ignore audio context errors
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  vol: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}
