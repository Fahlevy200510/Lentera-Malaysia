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
        "B4": { component: "battery", rotation: 0 },
        "B5": { component: "l_cable", rotation: 90 },
        "C5": { component: "switch", rotation: 0 },
        "D5": { component: "lamp", rotation: 0 },
        "E5": { component: "l_cable", rotation: 180 },
        
        "E4": { component: "switch", rotation: 90 },
        "E3": { component: "lamp", rotation: 90 },
        "E2": { component: "l_cable", rotation: 270 },
        
        "D2": { component: "straight_cable", rotation: 0 },
        "C2": { component: "straight_cable", rotation: 0 },
        "B2": { component: "l_cable", rotation: 0 },
        "B3": { component: "straight_cable", rotation: 90 },
      };
    } else if (variant === "parallel") {
      cells = {
        "B5": { component: "l_cable", rotation: 90 },
        "C5": { component: "battery", rotation: 270 },
        "D5": { component: "straight_cable", rotation: 0 },
        "E5": { component: "l_cable", rotation: 180 },

        "B4": { component: "t_cable", rotation: 270 },
        "C4": { component: "switch", rotation: 0 },
        "D4": { component: "lamp", rotation: 0 },
        "E4": { component: "t_cable", rotation: 90 },

        "B3": { component: "l_cable", rotation: 0 },
        "C3": { component: "switch", rotation: 0 },
        "D3": { component: "lamp", rotation: 0 },
        "E3": { component: "l_cable", rotation: 270 },
      };
    } else if (variant === "closed") {
      cells = {
        "C4": { component: "battery", rotation: 270 },
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
        "C4": { component: "battery", rotation: 270 },
        "B4": { component: "l_cable", rotation: 90 },
        "D4": { component: "l_cable", rotation: 180 },
        "B2": { component: "l_cable", rotation: 0 },
        "D2": { component: "l_cable", rotation: 270 },
        "B3": { component: "straight_cable", rotation: 90 },
        "D3": { component: "switch", rotation: 90 },
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
        <filter id="wireGlow" filterUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
      {/* Subtle Board Grid Frame */}
      <rect x="25" y="25" width="370" height="370" rx="16" fill="rgba(241, 245, 249, 0.45)" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Axis Labels: Columns A-E (Top & Bottom) */}
      {cols.map((col, idx) => {
        const x = 50 + idx * 80;
        return (
          <g key={`col-label-${col}`}>
            <text x={x} y="18" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="800" fontFamily="monospace">{col}</text>
            <text x={x} y="412" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="800" fontFamily="monospace">{col}</text>
          </g>
        );
      })}

      {/* Axis Labels: Rows 5-1 (Left & Right) */}
      {[5, 4, 3, 2, 1].map((row, idx) => {
        const y = 50 + idx * 80 + 4;
        return (
          <g key={`row-label-${row}`}>
            <text x="14" y={y} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="800" fontFamily="monospace">{row}</text>
            <text x="406" y={y} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="800" fontFamily="monospace">{row}</text>
          </g>
        );
      })}

      {/* Background grid points */}
      {cols.map(c => [1,2,3,4,5].map(r => {
         const {x, y} = getXY(`${c}${r}`);
         return (
           <g key={`${c}${r}`}>
             <circle cx={x} cy={y} r="5" fill="#e2e8f0" />
             <circle cx={x} cy={y} r="2" fill="#64748b" />
           </g>
         );
      }))}

      {/* Render Components dynamically */}
      {Object.entries(cells).map(([cell, compData]: [string, any]) => {
         if (!compData) return null;
         
         const {x, y} = getXY(cell);
         const { component, rotation } = compData;
         
         let effectiveRotation = rotation;
         if (component === "switch" && compData.wire_orientation) {
           effectiveRotation = compData.wire_orientation === "vertical" ? 90 : 0;
         }
         
         return (
           <g key={cell} transform={`translate(${x}, ${y}) rotate(${effectiveRotation})`} className="transition-all duration-500">
              {renderComponent(component, isComplete, rotation, variant, compData)}
           </g>
         );
      })}
    </svg>
  )
}

