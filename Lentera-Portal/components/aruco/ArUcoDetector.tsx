"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2, Sparkles, Zap, Lightbulb, ToggleLeft,
  SlidersHorizontal, RefreshCw, Globe, ShieldCheck, ChevronDown, ChevronUp, Camera
} from "lucide-react";
import { normalizeIndonesianPhonetics } from "@/utils/phonetics";

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
export function resolveEndpoints(target: string) {
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

/**
 * Daftar domain tunnel yang gagal terhubung di sesi ini agar otomatis fallback ke localhost
 */
const deadTunnelsInSession = new Set<string>();

export function markTunnelDead(endpoint: string) {
  if (endpoint && endpoint !== "localhost" && endpoint !== "127.0.0.1") {
    deadTunnelsInSession.add(endpoint.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "").replace(/\/$/, ""));
  }
}

export function clearDeadTunnels() {
  deadTunnelsInSession.clear();
}

/**
 * Temukan endpoint aktif secara otomatis:
 * 1. Jika pengguna memilih mode "manual" (misal Localhost atau IP spesifik), hormati pilihan tersebut 100%.
 * 2. Jika mode "auto" (default), cari Cloudflare Quick Tunnel dari ntfy relay, lalu fallback ke localhost.
 */
export async function getActiveLenteraEndpoint(): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("lentera_endpoint_mode");
      const saved = localStorage.getItem("lentera_edge_endpoint") || localStorage.getItem("lentera_endpoint");
      if (mode === "manual" && saved) {
        return saved;
      }
    }
  } catch { }

  // 1. Prioritas Mode Auto: Auto-discovery Cloudflare Quick Tunnel dari ntfy relay
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://ntfy.sh/lentera_malaysia_edge_tunnel/raw?poll=1&_t=${Date.now()}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const raw = await res.text();
      const lines = raw.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const validTunnels = lines.filter(
        (l) => l.includes("trycloudflare.com") && !l.includes("api.trycloudflare.com")
      );
      const latest = validTunnels[validTunnels.length - 1];
      if (latest) {
        const cleanLatest = latest.replace(/^https?:\/\//, "").replace(/\/$/, "");
        if (!deadTunnelsInSession.has(cleanLatest)) {
          return cleanLatest;
        }
      }
    }
  } catch { }

  // 2. Fallback jika offline: Cek penyimpanan lokal (hanya jika valid dan belum ditandai mati)
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lentera_edge_endpoint") || localStorage.getItem("lentera_endpoint");
      if (saved && saved !== "edge.lentera.id" && !saved.includes("ngrok") && !deadTunnelsInSession.has(saved)) {
        return saved;
      }
    }
  } catch { }

  return "localhost";
}

