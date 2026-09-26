"use client";

import { useEffect, useState } from "react";

export default function CircuitDiagram({ variant }: { variant?: string }) {
  const [state, setState] = useState<any>({ cells: {}, isComplete: false });

  useEffect(() => {
    const handleUpdate = (e: Event) => setState((e as CustomEvent).detail);
    window.addEventListener("circuit-update", handleUpdate);
    return () => window.removeEventListener("circuit-update", handleUpdate);
  }, []);

  let cells = state.cells || {};
  let isComplete = state.isComplete;
  
  if (variant && variant !== "live") {
    isComplete = true; // Preset referensi selalu menyala
    if (variant === "series") {
      cells = {
        "C5": { component: "battery", rotation: 0 },
        "B5": { component: "straight_cable", rotation: 0 },
        "D5": { component: "straight_cable", rotation: 0 },
        "A5": { component: "l_cable", rotation: 90 },
        "E5": { component: "l_cable", rotation: 180 },
        "A1": { component: "l_cable", rotation: 0 },
        "E1": { component: "l_cable", rotation: 270 },
        "A2": { component: "straight_cable", rotation: 90 },
        "A3": { component: "straight_cable", rotation: 90 },
        "A4": { component: "straight_cable", rotation: 90 },
        "E2": { component: "straight_cable", rotation: 90 },
        "E3": { component: "switch", rotation: 90 },
        "E4": { component: "straight_cable", rotation: 90 },
        "B1": { component: "lamp", rotation: 0 },
        "C1": { component: "switch", rotation: 0 },
        "D1": { component: "lamp", rotation: 0 },
      };
    } else if (variant === "parallel") {
      cells = {
        "C5": { component: "battery", rotation: 0 },
        "B5": { component: "straight_cable", rotation: 0 },
        "D5": { component: "straight_cable", rotation: 0 },
        "A5": { component: "l_cable", rotation: 90 },
        "E5": { component: "l_cable", rotation: 180 },
        
        "A4": { component: "straight_cable", rotation: 90 },
        "E4": { component: "straight_cable", rotation: 90 },
        
        "A3": { component: "t_cable", rotation: 90 },
        "B3": { component: "switch", rotation: 0 },
        "C3": { component: "lamp", rotation: 0 },
        "D3": { component: "straight_cable", rotation: 0 },
        "E3": { component: "t_cable", rotation: 270 },
        
        "A2": { component: "straight_cable", rotation: 90 },
        "E2": { component: "straight_cable", rotation: 90 },
        
        "A1": { component: "l_cable", rotation: 0 },
        "B1": { component: "switch", rotation: 0 },
        "C1": { component: "lamp", rotation: 0 },
        "D1": { component: "straight_cable", rotation: 0 },
        "E1": { component: "l_cable", rotation: 270 },
      };
    } else if (variant === "closed") {
      cells = {
        "C4": { component: "battery", rotation: 0 },
        "B4": { component: "l_cable", rotation: 90 },
        "D4": { component: "l_cable", rotation: 180 },
        "B2": { component: "l_cable", rotation: 0 },
        "D2": { component: "l_cable", rotation: 270 },
        "B3": { component: "straight_cable", rotation: 90 },
        "D3": { component: "switch", rotation: 90 },
        "C2": { component: "lamp", rotation: 0 },
      };
    } else if (variant === "open") {
      cells = {
        "C4": { component: "battery", rotation: 0 },
        "B4": { component: "l_cable", rotation: 90 },
        "D4": { component: "l_cable", rotation: 180 },
        "B2": { component: "l_cable", rotation: 0 },
        "D2": { component: "l_cable", rotation: 270 },
        "B3": { component: "straight_cable", rotation: 90 },
        "D3": { component: "switch", rotation: 0 },
        "C2": { component: "lamp", rotation: 0 },
      };
      isComplete = false;
    }
  }

  const cols = ["A", "B", "C", "D", "E"];
  const getXY = (cell: string) => {
    const colIdx = cols.indexOf(cell[0]);
    const rowIdx = parseInt(cell[1]) - 1;
    // Jarak antar sel = 80, padding = 50
    // Balik Y-axis (4 - rowIdx) agar baris 1 berada di bawah (dekat siswa) dan baris 5 di atas
    return { x: 50 + colIdx * 80, y: 50 + (4 - rowIdx) * 80 };
  };

  return (
    <svg viewBox="0 0 420 420" className="h-auto w-full overflow-visible" role="img">
      <defs>
        <filter id="bulbGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="wireGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
      {/* Background grid points */}
      {cols.map(c => [1,2,3,4,5].map(r => {
         const {x, y} = getXY(`${c}${r}`);
         return <circle key={`${c}${r}`} cx={x} cy={y} r="3" fill="#1e293b" />
      }))}

      {/* Render Components dynamically */}
      {Object.entries(cells).map(([cell, compData]: [string, any]) => {
         if (!compData) return null;
         
         const {x, y} = getXY(cell);
         const { component, rotation } = compData;
         
         return (
           <g key={cell} transform={`translate(${x}, ${y}) rotate(${rotation})`} className="transition-all duration-500">
              {renderComponent(component, state.isComplete)}
           </g>
         );
      })}
    </svg>
  )
}

