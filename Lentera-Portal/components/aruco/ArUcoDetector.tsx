"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2, Sparkles, Zap, Lightbulb, ToggleLeft,
  SlidersHorizontal, RefreshCw, Globe, ShieldCheck, ChevronDown, ChevronUp,
} from "lucide-react";

type ComponentData = { component: string; rotation: number; id: number };
type DetectionData = {
  status: "connecting" | "connected" | "disconnected";
  cells: Record<string, ComponentData>;
  circuit_status?: { status: string; cells: string[]; narration: string; graph_type?: string };
};

const KOMPONEN_INFO: Record<string, { icon: React.ReactNode; color: string }> = {
  battery: { icon: <Zap className="h-5 w-5" />, color: "text-amber-500" },
  lamp: { icon: <Lightbulb className="h-5 w-5" />, color: "text-amber-500" },
  switch: { icon: <ToggleLeft className="h-5 w-5" />, color: "text-sky-500" },
  straight_cable: { icon: <span className="text-xs font-bold">—</span>, color: "text-slate-400" },
  l_cable: { icon: <span className="text-xs font-bold">└</span>, color: "text-slate-400" },
  t_cable: { icon: <span className="text-xs font-bold">┬</span>, color: "text-slate-400" },
  resistor: { icon: <span className="text-xs font-bold">R</span>, color: "text-orange-500" },
};

const STATUS_LABEL: Record<DetectionData["status"], string> = {
  connecting: "Menghubungkan…",
  connected: "Terhubung",
  disconnected: "Terputus",
};

/**
 * Menyelesaikan endpoint WebSocket dan Stream Kamera secara cerdas:
 * - Mendukung Cloudflare Tunnel HTTPS/WSS (misal: edge.lentera.id)
 * - Mendukung pengujian lokal (localhost atau IP lokal)
 */
function resolveEndpoints(target: string) {
  const clean = (target || "").trim();
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  if (clean.startsWith("ws://") || clean.startsWith("wss://")) {
    const httpEquiv = clean.replace("ws://", "http://").replace("wss://", "https:");
    return {
      wsUrl: clean,
      streamUrl: `${httpEquiv}/stream`,
      displayHost: clean,
      isTunnel: clean.startsWith("wss://"),
    };
  }

  const isLocalOrIp = clean === "localhost" || clean === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(clean);

  if (isLocalOrIp) {
    return {
      wsUrl: `ws://${clean}:8765`,
      streamUrl: `http://${clean}:8766/stream`,
      displayHost: clean,
      isTunnel: false,
    };
  }

  // Domain Ngrok / Cloudflare Tunnel (bebas Mixed-Content)
  const proto = isHttps ? "https" : "http";
  const wsProto = isHttps ? "wss" : "ws";
  const domainOnly = clean.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "").replace(/\/$/, "");
  const isNgrok = domainOnly.includes("ngrok");
  const streamParam = isNgrok ? "?ngrok-skip-browser-warning=true" : "";

  return {
    wsUrl: `${wsProto}://${domainOnly}`,
    streamUrl: `${proto}://${domainOnly}/stream${streamParam}`,
    displayHost: domainOnly,
    isTunnel: true,
  };
}

