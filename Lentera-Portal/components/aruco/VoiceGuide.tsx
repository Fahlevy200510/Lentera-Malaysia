"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause, SkipForward, RotateCcw, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

/* ---------------------------------------------------------------- Types */
type CellData = { component: string; rotation: number };
type StepDef = {
  instruction: string;
  voice: string;
  targetCells?: Record<string, string>; // cell -> expected component
  validator?: (cells: Record<string, any>, status: string, graphType?: string) => boolean;
  hint?: string;
};

/* ---------------------------------------------------------------- Guide Data */
const SERIES_STEPS: StepDef[] = [
  {
    instruction: "Place the Battery at position C5",
    voice: "Let's start building a series circuit! First, place the battery component at position C5, right in the center of the top row. The battery is the power source of our circuit.",
    targetCells: { "C5": "battery" },
    hint: "The battery has a plus and minus symbol. Place it in the center of the top row (furthest from you).",
  },
  {
    instruction: "Connect cables from the Battery to both sides",
    voice: "Great job! Now connect the battery to the rest of the circuit. Place straight cables at positions B5 and D5, on both sides of the battery.",
    targetCells: { "B5": "straight_cable", "D5": "straight_cable" },
    hint: "Straight cables go horizontally to connect components in a line.",
  },
  {
    instruction: "Add corner cables at A5 and E5",
    voice: "Now we need to turn the circuit path upward. Place L-shaped corner cables at positions A5 and E5. These will redirect the current flow from horizontal to vertical.",
    targetCells: { "A5": "l_cable", "E5": "l_cable" },
    hint: "L-cables make a 90-degree turn. A5 turns up-right, E5 turns up-left.",
  },
  {
    instruction: "Run vertical cables on the left side: A2, A3, A4",
    voice: "Excellent! Now run the circuit upward along the left side. Place three straight cables vertically at positions A4, A3, and A2. These form the left path of the circuit loop.",
    targetCells: { "A2": "straight_cable", "A3": "straight_cable", "A4": "straight_cable" },
    hint: "These cables should be oriented vertically (90 degrees).",
  },
  {
    instruction: "Run vertical cables on the right side: E2, E4",
    voice: "Now do the same on the right side. Place vertical straight cables at positions E2 and E4. We will leave E3 open for the switch component.",
    targetCells: { "E2": "straight_cable", "E4": "straight_cable" },
    hint: "Leave E3 empty for now — that's where the switch will go!",
  },
  {
    instruction: "Place the Switch at E3",
    voice: "Now place the switch at position E3 on the right side. The switch controls whether current flows through the circuit. When it's closed, the lamps will light up!",
    targetCells: { "E3": "switch" },
    hint: "The switch opens and closes the circuit path.",
  },
  {
    instruction: "Add corner cables at the top: A1 and E1",
    voice: "Almost there! Place L-shaped corner cables at positions A1 and E1 to connect the top of the circuit loop.",
    targetCells: { "A1": "l_cable", "E1": "l_cable" },
    hint: "These corners connect the left and right vertical paths across the top.",
  },
  {
    instruction: "Place 2 Lamps at B1 and D1, and a Switch at C1",
    voice: "Final step! Place two lamp components at positions B1 and D1, and place a second switch right between them at C1. In a series circuit, all components share the same single path. If one lamp burns out, or if you open either switch, the entire circuit breaks! Congratulations, you have successfully built a series circuit with two switches!",
    targetCells: { "B1": "lamp", "D1": "lamp", "C1": "switch" },
    hint: "The second switch at C1 controls both lamps because they are in series.",
  },
];

const PARALLEL_STEPS: StepDef[] = [
  {
    instruction: "Place the Battery at position C5",
    voice: "Now let's build a parallel circuit! Start by placing the battery at position C5, the center of the top row. This is our power source.",
    targetCells: { "C5": "battery" },
    hint: "Same starting point as the series circuit — the battery goes in the center of the top row.",
  },
  {
    instruction: "Build the top section",
    voice: "Add straight cables next to the battery at B5 and D5, then put L-shaped corner cables at A5 and E5 to turn downwards.",
    targetCells: { "B5": "straight_cable", "D5": "straight_cable", "A5": "l_cable", "E5": "l_cable" },
    hint: "Connect cables outwards from the battery to the outer corners A5 and E5.",
  },
  {
    instruction: "Build the middle branch",
    voice: "Now let's make the first parallel branch! Place a T-cable at A3 and E3 to split the current. Then, put a switch at B3, a lamp at C3, and a straight cable at D3.",
    targetCells: { "A3": "t_cable", "E3": "t_cable", "B3": "switch", "C3": "lamp", "D3": "straight_cable" },
    hint: "The middle branch needs T-cables on the edges, a switch at B3, and a lamp in the center (C3).",
  },
  {
    instruction: "Build the bottom branch",
    voice: "Finally, let's build the second parallel branch at the bottom. Place corner L-cables at A1 and E1. Then, add a switch at B1, a lamp at C1, and a straight cable at D1.",
    targetCells: { "A1": "l_cable", "E1": "l_cable", "B1": "switch", "C1": "lamp", "D1": "straight_cable" },
    hint: "The bottom branch needs L-cables at the corners, a switch at B1, and a lamp in the center (C1).",
  },
  {
    instruction: "Connect the branches",
    voice: "To complete the circuit, we need to connect the top, middle, and bottom sections. Place straight cables along the sides at A4, E4, A2, and E2. Congratulations, you have built a parallel circuit with independent switches for each lamp!",
    targetCells: { "A4": "straight_cable", "E4": "straight_cable", "A2": "straight_cable", "E2": "straight_cable" },
    hint: "Use straight cables to connect the T-cables to the corners on the left and right sides.",
  }
];