export default function ArUcoDetector() {
  const [detections, setDetections] = useState<DetectionData>({ cells: {}, status: "connecting" });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string>("localhost");
  const [endpointMode, setEndpointMode] = useState<"auto" | "manual">("auto");
  const [showConfig, setShowConfig] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [liveFrame, setLiveFrame] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCountRef = useRef(0);
  const manualDisconnectRef = useRef(false);
  const lastNarrationRef = useRef<string>("");
  const lastNarrationTimeRef = useRef<number>(0);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2800);
  };

  const connectWebSocket = useCallback((targetEndpoint: string) => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = undefined;
    }
    if (wsRef.current) {
      const oldWs = wsRef.current;
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onclose = null;
      oldWs.onerror = null;
      try {
        oldWs.close();
      } catch { }
      wsRef.current = null;
    }

    const { wsUrl, isTunnel } = resolveEndpoints(targetEndpoint);
    setDetections((prev) => ({ ...prev, status: "connecting" }));

    try {
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;
      let opened = false;

      websocket.onopen = () => {
        if (wsRef.current !== websocket) return;
        opened = true;
        setDetections((prev) => ({ ...prev, status: "connected" }));
        manualDisconnectRef.current = false;
        reconnectCountRef.current = 0;
        showToast(isTunnel ? "Terhubung ke LENTERA Edge (Cloud Tunnel)" : "Terhubung ke LENTERA Lokal");
      };

      websocket.onmessage = (event) => {
        if (wsRef.current !== websocket) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === "calibration_result") {
            setIsCalibrating(false);
            showToast(data.message || (data.success ? "Kalibrasi berhasil!" : "Kalibrasi gagal."));
            return;
          }

          if (data.type === "system_event" && data.event === "shutting_down") {
            showToast(data.message || "Alat LENTERA sedang dimatikan secara aman.");
            return;
          }

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

          // Narasi suara dikelola terpusat oleh VoiceGuide untuk mencegah audio bertabrakan & looping
        } catch (parseErr) {
          console.error("Gagal memproses data WS:", parseErr);
        }
      };

      websocket.onclose = () => {
        // Abaikan penutupan socket lama jika sudah diganti koneksi baru (mencegah race condition balik ke Cloudflare)
        if (wsRef.current !== websocket) return;
        setDetections((prev) => ({ ...prev, status: "disconnected" }));
        if (!opened && isTunnel) {
          markTunnelDead(targetEndpoint);
        }
        // Auto-reconnect tanpa batas mati agar siswa tunanetra tidak perlu klik tombol manual saat Raspi baru menyala
        if (!manualDisconnectRef.current) {
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          const delay = Math.min(3000 * Math.pow(1.6, reconnectCountRef.current), 10000);
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(async () => {
            try {
              const freshEndpoint = await getActiveLenteraEndpoint();
              setEndpoint(freshEndpoint);
              setCustomInput(freshEndpoint);
              connectWebSocket(freshEndpoint);
            } catch {
              connectWebSocket(targetEndpoint);
            }
          }, delay);
        }
      };

      websocket.onerror = () => {
        if (wsRef.current !== websocket) return;
        setDetections((prev) => ({ ...prev, status: "disconnected" }));
      };
    } catch (err) {
      console.error("Koneksi WebSocket terblokir:", err);
      setDetections((prev) => ({ ...prev, status: "disconnected" }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    try {
      const savedMode = localStorage.getItem("lentera_endpoint_mode");
      if (savedMode === "manual") setEndpointMode("manual");
    } catch { }

    async function autoDiscoverAndConnect() {
      const targetEndpoint = await getActiveLenteraEndpoint();
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
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connectWebSocket]);

  const handleManualConnect = (newEndpoint: string) => {
    const clean = newEndpoint.trim();
    if (!clean) return;
    manualDisconnectRef.current = false;
    reconnectCountRef.current = 0;
    setLiveFrame(null);
    setEndpoint(clean);
    setCustomInput(clean);
    setEndpointMode("manual");
    try {
      localStorage.setItem("lentera_endpoint_mode", "manual");
      localStorage.setItem("lentera_edge_endpoint", clean);
    } catch { }
    connectWebSocket(clean);
  };

  const handleResetToAuto = async () => {
    manualDisconnectRef.current = false;
    reconnectCountRef.current = 0;
    clearDeadTunnels();
    setLiveFrame(null);
    setEndpointMode("auto");
    try {
      localStorage.setItem("lentera_endpoint_mode", "auto");
      localStorage.removeItem("lentera_edge_endpoint");
      localStorage.removeItem("lentera_endpoint");
    } catch { }
    showToast("Mendeteksi Cloudflare Tunnel otomatis...");
    setDetections((prev) => ({ ...prev, status: "connecting" }));
    const target = await getActiveLenteraEndpoint();
    setEndpoint(target);
    setCustomInput(target);
    connectWebSocket(target);
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



  // Meneruskan trigger buzzer ke Raspberry Pi via WebSocket
  useEffect(() => {
    const handleBuzzerEvent = (e: Event) => {
      const pattern = (e as CustomEvent).detail?.pattern || "step";
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "command", action: "buzzer", pattern }));
        } catch { }
      }
    };
    window.addEventListener("lentera-trigger-buzzer", handleBuzzerEvent);
    return () => window.removeEventListener("lentera-trigger-buzzer", handleBuzzerEvent);
  }, []);

  const resolved = resolveEndpoints(endpoint);

  return (
    <div className="space-y-2.5">
      {/* Status Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-[#735CDD]/15 bg-[#FAF9FF] px-3 py-2 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${detections.status === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : detections.status === "connecting"
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-500"
                }`}
            />
            <div className="min-w-0 truncate">
              <span className="text-[11.5px] font-extrabold text-[#1D1836]">
                {STATUS_LABEL[detections.status]}
              </span>
              <span className="ml-1 text-[10px] text-[#6E659F] font-semibold">
                ({resolved.displayHost})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {detections.status === "connected" ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 rounded-lg border border-[#735CDD]/20 bg-white px-2.5 py-1 text-[10.5px] font-bold text-[#5E548E] hover:bg-[#F3EFFE] hover:text-[#1D1836] transition-colors"
              >
                Putuskan
              </button>
            ) : (
              <button
                onClick={async () => {
                  manualDisconnectRef.current = false;
                  reconnectCountRef.current = 0;
                  try {
                    const freshEndpoint = await getActiveLenteraEndpoint();
                    setEndpoint(freshEndpoint);
                    setCustomInput(freshEndpoint);
                    connectWebSocket(freshEndpoint);
                  } catch {
                    connectWebSocket(endpoint);
                  }
                }}
                className="flex items-center gap-1 rounded-lg bg-[#735CDD] px-2.5 py-1 text-[10.5px] font-extrabold text-white shadow-2xs hover:bg-[#5E47C9] transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Sambungkan
              </button>
            )}

            <button
              onClick={handleCalibrate}
              disabled={isCalibrating || detections.status !== "connected"}
              title={
                detections.status !== "connected"
                  ? "Hubungkan unit Raspberry Pi terlebih dahulu untuk mengaktifkan kalibrasi bidang 5×5"
                  : "Kalibrasi bidang deteksi papan 5×5"
              }
              className="flex items-center gap-1 rounded-lg border border-[#735CDD]/20 bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-[#5840BA] hover:bg-[#F3EFFE] disabled:opacity-40 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-[#735CDD]" />
              {isCalibrating ? "Kalibrasi…" : "Kalibrasi"}
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1 rounded-lg border transition-colors ${showConfig
                  ? "border-[#735CDD]/30 bg-[#F3EFFE] text-[#5840BA]"
                  : "border-transparent text-[#6E659F] hover:text-[#1D1836] hover:bg-white"
                }`}
              title="Pengaturan Sambungan"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Config Panel */}
        {showConfig && (
          <div className="pt-2.5 border-t border-[#735CDD]/15 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#1D1836]">Pengaturan Endpoint Edge:</span>
              <span className="rounded-md bg-[#FFF3D6] px-2 py-0.5 text-[10px] font-extrabold text-[#9A5B00]">
                {endpointMode === "manual" ? `Dikunci Manual (${endpoint})` : "Mode Otomatis"}
              </span>
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
                placeholder="Auto: Cloudflare Tunnel (*.trycloudflare.com)"
                className="flex-1 rounded-xl border border-[#735CDD]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1836] outline-none focus:border-[#735CDD]"
              />
              <button
                type="button"
                onClick={() => handleManualConnect(customInput)}
                className="bg-[#735CDD] text-white px-3.5 py-1.5 rounded-xl font-extrabold hover:bg-[#5E47C9] transition-colors whitespace-nowrap shadow-xs"
              >
                Simpan & Sambungkan
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-[#5E548E]">
              <span>Preset Cepat:</span>
              <button
                type="button"
                onClick={handleResetToAuto}
                className="underline hover:text-[#4527B8] font-extrabold text-[#5840BA]"
                title="Deteksi otomatis Cloudflare Tunnel tanpa perlu ketik IP"
              >
                Cloudflare Tunnel (Otomatis)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setCustomInput("localhost");
                  handleManualConnect("localhost");
                }}
                className="underline hover:text-[#5840BA] font-semibold"
              >
                Localhost (127.0.0.1)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Stream Card */}
      <div className="grid grid-cols-1 gap-2.5">
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#735CDD]/25 bg-[#1E1938] p-2.5 shadow-inner overflow-hidden min-h-[160px]">
          {detections.status === "connected" ? (
            <div className="relative w-full">
              {liveFrame || (!resolved.isTunnel && resolved.streamUrl) ? (
                <>
                  <img
                    src={liveFrame || resolved.streamUrl}
                    alt="Tayangan Kamera Lentera Edge"
                    className="w-full h-auto rounded-lg object-contain bg-[#141029] max-h-[260px]"
                    onError={(e) => {
                      if (!liveFrame) {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/640x480/1e293b/ffffff?text=Video+Stream+Offline";
                      }
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-[#1E1938]/80 px-2.5 py-0.5 text-[9.5px] font-extrabold text-white backdrop-blur-md border border-white/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg bg-[#251E42] text-white min-h-[150px] max-h-[260px] py-4 px-3 text-center">
                  <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                    <span className="absolute h-full w-full animate-ping rounded-xl bg-[#A78BFA]/25" />
                    <Camera className="h-5 w-5 text-[#DDD6FE] animate-pulse stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-extrabold text-white">
                    Menunggu Tayangan Kamera...
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[#C4B5FD]/85 max-w-xs leading-snug">
                    WebSocket terhubung. Pastikan kamera Raspberry Pi aktif untuk menampilkan pemindaian papan.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-white gap-1.5 py-4 px-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#735CDD]/25 border border-[#A78BFA]/30 text-[#EDE9FE] shadow-inner">
                <Camera className="h-5 w-5 stroke-[1.75]" />
              </div>
              <p className="text-xs font-extrabold text-white">
                {detections.status === "connecting"
                  ? "Menghubungkan ke Kamera Lentera Edge..."
                  : "Kamera Belum Terhubung"}
              </p>
              <p className="text-[10.5px] text-[#C4B5FD]/80 max-w-xs leading-snug">
                Pastikan unit Raspberry Pi menyala dan terhubung agar pemindaian balok berjalan otomatis.
              </p>
            </div>
          )}

          {/* Circuit Status Narration */}
          {detections.circuit_status && (
            <div
              className={`mt-3 p-3 rounded-xl border text-xs font-semibold w-full text-center transition-all ${detections.circuit_status.status === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                  : detections.circuit_status.status === "short_circuit"
                    ? "bg-rose-50 border-rose-300 text-rose-800 font-bold animate-pulse shadow-sm"
                    : detections.circuit_status.status === "polarity_reversed"
                      ? "bg-purple-50 border-purple-200 text-purple-800 font-semibold"
                      : "bg-[#FFF3D6] border-[#F5B841]/50 text-[#9A5B00] font-bold"
                }`}
            >
              {(() => {
                const st = detections.circuit_status?.status;
                if (st === "no_battery" || st === "no_lamp") {
                  const COMP_NAMES: Record<string, string> = {
                    battery: "Baterai",
                    lamp: "Lampu",
                    switch: "Saklar",
                    straight_cable: "Kabel Lurus",
                    l_cable: "Kabel Belok (L)",
                    t_cable: "Kabel Simpang (T)",
                    resistor: "Resistor",
                    student_via: "Kartu Via",
                    student_amira: "Kartu Amira",
                    student_luthfi: "Kartu Luthfi",
                    student_ajib: "Kartu Luthfi",
                  };
                  const activeEntries = Object.entries(detections.cells || {}).filter(([, v]) => Boolean(v));
                  if (activeEntries.length === 0) {
                    return "Papan siap — belum ada balok di atas papan.";
                  }
                  const listStr = activeEntries
                    .map(([cell, v]) => `${COMP_NAMES[v.component] || v.component} (${cell})`)
                    .join(", ");
                  return `Terdeteksi di papan: ${listStr}`;
                }
                return detections.circuit_status?.narration;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-[#1D1836] px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(46,42,94,0.35)] border border-[#735CDD]/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
