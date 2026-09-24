"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Wifi, WifiOff, RotateCcw, Maximize2, Minimize2 } from "lucide-react";

// Use local relay server (Python ws_server.py serves MJPEG on port 8081)
// Requires PC to be on same network as ESP32 (hotspot "Lev")
const RELAY_STREAM_URL = "http://localhost:8081/stream";

export default function CameraStream() {
  const [streamUrl] = useState(RELAY_STREAM_URL);
  const [connected, setConnected] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheBuster, setCacheBuster] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const refreshStream = () => {
    setCacheBuster(Date.now());
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setConnected(true);
      setError(null);
    };

    const handleError = () => {
      setConnected(false);
      setError("Failed to load stream. Make sure the ESP32-CAM is online.");
      retryTimeoutRef.current = setTimeout(() => {
        refreshStream();
      }, 3000);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [cacheBuster]);

  const handleRetry = () => {
    setError(null);
    refreshStream();
  };

  const fullUrl = streamUrl + "?t=" + cacheBuster;

  return (
    <div
      className={`card overflow-hidden rounded-2xl border border-cs-text/10 bg-white/80 shadow-[0_8px_24px_rgba(46,42,94,0.06)] backdrop-blur-md transition-all ${
        fullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-cs-text/10 bg-cs-primary/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cs-blue/10 text-sky-600">
            <Video className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-heading text-sm font-bold text-cs-text">ESP32-CAM Stream</p>
            <p className="text-xs text-cs-text/50">1280×720 · MJPEG</p>
          </div>
          <span
            className={`flex h-2 w-2 rounded-full ${connected ? "bg-cs-green" : "bg-cs-yellow"}`}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={handleRetry}
              className="navitem flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </button>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="navitem rounded-lg p-2 text-cs-text/50 hover:bg-cs-text/5 hover:text-cs-text"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="relative aspect-video min-h-[260px] bg-[#0b1220]">
        <img
          ref={imgRef}
          src={fullUrl}
          alt="ESP32-CAM Live Stream"
          className="h-full w-full object-cover"
          style={{ imageRendering: "crisp-edges" }}
        />

        {!connected && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b1220]/85">
            <div className="p-6 text-center">
              <Wifi className="mx-auto mb-3 h-10 w-10 animate-pulse text-cs-blue" />
              <p className="text-slate-200">Connecting to ESP32-CAM…</p>
              <p className="mt-1 text-xs text-slate-400">{streamUrl}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b1220]/90">
            <div className="p-6 text-center">
              <WifiOff className="mx-auto mb-3 h-10 w-10 text-rose-400" />
              <p className="text-rose-300">{error}</p>
              <p className="mt-1 text-xs text-slate-400">{streamUrl}</p>
              <button
                onClick={handleRetry}
                className="navitem mt-4 rounded-lg bg-cs-blue/20 px-4 py-2 text-sm font-bold text-sky-200 hover:bg-cs-blue/30"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {fullscreen && (
          <div className="absolute bottom-4 right-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
            Press the fullscreen button to exit
          </div>
        )}
      </div>
    </div>
  );
}