const ADAPTIVE_SERIES_STEPS: StepDef[] = [
  {
    instruction: "Place the Battery anywhere",
    voice: "Let's build a freeform series circuit! Start by placing the battery anywhere on the board.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Place the battery block anywhere you like.",
  },
  {
    instruction: "Place two Lamps anywhere",
    voice: "Great! Now place two lamps anywhere else on the board.",
    validator: (cells) => Object.values(cells).filter((c: any) => c && c.component === "lamp").length >= 2,
    hint: "Place two lamps anywhere.",
  },
  {
    instruction: "Connect them in a single path",
    voice: "Now, use cables to connect the battery and the two lamps so that they form one single continuous loop. There should be only one path for the electricity!",
    validator: (cells, status, graphType) => status === "success" && graphType === "series",
    hint: "Connect them so there are no branching paths.",
  },
];

const ADAPTIVE_PARALLEL_STEPS: StepDef[] = [
  {
    instruction: "Place the Battery anywhere",
    voice: "Let's build a freeform parallel circuit! Start by placing the battery anywhere on the board.",
    validator: (cells) => Object.values(cells).some((c: any) => c && c.component === "battery"),
    hint: "Place the battery block anywhere you like.",
  },
  {
    instruction: "Place two Lamps anywhere",
    voice: "Great! Now place two lamps anywhere else on the board.",
    validator: (cells) => Object.values(cells).filter((c: any) => c && c.component === "lamp").length >= 2,
    hint: "Place two lamps anywhere.",
  },
  {
    instruction: "Connect them with multiple paths",
    voice: "Now, use cables to connect the battery and the two lamps so that each lamp has its own separate path. You will need T-junction cables to split the electricity!",
    validator: (cells, status, graphType) => status === "success" && graphType === "parallel",
    hint: "Connect them so the circuit branches into multiple paths.",
  },
];

