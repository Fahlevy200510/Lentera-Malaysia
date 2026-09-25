"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Sparkles, Zap, Lightbulb, ToggleLeft } from "lucide-react";

type ComponentData = { component: string; rotation: number; id: number };
type DetectionData = {
  status: "connecting" | "connected" | "disconnected";
  cells: Record<string, ComponentData>;
  circuit_status?: { status: string; cells: string[]; narration: string };
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

// SUSUNAN GRID 5x5
const GRID_CELLS = [
  "A1", "B1", "C1", "D1", "E1",
  "A2", "B2", "C2", "D2", "E2",
  "A3", "B3", "C3", "D3", "E3",
  "A4", "B4", "C4", "D4", "E4",
  "A5", "B5", "C5", "D5", "E5",
];

const STATUS_LABEL: Record<DetectionData["status"], string> = {
  connecting: "Connecting…",
  connected: "Connected",
  disconnected: "Disconnected",
};

export default function ArUcoDetector() {
  const [detections, setDetections] = useState<DetectionData>({ cells: {}, status: "connecting" });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string>("localhost");
  const wsRef = useRef<WebSocket | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2800);
  };

  const connectWebSocket = (ip: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setDetections((prev) => ({ ...prev, status: "connecting" }));
    
    try {
      // Jika pengguna memasukkan URL lengkap (misal dari Ngrok/Pinggy)
      const wsUrl = ip.startsWith("ws://") || ip.startsWith("wss://") ? ip : `ws://${ip}:8765`;
      
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;


    websocket.onopen = () => setDetections((prev) => ({ ...prev, status: "connected" }));
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
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
              graph_type: data.circuit_status?.graph_type || "unknown"
            },
          })
        );
      }
      
      if (data.narration && typeof window !== "undefined") {
        const utterance = new SpeechSynthesisUtterance(data.narration);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    websocket.onclose = () => {
        setDetections((prev) => ({ ...prev, status: "disconnected" }));
      };
    } catch (err) {
      console.error("WebSocket connection blocked:", err);
      setDetections((prev) => ({ ...prev, status: "disconnected" }));
      showToast("Koneksi ditolak oleh browser. Gunakan localhost.");
    }
  };

  useEffect(() => {
    const defaultIp = window.location.hostname;
    setIpAddress(defaultIp);
    
    // Jangan auto-connect jika di-hosting di public domain (seperti netlify)
    // Auto-connect hanya jika berjalan di localhost atau IP lokal.
    if (defaultIp === "localhost" || defaultIp === "127.0.0.1" || defaultIp.startsWith("192.168.")) {
      connectWebSocket(defaultIp);
    } else {
      setDetections((prev) => ({ ...prev, status: "disconnected" }));
    }
    
    return () => {
      wsRef.current?.close();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setDetections((prev) => ({ ...prev, status: "disconnected" }));
    showToast("Kamera diputuskan.");
  };

  const handleCalibrate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "command", action: "calibrate" }));
      showToast("Mempersiapkan Kalibrasi... Pastikan 4 komponen berada di 4 sudut terluar papan.");
    } else {
      showToast("Gagal: Raspberry Pi belum terhubung.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 rounded-2xl border border-cs-text/10 bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-cs-text">
            <span
              className={`h-2 w-2 rounded-full ${
                detections.status === "connected" ? "bg-cs-green" : detections.status === "connecting" ? "bg-cs-yellow" : "bg-rose-400"
              }`}
            />
            Status: {STATUS_LABEL[detections.status]}
          </span>
          <div className="flex gap-2">
            {detections.status === "connected" && (
              <button
                onClick={handleDisconnect}
                className="navitem flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20"
              >
                Disconnect
              </button>
            )}
            <button
              onClick={handleCalibrate}
              disabled={isCalibrating || detections.status !== "connected"}
              className="navitem flex items-center gap-1.5 rounded-lg bg-cs-primary/10 px-3 py-1.5 text-xs font-bold text-cs-primaryDeep hover:bg-cs-primary/20 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isCalibrating ? "Calibrating…" : "Calibrate"}
            </button>
          </div>
        </div>
        
        {/* Input IP if accessed from another device on the network */}
        {detections.status === "disconnected" && (
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text" 
              value={ipAddress} 
              onChange={(e) => setIpAddress(e.target.value)} 
              placeholder="IP Raspberry Pi (ex: 192.168.1.5)"
              className="text-xs border border-slate-300 px-2 py-1.5 rounded w-full bg-white text-slate-800 focus:outline-none focus:border-cs-primary"
            />
            <button 
              onClick={() => connectWebSocket(ipAddress)}
              className="bg-cs-primary text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-cs-primaryDeep transition-colors whitespace-nowrap"
            >
              Connect
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Video Stream dari Raspi */}
        <div className="card flex flex-col items-center justify-center rounded-2xl border border-cs-text/10 bg-white/80 p-4 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md overflow-hidden min-h-[300px]">
          {detections.status === "connected" ? (
            <img 
              src={`http://${ipAddress}:8766/stream`} 
              alt="Lentera Edge Camera Feed" 
              className="w-full h-auto rounded-xl object-contain bg-black"
              onError={(e) => {
                // Jika stream gagal dimuat, ganti dengan placeholder
                (e.target as HTMLImageElement).src = "https://placehold.co/640x480/1e293b/ffffff?text=Video+Stream+Offline";
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-4xl">📷</span>
              <p className="text-sm font-semibold">Waiting for Camera Feed...</p>
            </div>
          )}
        </div>

        {/* Grid 5x5 */}
        <div className="card rounded-2xl border border-cs-text/10 bg-white/80 p-5 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md flex flex-col justify-center">
          <div className="grid grid-cols-5 gap-2">
            {GRID_CELLS.map((cell) => {
              const detectedComp = detections.cells[cell];
              const isHighlight = detections.circuit_status?.cells?.includes(cell);
              return (
                <div
                  key={cell}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border ${
                    isHighlight ? "border-cs-green bg-cs-green/10" : "border-cs-text/10 bg-cs-bg"
                  }`}
                >
                  <span className="absolute left-1.5 top-1.5 text-[9px] font-semibold text-cs-text/35">{cell}</span>
                  {detectedComp && (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className={KOMPONEN_INFO[detectedComp.component]?.color ?? "text-cs-primary"}>
                        {KOMPONEN_INFO[detectedComp.component]?.icon}
                      </span>
                      <span className="text-[9px] font-bold text-cs-text truncate px-1 max-w-full">
                        {detectedComp.component.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Circuit Status Narration */}
          {detections.circuit_status && (
            <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold ${
              detections.circuit_status.status === "success" 
                ? "bg-cs-green/10 border-cs-green/20 text-cs-green"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
              {detections.circuit_status.narration}
            </div>
          )}
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-cs-text px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(46,42,94,0.35)]">
            <CheckCircle2 className="h-4 w-4 text-cs-green" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
