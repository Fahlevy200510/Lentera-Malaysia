"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ScanEye, MonitorSmartphone, Cpu, Wifi } from "lucide-react";
import CircuitDiagram from "@/components/aruco/CircuitDiagram";
import ArUcoDetector from "@/components/aruco/ArUcoDetector";

const wiringPoints = [
  {
    icon: <Cpu className="h-5 w-5 text-cs-primary" />,
    title: "Lentera Edge (Raspberry Pi)",
    text: "The local processing hub. It uses Computer Vision to track circuit components without needing the internet.",
  },
  {
    icon: <MonitorSmartphone className="h-5 w-5 text-cs-blue" />,
    title: "CSI Camera Module",
    text: "The eye of the system. It watches the board and scans the special markers on each piece in real-time.",
  },
  {
    icon: <Wifi className="h-5 w-5 text-cs-green" />,
    title: "Live Data Relay",
    text: "Sends the live circuit layout directly to this dashboard so the AI Tutor can help students learn.",
  },
];

export default function ArucoPage() {
  const [diagramMode, setDiagramMode] = useState("live");
  return (
    <main className="relative min-h-screen overflow-hidden bg-cs-bg font-body text-cs-text">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="blob1 absolute -left-32 top-[-3rem] h-72 w-72 rounded-full blur-3xl md:h-96 md:w-96"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.16), transparent 70%)" }}
        />
        <div
          className="blob2 absolute -right-32 bottom-[-4rem] h-72 w-72 rounded-full blur-3xl md:h-96 md:w-96"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)" }}
        />
      </div>

      <section className="mx-auto flex min-h-screen max-w-screen-2xl flex-col md:flex-row gap-8 px-5 py-8 lg:px-10 lg:py-10">
        <div className="rise flex flex-col justify-between gap-8 rounded-[2rem] border border-cs-text/10 bg-white/80 p-6 shadow-[0_18px_50px_-20px_rgba(124,58,237,0.25)] backdrop-blur-xl md:w-64 md:flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 font-heading text-xl font-extrabold tracking-tight text-cs-text">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cs-primary text-white shadow-lg shadow-cs-primary/30">
                <ScanEye className="h-5 w-5" />
              </div>
              Edge Lab
            </div>
            
            <div className="mt-8 space-y-2">
              <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-cs-text/60 transition-colors hover:bg-cs-text/5 hover:text-cs-text">
                <ArrowLeft className="h-4 w-4" />
                Back to Portal
              </Link>
              <div className="flex items-center gap-3 rounded-xl bg-cs-primary/10 px-4 py-3 text-sm font-bold text-cs-primaryDeep shadow-sm">
                <ScanEye className="h-4 w-4" />
                Live Camera
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-cs-text/50">Connection</p>
            <div className="mt-2 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-cs-green" />
              <span className="text-sm font-bold text-cs-text">Local Network</span>
            </div>
          </div>
        </div>

        <div className="flex-1 grid gap-8 lg:grid-cols-2">
          {/* Left: Edge Info + Detector */}
          <div className="space-y-6">
            <div className="rise space-y-4" style={{ animationDelay: ".05s" }}>
              <p className="inline-flex rounded-full border border-cs-blue/30 bg-cs-blue/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-sky-600">
                Live Edge Synchronization
              </p>
              <h1 className="font-heading text-3xl font-extrabold leading-tight text-cs-text md:text-4xl">
                Real-time Hardware Status
              </h1>
              <p className="max-w-xl text-base leading-7 text-cs-text/65">
                This dashboard receives live tracking data and video directly from your Lentera Edge unit over your local network.
              </p>
            </div>

            {/* ArUcoDetector (yang sudah support Grid 5x5 + Input IP) */}
            <ArUcoDetector />
            
            <div className="hidden"></div>
          </div>

          {/* Right: Circuit Diagram & Tech Stack */}
          <div className="rise" style={{ animationDelay: ".1s" }}>
            <div className="card rounded-[2rem] border border-cs-text/10 bg-white/80 p-5 shadow-[0_18px_50px_-20px_rgba(124,58,237,0.25)] backdrop-blur-xl md:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-cs-primaryDeep/70">
                    Live Diagram
                  </p>
                  <h2 className="font-heading text-xl font-extrabold text-cs-text">
                    Circuit Schematic
                  </h2>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border">
                  <button 
                    onClick={() => setDiagramMode("live")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${diagramMode === 'live' ? 'bg-white shadow text-cs-primaryDeep' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    LIVE
                  </button>
                  <button 
                    onClick={() => setDiagramMode("series")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${diagramMode === 'series' ? 'bg-white shadow text-cs-primaryDeep' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    SERIES
                  </button>
                  <button 
                    onClick={() => setDiagramMode("parallel")}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${diagramMode === 'parallel' ? 'bg-white shadow text-cs-primaryDeep' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    PARALLEL
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0b1220] p-4 flex items-center justify-center min-h-[200px]">
                <CircuitDiagram variant={diagramMode} />
              </div>

              <div className="mt-6 space-y-3">
                {wiringPoints.map((item) => (
                  <article
                    key={item.title}
                    className="flex gap-4 card rounded-2xl border border-cs-text/10 bg-white p-4 shadow-[0_8px_24px_rgba(46,42,94,0.06)]"
                  >
                    <div className="mt-1 flex-shrink-0 bg-slate-50 p-2 rounded-lg border">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-extrabold text-cs-text">{item.title}</h3>
                      <p className="mt-1 text-[13px] leading-6 text-cs-text/65">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