function renderComponent(type: string, isComplete: boolean) {
  const stroke = isComplete ? "#8b5cf6" : "#475569";
  const dim = "#475569";
  
  switch(type) {
    case "straight_cable":
      return <line x1="-40" y1="0" x2="40" y2="0" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />;
    case "l_cable":
      // Buka Kanan dan Bawah (ArUco 0 deg)
      return <path d="M 0 40 L 0 0 L 40 0" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />;
    case "t_cable":
      // Buka Atas, Bawah, Kanan (Bentuk |- pada ArUco 0 deg)
      return <path d="M 0 -40 L 0 0 M 0 40 L 0 0 M 40 0 L 0 0" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />;
    case "battery":
      return (
        <g>
          {/* Digambar Horizontal (ArUco 0 deg). + di Kanan */}
          <rect x="-25" y="-15" width="50" height="30" rx="4" fill="#0b1220" stroke={isComplete ? "#c084fc" : dim} strokeWidth="4" />
          <line x1="10" y1="-8" x2="10" y2="8" stroke={isComplete ? "#c084fc" : dim} strokeWidth="3" />
          <line x1="-10" y1="-4" x2="-10" y2="4" stroke={isComplete ? "#c084fc" : dim} strokeWidth="3" />
          <text x="35" y="5" fill={isComplete ? "#c084fc" : dim} fontSize="16" fontWeight="bold">+</text>
          <text x="-35" y="5" fill={isComplete ? "#c084fc" : dim} fontSize="18" fontWeight="bold">-</text>
        </g>
      );
    case "lamp":
      return (
        <g>
          <circle cx="0" cy="0" r="18" fill="#0b1220" stroke={isComplete ? "#fef08a" : dim} strokeWidth="4" filter={isComplete ? "url(#bulbGlow)" : ""} />
          <path d="M -10 -10 L 10 10 M -10 10 L 10 -10" stroke={isComplete ? "#fef08a" : dim} strokeWidth="3" strokeLinecap="round" />
          {/* Label + di Atas, - di Bawah (pada ArUco 0 deg) */}
          <text x="-5" y="-28" fill={dim} fontSize="16" fontWeight="bold">+</text>
          <text x="-5" y="38" fill={dim} fontSize="18" fontWeight="bold">-</text>
        </g>
      );
    case "switch":
      return (
        <g>
          <circle cx="-20" cy="0" r="4" fill={isComplete ? "#ec4899" : dim} />
          <circle cx="20" cy="0" r="4" fill={isComplete ? "#ec4899" : dim} />
          {/* Garis saklar yang menutup jika komplit, atau terbuka 30 derajat jika belum */}
          <line x1="-20" y1="0" x2="16" y2={isComplete ? "0" : "-15"} stroke={isComplete ? "#ec4899" : dim} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "resistor":
      return (
        <g>
          <path d="M -40 0 L -20 0 L -15 -10 L -5 10 L 5 -10 L 15 10 L 20 0 L 40 0" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}