/* ---------------------------------------------------------------- Component */
export default function VoiceGuide() {
  const [mode, setMode] = useState<"idle" | "series" | "parallel" | "adaptive_series" | "adaptive_parallel">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [stepCompleted, setStepCompleted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const steps = mode === "series" ? SERIES_STEPS : mode === "parallel" ? PARALLEL_STEPS : mode === "adaptive_series" ? ADAPTIVE_SERIES_STEPS : mode === "adaptive_parallel" ? ADAPTIVE_PARALLEL_STEPS : [];
  const step = steps[currentStep];
  const totalSteps = steps.length;
  const isFinished = currentStep >= totalSteps;

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || isMuted) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, [isMuted]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Listen to circuit-update events to track progress
  useEffect(() => {
    if (mode === "idle" || !step) return;

    const handleCircuitUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const cells = detail?.cells || {};
      
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
        // Asumsikan event kita kirimkan status dan graph_type di detail
        allFound = step.validator(cells, detail?.status, detail?.graph_type);
      }
      
      setCompletedCells(newCompleted);

      if (allFound && !stepCompleted) {
        setStepCompleted(true);
        // Auto-advance after a short celebration
        if (currentStep < totalSteps - 1) {
          speak("Well done! Moving to the next step.");
          setTimeout(() => {
            setCurrentStep((prev) => prev + 1);
            setStepCompleted(false);
            setCompletedCells(new Set());
          }, 2500);
        } else {
          speak("Congratulations! You have completed the entire circuit! Amazing work!");
        }
      }
    };

    window.addEventListener("circuit-update", handleCircuitUpdate);
    return () => window.removeEventListener("circuit-update", handleCircuitUpdate);
  }, [mode, step, stepCompleted, currentStep, totalSteps, speak]);

  // Speak the current step instruction when step changes
  useEffect(() => {
    if (mode !== "idle" && step && !isMuted) {
      speak(step.voice);
    }
  }, [currentStep, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGuide = (guideMode: "series" | "parallel" | "adaptive_series" | "adaptive_parallel") => {
    setMode(guideMode);
    setCurrentStep(0);
    setStepCompleted(false);
    setCompletedCells(new Set());
    setIsExpanded(true);
  };

  const resetGuide = () => {
    stopSpeaking();
    setMode("idle");
    setCurrentStep(0);
    setStepCompleted(false);
    setCompletedCells(new Set());
  };

  const skipStep = () => {
    stopSpeaking();
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setStepCompleted(false);
      setCompletedCells(new Set());
    }
  };

  const toggleMute = () => {
    if (!isMuted) stopSpeaking();
    setIsMuted((prev) => !prev);
  };

  const replayVoice = () => {
    if (step) speak(step.voice);
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
            <h3 className="font-heading text-sm font-extrabold text-cs-text">Voice Guide</h3>
            <p className="text-[11px] text-cs-text/50">Step-by-step circuit building assistant</p>
          </div>
        </div>
        
        <p className="text-xs text-cs-text/65 leading-5 mb-4">
          Choose a circuit type below. The voice assistant will guide you through each step of building the circuit on your board.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => startGuide("series")}
            className="group relative overflow-hidden rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 text-left transition-all hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">Step-by-step</div>
            <div className="font-heading text-sm font-extrabold text-cs-text">Series</div>
            <Play className="absolute bottom-3 right-3 h-4 w-4 text-violet-300 group-hover:text-violet-500 transition-colors" />
          </button>
          <button
            onClick={() => startGuide("parallel")}
            className="group relative overflow-hidden rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-4 text-left transition-all hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">Step-by-step</div>
            <div className="font-heading text-sm font-extrabold text-cs-text">Parallel</div>
            <Play className="absolute bottom-3 right-3 h-4 w-4 text-sky-300 group-hover:text-sky-500 transition-colors" />
          </button>
          <button
            onClick={() => startGuide("adaptive_series")}
            className="group relative overflow-hidden rounded-xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-4 text-left transition-all hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-100"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 mb-1">Freeform</div>
            <div className="font-heading text-sm font-extrabold text-cs-text">Series</div>
            <Play className="absolute bottom-3 right-3 h-4 w-4 text-fuchsia-300 group-hover:text-fuchsia-500 transition-colors" />
          </button>
          <button
            onClick={() => startGuide("adaptive_parallel")}
            className="group relative overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-left transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Freeform</div>
            <div className="font-heading text-sm font-extrabold text-cs-text">Parallel</div>
            <Play className="absolute bottom-3 right-3 h-4 w-4 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- Active Guide */
  const progressPercent = isFinished ? 100 : (currentStep / totalSteps) * 100;
  const accentColor = mode === "series" ? "violet" : "sky";

  return (
    <div className="card rounded-2xl border border-cs-text/10 bg-white/80 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
          mode === "series"
            ? "bg-gradient-to-r from-violet-500 to-purple-600"
            : "bg-gradient-to-r from-sky-500 to-cyan-600"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            {isSpeaking ? (
              <Volume2 className="h-3.5 w-3.5 text-white animate-pulse" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">
              {mode.includes("series") ? "Series" : "Parallel"} {mode.includes("adaptive") ? "Freeform" : "Guide"}
            </h3>
            <p className="text-[10px] text-white/70">
              {isFinished ? "Completed! 🎉" : `Step ${currentStep + 1} of ${totalSteps}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/70" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/70" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            mode === "series" ? "bg-violet-500" : "bg-sky-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {isFinished ? (
            /* Completion Screen */
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-cs-text">Circuit Complete!</h3>
              <p className="text-xs text-cs-text/60 leading-5 max-w-xs mx-auto">
                {mode === "series"
                  ? "You've built a series circuit! All components share one path. If one breaks, the whole circuit stops."
                  : "You've built a parallel circuit! Each branch works independently. If one lamp fails, the others stay on."}
              </p>
              <button
                onClick={resetGuide}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-cs-text hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Try Another Circuit
              </button>
            </div>
          ) : (
            <>
              {/* Current Instruction */}
              <div className={`rounded-xl border-2 p-3.5 ${
                stepCompleted
                  ? "border-emerald-300 bg-emerald-50"
                  : mode === "series"
                  ? "border-violet-200 bg-violet-50/50"
                  : "border-sky-200 bg-sky-50/50"
              }`}>
                <p className="text-sm font-bold text-cs-text leading-6">
                  {stepCompleted && <CheckCircle2 className="inline h-4 w-4 text-emerald-500 mr-1.5 -mt-0.5" />}
                  {step?.instruction}
                </p>
                
                {/* Target cells visual */}
                {step && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {step.targetCells && Object.entries(step.targetCells).map(([cell, comp]) => {
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
                          {cell}: {comp.replace("_", " ")}
                        </span>
                      );
                    })}
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
                    title={isMuted ? "Unmute voice" : "Mute voice"}
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={replayVoice}
                    disabled={isMuted}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-cs-text/50 hover:text-cs-text disabled:opacity-30 transition-colors"
                    title="Replay voice"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-cs-text/50 hover:text-cs-text transition-colors"
                      title="Stop speaking"
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
                    Skip <SkipForward className="h-3 w-3" />
                  </button>
                  <button
                    onClick={resetGuide}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Stop
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