function renderComponent(type: string, isComplete: boolean, rotation: number = 0, variant: string = "live", compData?: any) {
  const stroke = isComplete ? "#8b5cf6" : "#475569";
  const dim = "#475569";
  
  const offset = 0; // Rotasi sekarang ditangani langsung di backend agar Graph Evaluator akurat


  let content = null;
  switch(type) {
    case "straight_cable":
      content = <line x1="-40" y1="0" x2="40" y2="0" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />;
      break;
    case "l_cable":
      // Default fisik: └ (buka Atas & Kanan)
      content = <path d="M 0 -40 L 0 0 L 40 0" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />;
      break;
    case "t_cable":
      // Default fisik: ┬ (buka Kiri, Kanan, Bawah)
      content = <path d="M -40 0 L 40 0 M 0 40 L 0 0" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />;
      break;
    case "battery":
      content = (
        <g>
          <rect x="-15" y="-25" width="30" height="50" rx="4" fill="#0b1220" stroke={isComplete ? "#c084fc" : dim} strokeWidth="4" />
          {/* Default fisik: vertikal, Positive (Long) di Atas */}
          <line x1="-8" y1="-10" x2="8" y2="-10" stroke={isComplete ? "#c084fc" : dim} strokeWidth="3" />
          {/* Negative (Short) di Bawah */}
          <line x1="-4" y1="10" x2="4" y2="10" stroke={isComplete ? "#c084fc" : dim} strokeWidth="3" />
          
          <text x="0" y="-31" fill={isComplete ? "#c084fc" : dim} fontSize="16" fontWeight="bold" textAnchor="middle" transform={`rotate(${-rotation}, 0, -36)`}>+</text>
          <text x="0" y="43" fill={isComplete ? "#c084fc" : dim} fontSize="18" fontWeight="bold" textAnchor="middle" transform={`rotate(${-rotation}, 0, 38)`}>-</text>
        </g>
      );
      break;
    case "lamp":
      content = (
        <g>
          <circle cx="0" cy="0" r="18" fill="#0b1220" stroke={isComplete ? "#fef08a" : dim} strokeWidth="4" filter={isComplete ? "url(#bulbGlow)" : ""} />
          <path d="M -10 -10 L 10 10 M -10 10 L 10 -10" stroke={isComplete ? "#fef08a" : dim} strokeWidth="3" strokeLinecap="round" />
          
          {/* Default fisik: + di Kiri, - di Kanan */}
          <text x="-28" y="5" fill={dim} fontSize="14" fontWeight="bold" textAnchor="middle" transform={`rotate(${-rotation}, -28, 0)`}>+</text>
          <text x="28" y="5" fill={dim} fontSize="16" fontWeight="bold" textAnchor="middle" transform={`rotate(${-rotation}, 28, 0)`}>-</text>
        </g>
      );
      break;
    case "switch":
      let isSwitchOn = false;
      if (variant === "live") {
        isSwitchOn = compData?.is_on !== undefined
          ? compData.is_on
          : (rotation === 90 || rotation === 270);
      } else if (variant === "closed") {
        isSwitchOn = true;
      } else {
        isSwitchOn = false; // "series", "parallel", "open" templates force NO (Open) visual
      }
      content = (
        <g>
          <line x1="-40" y1="0" x2="-20" y2="0" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />
          <line x1="20" y1="0" x2="40" y2="0" stroke={stroke} strokeWidth="6" strokeLinecap="round" filter={isComplete ? "url(#wireGlow)" : ""} />
          <circle cx="-20" cy="0" r="4" fill={isComplete ? "#ec4899" : dim} />
          <circle cx="20" cy="0" r="4" fill={isComplete ? "#ec4899" : dim} />
          <line x1="-20" y1="0" x2="16" y2={isSwitchOn ? "0" : "-15"} stroke={isComplete ? "#ec4899" : dim} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
      break;
    case "resistor":
      content = (
        <g>
          <path d="M -40 0 L -20 0 L -15 -10 L -5 10 L 5 -10 L 15 10 L 20 0 L 40 0" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
      break;
    default:
      content = null;
  }

  return (
    <g transform={`rotate(${offset})`}>
      {content}
    </g>
  );
}