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
    // Jarak antar sel = 80, padding = 74 agar komponen di sel tepi (radius 40px) tidak menabrak bingkai/label
    // Balik Y-axis (4 - rowIdx) agar baris 1 berada di bawah (dekat siswa) dan baris 5 di atas
    return { x: 74 + colIdx * 80, y: 74 + (4 - rowIdx) * 80 };
  };

  return (
    <svg viewBox="0 0 468 468" className="h-auto w-full overflow-visible" role="img">
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
      
      {/* Subtle Board Grid Frame (radius 48px dari titik pusat sel terluar) */}
      <rect x="26" y="26" width="416" height="416" rx="18" fill="rgba(30, 27, 75, 0.55)" stroke="rgba(167, 139, 250, 0.32)" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Axis Labels: Columns A-E (Top & Bottom) */}
      {cols.map((col, idx) => {
        const x = 74 + idx * 80;
        return (
          <g key={`col-label-${col}`}>
            <text x={x} y="13" textAnchor="middle" dominantBaseline="central" fill="#cbd5e1" fontSize="11" fontWeight="800" fontFamily="monospace">{col}</text>
            <text x={x} y="455" textAnchor="middle" dominantBaseline="central" fill="#cbd5e1" fontSize="11" fontWeight="800" fontFamily="monospace">{col}</text>
          </g>
        );
      })}

      {/* Axis Labels: Rows 5-1 (Left & Right) */}
      {[5, 4, 3, 2, 1].map((row, idx) => {
        const y = 74 + idx * 80;
        return (
          <g key={`row-label-${row}`}>
            <text x="12" y={y} textAnchor="middle" dominantBaseline="central" fill="#cbd5e1" fontSize="11" fontWeight="800" fontFamily="monospace">{row}</text>
            <text x="456" y={y} textAnchor="middle" dominantBaseline="central" fill="#cbd5e1" fontSize="11" fontWeight="800" fontFamily="monospace">{row}</text>
          </g>
        );
      })}

      {/* Background grid points */}
      {cols.map(c => [1,2,3,4,5].map(r => {
         const {x, y} = getXY(`${c}${r}`);
         return (
           <g key={`${c}${r}`}>
             <circle cx={x} cy={y} r="5" fill="rgba(148, 163, 184, 0.25)" />
             <circle cx={x} cy={y} r="2" fill="#94a3b8" />
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
          
          <g transform={`translate(0, -34) rotate(${-rotation})`}>
            <text x="0" y="0" fill={isComplete ? "#c084fc" : dim} fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="central">+</text>
          </g>
          <g transform={`translate(0, 34) rotate(${-rotation})`}>
            <text x="0" y="0" fill={isComplete ? "#c084fc" : dim} fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="central">-</text>
          </g>
        </g>
      );
      break;
    case "lamp":
      content = (
        <g>
          <circle cx="0" cy="0" r="18" fill="#0b1220" stroke={isComplete ? "#fef08a" : dim} strokeWidth="4" filter={isComplete ? "url(#bulbGlow)" : ""} />
          <path d="M -10 -10 L 10 10 M -10 10 L 10 -10" stroke={isComplete ? "#fef08a" : dim} strokeWidth="3" strokeLinecap="round" />
          
          {/* Default fisik: + di Kiri, - di Kanan */}
          <g transform={`translate(-30, 0) rotate(${-rotation})`}>
            <text x="0" y="0" fill={dim} fontSize="13" fontWeight="bold" textAnchor="middle" dominantBaseline="central">+</text>
          </g>
          <g transform={`translate(30, 0) rotate(${-rotation})`}>
            <text x="0" y="0" fill={dim} fontSize="15" fontWeight="bold" textAnchor="middle" dominantBaseline="central">-</text>
          </g>
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