export default function ArUcoDetector() {
  const [detections, setDetections] = useState<DetectionData>({ cells: {}, status: "connecting" });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string>("localhost");
  const [showConfig, setShowConfig] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [liveFrame, setLiveFrame] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const manualDisconnectRef = useRef(false);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2800);
  };

  const connectWebSocket = useCallback((targetEndpoint: string) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const { wsUrl, isTunnel } = resolveEndpoints(targetEndpoint);
    setDetections((prev) => ({ ...prev, status: "connecting" }));

    try {
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      websocket.onopen = () => {
        setDetections((prev) => ({ ...prev, status: "connected" }));
        manualDisconnectRef.current = false;
        showToast(isTunnel ? "Terhubung ke LENTERA Edge (Cloud Tunnel)" : "Terhubung ke LENTERA Lokal");
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "camera_frame" && data.image) {
            setLiveFrame(data.image);
            return;
          }

          if (data.type === "grid_state") {
            setDetections((prev) => ({
              ...prev,
              cells: data.cells,
              circuit_status: data.circuit_status,
            }));

            const comps = Object.values(data.cells).filter(Boolean) as ComponentData[];
            const isBattery = comps.some((c) => c?.component === "battery");
            const isLamp = comps.some((c) => c?.component === "lamp");
            const isSwitch = comps.some((c) => c?.component === "switch");
            const complete = data.circuit_status?.status === "success";

            window.dispatchEvent(
              new CustomEvent("circuit-update", {
                detail: {
                  isBattery,
                  isLamp,
                  isSwitch,
                  isComplete: complete,
                  cells: data.cells,
                  status: data.circuit_status?.status || "unknown",
                  graph_type: data.circuit_status?.graph_type || "unknown",
                },
              })
            );
          }

          if (data.narration && typeof window !== "undefined") {
            const utterance = new SpeechSynthesisUtterance(data.narration);
            utterance.lang = "id-ID";
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        } catch (parseErr) {
          console.error("Gagal memproses data WS:", parseErr);
        }
      };

      websocket.onclose = () => {
        setDetections((prev) => ({ ...prev, status: "disconnected" }));
        // Auto-reconnect jika tidak sengaja terputus
        if (!manualDisconnectRef.current) {
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            connectWebSocket(targetEndpoint);
          }, 3500);
        }
      };

      websocket.onerror = () => {
        setDetections((prev) => ({ ...prev, status: "disconnected" }));
      };
    } catch (err) {
      console.error("Koneksi WebSocket terblokir:", err);
      setDetections((prev) => ({ ...prev, status: "disconnected" }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function autoDiscoverAndConnect() {
      const DEFAULT_TUNNEL =
        process.env.NEXT_PUBLIC_LENTERA_TUNNEL_DOMAIN || "anchor-scruffy-clerk.ngrok-free.dev";
      let targetEndpoint = DEFAULT_TUNNEL;

      // 1. Cek auto-discovery dari Cloudflare Quick Tunnel relay
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch("https://ntfy.sh/lentera_malaysia_edge_tunnel/raw?poll=1", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = (await res.text()).trim();
          if (text.includes("trycloudflare.com")) {
            targetEndpoint = text.replace(/^https?:\/\//, "").replace(/\/$/, "");
            console.log("[Auto-Sync] Menemukan Cloudflare Quick Tunnel aktif:", targetEndpoint);
          }
        }
      } catch {
        // Gunakan targetEndpoint default jika relay belum ada/timeout
      }

      // 2. Jika user pernah menyimpan endpoint kustom sendiri
      try {
        const saved = localStorage.getItem("lentera_edge_endpoint");
        if (saved && saved !== "edge.lentera.id" && !targetEndpoint.includes("trycloudflare.com")) {
          targetEndpoint = saved;
        }
      } catch {}

      if (!cancelled) {
        setEndpoint(targetEndpoint);
        setCustomInput(targetEndpoint);
        connectWebSocket(targetEndpoint);
      }
    }

    autoDiscoverAndConnect();

    return () => {
      cancelled = true;
      manualDisconnectRef.current = true;
      wsRef.current?.close();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connectWebSocket]);

  const handleManualConnect = (newEndpoint: string) => {
    const clean = newEndpoint.trim();
    if (!clean) return;
    setEndpoint(clean);
    try {
      localStorage.setItem("lentera_edge_endpoint", clean);
    } catch {}
    connectWebSocket(clean);
  };

  const handleDisconnect = () => {
    manualDisconnectRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setDetections((prev) => ({ ...prev, status: "disconnected" }));
    showToast("Kamera dan WebSocket diputuskan.");
  };

  const handleCalibrate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "command", action: "calibrate" }));
      showToast("Mempersiapkan Kalibrasi... Pastikan 4 komponen berada di 4 sudut terluar papan.");
    } else {
      showToast("Gagal: Raspberry Pi belum terhubung.");
    }
  };

  const resolved = resolveEndpoints(endpoint);

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="card flex flex-col gap-3 rounded-2xl border border-cs-text/10 bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                detections.status === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : detections.status === "connecting"
                  ? "bg-amber-400 animate-ping"
                  : "bg-rose-500"
              }`}
            />
            <div>
              <span className="text-xs font-bold text-cs-text">
                Status: {STATUS_LABEL[detections.status]}
              </span>
              <span className="ml-2 text-[10px] text-slate-400 font-semibold">
                ({resolved.displayHost})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {detections.status === "connected" ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-colors"
              >
                Putuskan
              </button>
            ) : (
              <button
                onClick={() => {
                  manualDisconnectRef.current = false;
                  connectWebSocket(endpoint);
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Sambungkan Ulang
              </button>
            )}

            <button
              onClick={handleCalibrate}
              disabled={isCalibrating || detections.status !== "connected"}
              className="flex items-center gap-1.5 rounded-lg bg-cs-primary/10 px-3 py-1.5 text-xs font-bold text-cs-primaryDeep hover:bg-cs-primary/20 disabled:opacity-40 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isCalibrating ? "Mengkalibrasi…" : "Kalibrasi"}
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cs-text hover:bg-slate-100 transition-colors"
              title="Pengaturan Sambungan"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Config Panel */}
        {showConfig && (
          <div className="mt-2 pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Pengaturan Endpoint Edge:</span>
              <span className="text-[10px] text-slate-400">Zero-Config Mode</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleManualConnect(customInput);
                  }
                }}
                placeholder="Domain Tunnel (anchor-scruffy-clerk.ngrok-free.dev)"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-cs-primary"
              />
              <button
                type="button"
                onClick={() => handleManualConnect(customInput)}
                className="bg-cs-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-cs-primaryDeep transition-colors whitespace-nowrap"
              >
                Simpan & Sambungkan
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span>Preset Cepat:</span>
              <button
                type="button"
                onClick={() => {
                  setCustomInput("anchor-scruffy-clerk.ngrok-free.dev");
                  handleManualConnect("anchor-scruffy-clerk.ngrok-free.dev");
                }}
                className="underline hover:text-cs-primary font-semibold"
              >
                Ngrok Tunnel (anchor-scruffy-clerk.ngrok-free.dev)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setCustomInput("localhost");
                  handleManualConnect("localhost");
                }}
                className="underline hover:text-cs-primary font-semibold"
              >
                Localhost (127.0.0.1)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Stream Card */}
      <div className="grid grid-cols-1 gap-4">
        <div className="card flex flex-col items-center justify-center rounded-2xl border border-cs-text/10 bg-white/80 p-4 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md overflow-hidden min-h-[300px]">
          {detections.status === "connected" ? (
            <div className="relative w-full">
              <img
                src={liveFrame || resolved.streamUrl}
                alt="Tayangan Kamera Lentera Edge"
                className="w-full h-auto rounded-xl object-contain bg-black max-h-[380px]"
                onError={(e) => {
                  if (!liveFrame) {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/640x480/1e293b/ffffff?text=Video+Stream+Offline";
                  }
                }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
              <span className="text-4xl">📷</span>
              <p className="text-xs font-bold text-slate-600">
                {detections.status === "connecting"
                  ? "Menghubungkan ke Kamera Lentera Edge..."
                  : "Kamera Belum Terhubung"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs text-center leading-relaxed">
                Pastikan Raspberry Pi sudah menyala dan terhubung ke internet untuk memulai sesi.
              </p>
            </div>
          )}

          {/* Circuit Status Narration */}
          {detections.circuit_status && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs font-semibold w-full text-center ${
                detections.circuit_status.status === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {detections.circuit_status.narration}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-cs-text px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(46,42,94,0.35)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
