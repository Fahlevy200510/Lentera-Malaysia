import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/tutor
// Body: { message: string, mode?: string, circuitState?: object, history?: {role, text}[] }
// Returns: { text: string, note: string | null, mode: string }
//
// Dual-Engine Architecture:
// 1. Groq LLaMA 3.3 70B if GROQ_API_KEY is configured.
// 2. Intelligent CLE Deterministic Reasoning Fallback if offline/no key,
//    ensuring Netlify deployment and LIDM jury review never fails.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are LENTERA AI ASSISTANT — an adaptive, inclusive science lab tutor for blind and visually impaired learners at the special junior high school level, developed for LIDM 2026.

PEDAGOGICAL ROLE & PRINCIPLES:
1. "Explain Before Answer": Never give an instant answer or directly fix a circuit. Ask reflective prompts and guide the learner step by step.
2. Tactile Vocabulary: NEVER rely on visual-only instructions such as "look at the picture" or "notice the wire color". Use tactile and spatial language such as "feel", "sense", "trace the path", "left/right side", "raised/indented texture", and "listen for the click".
3. Language: Always respond in warm, supportive, inclusive, concise English (2–4 sentences) that is comfortable for screen readers and text-to-speech.
4. Interaction Modes:
   - Exploration Mode: Explore components and tactile analogies for electrical flow.
   - Troubleshooting Mode: Systematically trace circuit faults using sensor data.
   - Concept Reflection: Reflect on why a phenomenon occurs.
   - Evaluation Mode: Use formative tactile questions to check independent understanding.`;

interface ChatTurn {
  role: "ai" | "user";
  text: string;
}

// Normalises circuit telemetry so both schemas work:
//  - UI/simulator: { polarity_correct, circuit_closed, switch_state }
//  - legacy:       { isLampReversed, isSwitchOpen }
function normalizeCircuit(cs: any): { lampReversed: boolean; switchOpen: boolean; pathOpen: boolean; allGood: boolean } | null {
  if (!cs || typeof cs !== "object") return null;
  const lampReversed = cs.isLampReversed === true || cs.polarity_correct === false;
  const switchOpen = cs.isSwitchOpen === true || cs.switch_state === "off";
  const pathOpen = cs.circuit_closed === false;
  const allGood = !lampReversed && !switchOpen && !pathOpen && (cs.circuit_closed === true || cs.polarity_correct === true);
  return { lampReversed, switchOpen, pathOpen, allGood };
}

// Intelligent Offline Fallback Engine
function generateCLEFallbackResponse(
  message: string,
  mode: string,
  circuitState?: any
): { text: string; note: string } {
  const m = message.toLowerCase();
  const cs = normalizeCircuit(circuitState);

  if (m.includes("parent")) {
    if (m.includes("series") || m.includes("parallel")) {
      return {
        text: "You can explain it with a road analogy: a series circuit is like one road with no branches, while a parallel circuit is like roads that branch. Ask the learner to feel two wires arranged in sequence and then in branches, and describe the difference in their own words.",
        note: "Parent Guide: Series & Parallel Circuits",
      };
    }
    return {
      text: "At home, invite the learner to safely explore an electrical object such as a wall-light switch, then ask what they feel when the lever is pressed. Give them time to answer before explaining so their curiosity can grow.",
      note: "Parent Guide: Tactile Activity at Home",
    };
  }

  const isOtherIntent =
    mode === "reflection" || mode === "evaluation" ||
    /concept|difference|quiz|test|evaluation|question|what is|what does|function|how does|explain|series|parallel/.test(m);
  const mentionsFault = /broken|dead|off|not working|doesn't work|does not work|wrong|error|dim|won't light|will not light/.test(m);
  const wantsDiagnosis = mode === "troubleshooting" || mentionsFault || !isOtherIntent;

  if (cs && wantsDiagnosis && (cs.lampReversed || cs.switchOpen || cs.pathOpen)) {
    if (cs.lampReversed) {
      return {
        text: "Feel the lamp component holder at grid B1. Can you sense the raised positive terminal facing the battery? Rotate the lamp block 180 degrees and feel the difference again.",
        note: "CLE Diagnosis: Reversed lamp polarity (Explain-Before-Answer)",
      };
    }
    if (cs.switchOpen) {
      return {
        text: "Touch the mechanical switch at grid A2 on the right side of your board. Is the lever raised, or has it been pressed down until you hear a click?",
        note: "CLE Diagnosis: Open switch (Open Circuit)",
      };
    }
    return {
      text: "Let’s investigate together. Trace the tactile wire from the battery’s positive terminal with your fingertip. Is there a path that feels disconnected or loose before it reaches the lamp?",
      note: "CLE Diagnosis: Open circuit path",
    };
  }
  if (cs && !mentionsFault && wantsDiagnosis && cs.allGood && (mode === "troubleshooting" || /correct|done|lit|working|finished|check|verify/.test(m))) {
    return {
      text: "Great, the path from the battery through the switch to the lamp is connected with the correct polarity. Now for a challenge: if you add one more lamp in series, do you think the first lamp would feel brighter or dimmer?",
      note: "CLE: Circuit closed successfully",
    };
  }

  if (mode === "troubleshooting" || mentionsFault) {
    return {
      text: "Let’s investigate together. First, trace the tactile wire from the battery’s positive terminal with your fingertip. Is there a path that feels disconnected or loose before it reaches the lamp?",
      note: "CLE Diagnosis: Independent tactile path tracing",
    };
  }

  if (mode === "reflection" || m.includes("why") || m.includes("concept") || m.includes("difference") || m.includes("series") || m.includes("parallel")) {
    if (m.includes("series") || m.includes("parallel")) {
      return {
        text: "Imagine a series circuit as a single school hallway where everyone must walk in sequence, so if one person stops, everyone is held up. A parallel circuit is like having two separate hallways. If one lamp is removed from a parallel circuit, what do you think you would feel at the other lamp?",
        note: "Concept Reflection: Tactile Path Analogy",
      };
    }
    return {
      text: "That is a great question to reflect on! When electric current passes through a lamp filament, electrical energy is transformed into heat and light. Feel the bulb surface after it has been on for a while — does it feel warm?",
      note: "Concept Reflection: Electrical Energy Transformation",
    };
  }

  if (mode === "evaluation" || m.includes("quiz") || m.includes("test") || m.includes("evaluation") || m.includes("question")) {
    return {
      text: "Tactile Quiz Challenge: You have 1 battery and 2 lamps arranged in sequence along a single wire with no branches. If the switch is pressed, is this a series or parallel circuit? Answer based on the path you can trace by touch.",
      note: "Formative Evaluation: Understanding Series Circuits",
    };
  }

  if (m.includes("battery")) {
    return {
      text: "The battery is our electrical energy source. Feel both ends: the side with the small raised bump is the positive terminal, while the flat side is negative. Current flows out from the raised positive terminal.",
      note: "Tactile Exploration: Identifying Battery Polarity",
    };
  }

  if (m.includes("switch")) {
    return {
      text: "A switch works like a lifting bridge. When you press the lever down, the bridge closes and current can pass. When you raise it, the path opens and the current stops.",
      note: "Tactile Exploration: Switch Mechanics",
    };
  }

  if (m.includes("lamp") || m.includes("light")) {
    return {
      text: "The lamp is a load that converts electrical energy. The lamp component on our board has a raised tactile marker on its side to help you match the current direction correctly.",
      note: "Tactile Exploration: Identifying the Lamp Load",
    };
  }

  return {
    text: "Hello! I’m LENTERA AI Assistant. I’m ready to support your science lab today. You can feel the components on your tactile board or ask about electrical circuit concepts you want to explore.",
    note: "Inclusive Learning Support Active",
  };
}

const ALLOWED_MODES = new Set(["exploration", "troubleshooting", "reflection", "evaluation"]);

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "LENTERA AI Tutor",
    engine: process.env.GROQ_API_KEY ? "groq-with-local-fallback" : "CLE-Rule-Engine-Local",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();
    const requestedMode = String(body?.mode ?? "exploration");
    const mode = ALLOWED_MODES.has(requestedMode) ? requestedMode : "exploration";
    const circuitState = body?.circuitState ?? null;
    const history: ChatTurn[] = Array.isArray(body?.history)
      ? body.history
          .filter((h: any) => (h?.role === "user" || h?.role === "ai") && typeof h?.text === "string")
          .slice(-6)
      : [];

    if (!message) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (message.length > 1200) {
      return NextResponse.json({ error: "Message is too long. Maximum 1,200 characters." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // If Groq API key is not present, use the deterministic CLE fallback
    if (!apiKey) {
      const fallback = generateCLEFallbackResponse(message, mode, circuitState);
      return NextResponse.json({
        text: fallback.text,
        note: fallback.note,
        mode,
        engine: "CLE-Rule-Engine-Local",
      });
    }

    // If Groq API key is provided, use LLaMA 3.3 70B
    const contextBlock = circuitState
      ? `\n\nCurrent physical circuit sensor telemetry:\n${JSON.stringify(circuitState, null, 2)}\nCurrent mode: ${mode}`
      : `\n\nCurrent mode: ${mode}`;

    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}${contextBlock}` },
      ...history.slice(-6).map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.7,
          max_tokens: 450,
        }),
      });

      if (!groqRes.ok) {
        const errorText = await groqRes.text();

        console.error("GROQ API ERROR:", groqRes.status, errorText);

        const fallback = generateCLEFallbackResponse(
          message,
          mode,
          circuitState
        );

        return NextResponse.json({
          text: fallback.text,
          note: `Groq error ${groqRes.status} — using CLE fallback`,
          mode,
          engine: "CLE-Rule-Engine-Local (Groq-Failover)",
          groqError: errorText,
        });
      }

      const data = await groqRes.json();
      const text: string =
        data?.choices?.[0]?.message?.content?.trim() ||
        "Try feeling the components on your board again. What do you notice?";

      let note = `Mode: ${mode.toUpperCase()}`;
      if (circuitState) {
        if (circuitState.polarity_correct === false) note = "CLE: Reversed Polarity Detected";
        else if (circuitState.circuit_closed === false) note = "CLE: Open Circuit Path";
        else if (circuitState.circuit_closed === true) note = "CLE: Circuit Closed Successfully";
      }

      return NextResponse.json({ text, note, mode, engine: "Groq-LLaMA-3.3-70B" });
    } catch (apiErr) {
      // Failover safely
      const fallback = generateCLEFallbackResponse(message, mode, circuitState);
      return NextResponse.json({
        text: fallback.text,
        note: fallback.note,
        mode,
        engine: "CLE-Rule-Engine-Local (Exception-Failover)",
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
