"use client";

import { useEffect, useRef, useCallback } from "react";

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const FOV = 3.8;
const SPEED_MULTIPLIER = 1.0;

interface OrbitDef {
  id: string;
  radius: number;
  hasTwinBand: boolean;
  lineWidth: number;
  alpha: number;
  orbiter: {
    angle: number;
    speed: number;
    coreColor: string;
    midColor: string;
    glowColor: string;
    outerGlow: string;
    size: number;
  };
}

interface StarParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  phase: number;
}

interface Primitive {
  z: number;
  draw: () => void;
}

export default function InteractiveOrbit3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseTriggerRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let baseScale = 180;

    // Interaksi Drag / Sentuh 3D dengan Inersia Halus
    let isDragging = false;
    let dragMoved = false;
    const lastPointer = { x: 0, y: 0 };
    const pointerVelocity = { x: 0, y: 0 };
    const targetUserRot = { x: 0, y: 0 };
    const currentUserRot = { x: 0, y: 0 };

    // Gelombang kejut interaktif saat inti / badge diklik
    const interactivePulses: { progress: number }[] = [];

    const triggerCorePulse = () => {
      interactivePulses.push({ progress: 0 });
    };
    pulseTriggerRef.current = triggerCorePulse;

    // 3 Lintasan Giroskop 360°
    const mainOrbits: OrbitDef[] = [
      {
        id: "cyan-orbit",
        radius: 1.02,
        hasTwinBand: true,
        lineWidth: 1.75,
        alpha: 0.94,
        orbiter: {
          angle: degToRad(45),
          speed: -0.58,
          coreColor: "#ffffff",
          midColor: "#2dd4bf",
          glowColor: "rgba(45, 212, 191, 0.88)",
          outerGlow: "rgba(103, 232, 249, 0.24)",
          size: 5.5,
        },
      },
      {
        id: "pink-orbit",
        radius: 0.90,
        hasTwinBand: false,
        lineWidth: 1.65,
        alpha: 0.90,
        orbiter: {
          angle: degToRad(165),
          speed: 0.48,
          coreColor: "#ffffff",
          midColor: "#f472b6",
          glowColor: "rgba(244, 114, 182, 0.88)",
          outerGlow: "rgba(244, 114, 182, 0.24)",
          size: 5.4,
        },
      },
      {
        id: "lavender-orbit",
        radius: 0.78,
        hasTwinBand: false,
        lineWidth: 1.6,
        alpha: 0.88,
        orbiter: {
          angle: degToRad(285),
          speed: 0.66,
          coreColor: "#ffffff",
          midColor: "#f3e8ff",
          glowColor: "rgba(243, 232, 255, 0.94)",
          outerGlow: "rgba(192, 132, 252, 0.30)",
          size: 5.6,
        },
      },
    ];

    // Bintang & Partikel Sekitar
    const starParticles: StarParticle[] = [
      { x: -0.57, y: -0.55, z: 0.18, size: 2.3, color: "243, 232, 255", twinkleSpeed: 2.4, phase: 0.2 },
      { x: 0.84,  y: -0.42, z: -0.22, size: 2.3, color: "243, 232, 255", twinkleSpeed: 2.8, phase: 1.6 },
      { x: -0.84, y: 0.45,  z: 0.15, size: 2.3, color: "243, 232, 255", twinkleSpeed: 2.1, phase: 3.0 },
      { x: -0.10, y: 0.77,  z: -0.12, size: 1.9, color: "243, 232, 255", twinkleSpeed: 3.1, phase: 4.2 },
      { x: 0.59,  y: 0.58,  z: 0.22, size: 2.3, color: "103, 232, 249", twinkleSpeed: 2.6, phase: 2.1 },
      { x: -0.92, y: -0.12, z: -0.35, size: 1.3, color: "192, 132, 252", twinkleSpeed: 1.9, phase: 0.8 },
      { x: 0.95,  y: 0.15,  z: 0.28,  size: 1.4, color: "103, 232, 249", twinkleSpeed: 2.3, phase: 2.7 },
      { x: 0.22,  y: -0.82, z: -0.25, size: 1.3, color: "216, 180, 254", twinkleSpeed: 2.0, phase: 5.1 },
    ];

    function transformAndProject(
      lx: number, ly: number, lz: number,
      rotX: number, rotY: number, rotZ: number,
      userRotX: number, userRotY: number
    ) {
      // 1. Rotasi Z lokal
      const cz = Math.cos(rotZ), sz = Math.sin(rotZ);
      const x1 = lx * cz - ly * sz;
      const y1 = lx * sz + ly * cz;
      const z1 = lz;

      // 2. Rotasi X lokal
      const cxRot = Math.cos(rotX), sxRot = Math.sin(rotX);
      const x2 = x1;
      const y2 = y1 * cxRot - z1 * sxRot;
      const z2 = y1 * sxRot + z1 * cxRot;

      // 3. Rotasi Y lokal
      const cyRot = Math.cos(rotY), syRot = Math.sin(rotY);
      const x3 = x2 * cyRot + z2 * syRot;
      const y3 = y2;
      const z3 = -x2 * syRot + z2 * cyRot;

      // 4. Rotasi Interaktif Pengguna (X dan Y)
      const ucy = Math.cos(userRotY), usy = Math.sin(userRotY);
      const ux1 = x3 * ucy + z3 * usy;
      const uy1 = y3;
      const uz1 = -x3 * usy + z3 * ucy;

      const ucx = Math.cos(userRotX), usx = Math.sin(userRotX);
      const wx = ux1;
      const wy = uy1 * ucx - uz1 * usx;
      const wz = uy1 * usx + uz1 * ucx;

      // Proyeksi Perspektif
      const perspective = FOV / (FOV - wz * 0.55);
      return {
        x: cx + wx * baseScale * perspective,
        y: cy + wy * baseScale * perspective,
        z: wz,
        scale: perspective,
        wx: wx,
      };
    }

    function getMainRingColorRGB(normalizedX: number): string {
      const t = Math.max(0, Math.min(1, (normalizedX + 1) * 0.5));
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const k = t * 2;
        r = Math.round(192 + (233 - 192) * k);
        g = Math.round(132 + (213 - 132) * k);
        b = Math.round(252 + (255 - 252) * k);
      } else {
        const k = (t - 0.5) * 2;
        r = Math.round(233 + (103 - 233) * k);
        g = Math.round(213 + (232 - 213) * k);
        b = Math.round(255 + (249 - 255) * k);
      }
      return `${r}, ${g}, ${b}`;
    }

    function getMainRingOrientation(ringIndex: number, simTime: number) {
      if (ringIndex === 0) {
        return {
          rotX: degToRad(65) + Math.sin(simTime * 0.5) * 0.45,
          rotY: simTime * 0.42,
          rotZ: simTime * 0.18,
        };
      } else if (ringIndex === 1) {
        return {
          rotX: simTime * 0.46 + 1.1,
          rotY: degToRad(42) + Math.cos(simTime * 0.4) * 0.45,
          rotZ: -simTime * 0.28,
        };
      } else {
        return {
          rotX: -simTime * 0.38 + 2.2,
          rotY: -simTime * 0.48 - 0.8,
          rotZ: degToRad(-38) + Math.sin(simTime * 0.55) * 0.4,
        };
      }
    }

    function resize() {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight || 580;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cx = width * 0.5;
      cy = height * 0.5 - 10;
      baseScale = Math.min(width, height) * 0.355;
    }

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    function buildSecondaryOrbitsPrimitives(
      simTime: number,
      uRotX: number,
      uRotY: number,
      backList: Primitive[],
      frontList: Primitive[]
    ) {
      const pinkOrient = getMainRingOrientation(1, simTime);
      const dashedRadius = mainOrbits[1].radius * 0.915;
      const dashCount = 60;
      const flowOffset = -simTime * 0.38;

      for (let i = 0; i < dashCount; i++) {
        if (i % 2 !== 0) continue;
        const a1 = (i / dashCount) * Math.PI * 2 + flowOffset;
        const a2 = ((i + 0.65) / dashCount) * Math.PI * 2 + flowOffset;
        const p1 = transformAndProject(Math.cos(a1) * dashedRadius, Math.sin(a1) * dashedRadius, 0, pinkOrient.rotX, pinkOrient.rotY, pinkOrient.rotZ, uRotX, uRotY);
        const p2 = transformAndProject(Math.cos(a2) * dashedRadius, Math.sin(a2) * dashedRadius, 0, pinkOrient.rotX, pinkOrient.rotY, pinkOrient.rotZ, uRotX, uRotY);
        const avgZ = (p1.z + p2.z) * 0.5;
        const depthBoost = 0.65 + 0.35 * ((avgZ + 1) * 0.5);
        const alpha = 0.34 * depthBoost;

        const cmd: Primitive = {
          z: avgZ,
          draw: () => {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.05 * ((p1.scale + p2.scale) * 0.5);
            ctx.lineCap = "round";
            ctx.stroke();
          },
        };
        if (avgZ < 0) backList.push(cmd);
        else frontList.push(cmd);
      }

      const secSegments = 88;
      const sRotX = degToRad(74) + Math.cos(simTime * 0.32) * 0.25;
      const sRotY = degToRad(-22) + simTime * 0.22;
      const sRotZ = degToRad(52) + Math.sin(simTime * 0.28) * 0.22;
      const sRadius = 0.96;

      for (let i = 0; i < secSegments; i++) {
        const a1 = (i / secSegments) * Math.PI * 2;
        const a2 = ((i + 1) / secSegments) * Math.PI * 2;
        const p1 = transformAndProject(Math.cos(a1) * sRadius, Math.sin(a1) * sRadius, 0, sRotX, sRotY, sRotZ, uRotX, uRotY);
        const p2 = transformAndProject(Math.cos(a2) * sRadius, Math.sin(a2) * sRadius, 0, sRotX, sRotY, sRotZ, uRotX, uRotY);
        const avgZ = (p1.z + p2.z) * 0.5;
        const shimmer = 0.5 + 0.5 * Math.sin(a1 * 2 - simTime * 1.5);
        const depthBoost = 0.6 + 0.4 * ((avgZ + 1) * 0.5);
        const alpha = (0.14 + shimmer * 0.12) * depthBoost;

        const cmd: Primitive = {
          z: avgZ,
          draw: () => {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.95 * ((p1.scale + p2.scale) * 0.5);
            ctx.stroke();
          },
        };
        if (avgZ < 0) backList.push(cmd);
        else frontList.push(cmd);
      }
    }

    function buildMainOrbitsAndParticles(
      simTime: number,
      dt: number,
      uRotX: number,
      uRotY: number,
      backList: Primitive[],
      frontList: Primitive[]
    ) {
      const ringSegments = 108;

      mainOrbits.forEach((orbit, ringIdx) => {
        const r = orbit.radius;
        const orient = getMainRingOrientation(ringIdx, simTime);

        // Segmen Cincin Orbit
        for (let i = 0; i < ringSegments; i++) {
          const a1 = (i / ringSegments) * Math.PI * 2;
          const a2 = ((i + 1.04) / ringSegments) * Math.PI * 2;

          const p1 = transformAndProject(Math.cos(a1) * r, Math.sin(a1) * r, 0, orient.rotX, orient.rotY, orient.rotZ, uRotX, uRotY);
          const p2 = transformAndProject(Math.cos(a2) * r, Math.sin(a2) * r, 0, orient.rotX, orient.rotY, orient.rotZ, uRotX, uRotY);

          let tp1: any = null, tp2: any = null;
          if (orbit.hasTwinBand) {
            const twinR = r * 0.958;
            tp1 = transformAndProject(Math.cos(a1) * twinR, Math.sin(a1) * twinR, 0, orient.rotX, orient.rotY, orient.rotZ, uRotX, uRotY);
            tp2 = transformAndProject(Math.cos(a2) * twinR, Math.sin(a2) * twinR, 0, orient.rotX, orient.rotY, orient.rotZ, uRotX, uRotY);
          }

          const avgZ = (p1.z + p2.z) * 0.5;
          const avgScale = (p1.scale + p2.scale) * 0.5;
          const avgWx = (p1.wx + p2.wx) * 0.5;

          const rgb = getMainRingColorRGB(avgWx / r);
          const depthFactor = 0.52 + 0.48 * Math.max(0, Math.min(1, (avgZ + 0.95) / 1.9));
          const finalAlpha = orbit.alpha * depthFactor;
          const widthScaled = orbit.lineWidth * avgScale * (0.82 + 0.32 * depthFactor);

          const cmd: Primitive = {
            z: avgZ,
            draw: () => {
              // Halo glow lembut
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(${rgb}, ${(finalAlpha * 0.25).toFixed(3)})`;
              ctx.lineWidth = widthScaled * 3.2;
              ctx.lineCap = "round";
              ctx.stroke();

              // Inti garis cincin tajam
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(${rgb}, ${finalAlpha.toFixed(3)})`;
              ctx.lineWidth = widthScaled;
              ctx.lineCap = "round";
              ctx.stroke();

              // Pita kembar pendamping
              if (tp1 && tp2) {
                ctx.beginPath();
                ctx.moveTo(tp1.x, tp1.y);
                ctx.lineTo(tp2.x, tp2.y);
                ctx.strokeStyle = `rgba(${rgb}, ${(finalAlpha * 0.52).toFixed(3)})`;
                ctx.lineWidth = widthScaled * 0.62;
                ctx.lineCap = "round";
                ctx.stroke();
              }
            },
          };

          if (avgZ < 0) backList.push(cmd);
          else frontList.push(cmd);
        }

        // Ekor Komet Bercahaya
        const orb = orbit.orbiter;
        orb.angle += orb.speed * dt;

        const trailSteps = 26;
        const trailArcLength = 0.68;
        const directionSign = orb.speed >= 0 ? 1 : -1;

        for (let s = 0; s < trailSteps; s++) {
          const frac1 = s / trailSteps;
          const frac2 = (s + 1) / trailSteps;

          const theta1 = orb.angle - directionSign * frac1 * trailArcLength;
          const theta2 = orb.angle - directionSign * frac2 * trailArcLength;

          const tp1 = transformAndProject(Math.cos(theta1) * r, Math.sin(theta1) * r, 0, orient.rotX, orient.rotY, orient.rotZ, uRotX, uRotY);
          const tp2 = transformAndProject(Math.cos(theta2) * r, Math.sin(theta2) * r, 0, orient.rotX, orient.rotY, orient.rotZ, uRotX, uRotY);

          const segZ = (tp1.z + tp2.z) * 0.5;
          const taper = Math.pow(1 - frac1, 1.7);
          const depthAlpha = 0.62 + 0.38 * ((segZ + 1) * 0.5);

          const trailCmd: Primitive = {
            z: segZ,
            draw: () => {
              ctx.beginPath();
              ctx.moveTo(tp1.x, tp1.y);
              ctx.lineTo(tp2.x, tp2.y);
              ctx.strokeStyle = orb.glowColor
                .replace("0.88", (taper * 0.72 * depthAlpha).toFixed(3))
                .replace("0.94", (taper * 0.78 * depthAlpha).toFixed(3));
              ctx.lineWidth = Math.max(0.6, orb.size * 1.18 * taper * tp1.scale);
              ctx.lineCap = "round";
              ctx.stroke();
            },
          };

          if (segZ < 0) backList.push(trailCmd);
          else frontList.push(trailCmd);
        }

        // Bola Partikel Bercahaya
        const headPos = transformAndProject(
          Math.cos(orb.angle) * r,
          Math.sin(orb.angle) * r,
          0,
          orient.rotX,
          orient.rotY,
          orient.rotZ,
          uRotX,
          uRotY
        );

        const sphereCmd: Primitive = {
          z: headPos.z + 0.02,
          draw: () => {
            const pScale = headPos.scale;
            const depthBright = 0.75 + 0.25 * Math.max(0, Math.min(1, (headPos.z + 1) * 0.5));
            const outerR = orb.size * 3.8 * pScale;

            // Halo Bercahaya
            const gradOuter = ctx.createRadialGradient(headPos.x, headPos.y, 0, headPos.x, headPos.y, outerR);
            gradOuter.addColorStop(0, orb.glowColor);
            gradOuter.addColorStop(0.45, orb.outerGlow);
            gradOuter.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = gradOuter;
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, outerR, 0, Math.PI * 2);
            ctx.fill();

            // Bola Berwarna Inti
            const midR = orb.size * 1.28 * pScale;
            const gradMid = ctx.createRadialGradient(headPos.x, headPos.y, 0, headPos.x, headPos.y, midR);
            gradMid.addColorStop(0, "#ffffff");
            gradMid.addColorStop(0.48, orb.midColor);
            gradMid.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.globalAlpha = depthBright;
            ctx.fillStyle = gradMid;
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, midR, 0, Math.PI * 2);
            ctx.fill();

            // Titik Putih Panas
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, orb.size * 0.48 * pScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          },
        };

        if (headPos.z < 0) backList.push(sphereCmd);
        else frontList.push(sphereCmd);
      });
    }

    function buildStarPrimitives(
      simTime: number,
      uRotX: number,
      uRotY: number,
      backList: Primitive[],
      frontList: Primitive[]
    ) {
      starParticles.forEach((star) => {
        const p = transformAndProject(
          star.x,
          star.y,
          star.z,
          0,
          simTime * 0.05,
          0,
          uRotX * 0.65,
          uRotY * 0.65
        );

        const twinkle = 0.55 + 0.45 * Math.sin(simTime * star.twinkleSpeed + star.phase);
        const r = star.size * p.scale * (0.85 + 0.3 * twinkle);

        const cmd: Primitive = {
          z: p.z,
          draw: () => {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
            g.addColorStop(0, `rgba(255, 255, 255, ${(0.95 * twinkle).toFixed(3)})`);
            g.addColorStop(0.35, `rgba(${star.color}, ${(0.55 * twinkle).toFixed(3)})`);
            g.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 255, 255, ${(0.9 * twinkle).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
          },
        };

        if (p.z < 0) backList.push(cmd);
        else frontList.push(cmd);
      });
    }

    function drawCentralCoreAndRipples(simTime: number, dt: number) {
      const pulse = 1 + Math.sin(simTime * 2.3) * 0.045;

      // 1. Aura Ungu-Violet Besar di Belakang Inti
      const outerAuraRadius = baseScale * 0.72 * pulse;
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerAuraRadius);
      auraGrad.addColorStop(0.0, "rgba(216, 180, 254, 0.52)");
      auraGrad.addColorStop(0.32, "rgba(168, 85, 247, 0.26)");
      auraGrad.addColorStop(0.68, "rgba(107, 33, 168, 0.08)");
      auraGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, outerAuraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Empat Cincin Konsentris Statis + Gelombang Riak Mengembang
      const baseRipples = [0.20, 0.285, 0.375, 0.47];
      baseRipples.forEach((normR, idx) => {
        const breathe = 1 + Math.sin(simTime * 1.8 - idx * 0.7) * 0.025;
        const radius = baseScale * normR * breathe;
        const alpha = (0.23 - idx * 0.04) + Math.sin(simTime * 1.8 - idx * 0.7) * 0.035;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(216, 180, 254, ${Math.max(0.03, alpha).toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      });

      // Gelombang riak kontinu yang memuai perlahan
      for (let i = 0; i < 3; i++) {
        const prog = (simTime * 0.18 + i / 3) % 1;
        const r = baseScale * (0.14 + prog * 0.40);
        const alpha = Math.sin(prog * Math.PI) * 0.18;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(192, 132, 252, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // 3. Gelombang Kejut Interaktif
      for (let i = interactivePulses.length - 1; i >= 0; i--) {
        const ip = interactivePulses[i];
        ip.progress += dt * 0.85;
        if (ip.progress >= 1) {
          interactivePulses.splice(i, 1);
          continue;
        }
        const easeOut = 1 - Math.pow(1 - ip.progress, 3);
        const r = baseScale * (0.12 + easeOut * 0.88);
        const alpha = (1 - ip.progress) * 0.55;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(192, 132, 252, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 2.2 * (1 - ip.progress * 0.6);
        ctx.stroke();
      }

      // 4. Pendaran Inti Menengah
      const midGlowR = baseScale * 0.25 * pulse;
      const midGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, midGlowR);
      midGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      midGrad.addColorStop(0.32, "rgba(243, 232, 255, 0.92)");
      midGrad.addColorStop(0.65, "rgba(192, 132, 252, 0.45)");
      midGrad.addColorStop(1.0, "rgba(168, 85, 247, 0.0)");
      ctx.fillStyle = midGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, midGlowR, 0, Math.PI * 2);
      ctx.fill();

      // 5. Bola Inti Putih Terang
      const coreRadius = baseScale * 0.095;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Interaksi Mouse
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragMoved = false;
      pointerVelocity.x = 0;
      pointerVelocity.y = 0;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;

      pointerVelocity.y = dx * 0.0065;
      pointerVelocity.x = dy * 0.0065;
      targetUserRot.y += pointerVelocity.y;
      targetUserRot.x = Math.max(-1.15, Math.min(1.15, targetUserRot.x + pointerVelocity.x));
    };

    const handleMouseUp = () => {
      if (isDragging && !dragMoved) {
        triggerCorePulse();
      }
      isDragging = false;
    };

    // Interaksi Touch
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        dragMoved = false;
        pointerVelocity.x = 0;
        pointerVelocity.y = 0;
        lastPointer.x = e.touches[0].clientX;
        lastPointer.y = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastPointer.x;
      const dy = e.touches[0].clientY - lastPointer.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      lastPointer.x = e.touches[0].clientX;
      lastPointer.y = e.touches[0].clientY;

      pointerVelocity.y = dx * 0.0065;
      pointerVelocity.x = dy * 0.0065;
      targetUserRot.y += pointerVelocity.y;
      targetUserRot.x = Math.max(-1.15, Math.min(1.15, targetUserRot.x + pointerVelocity.x));
    };

    const handleTouchEnd = () => {
      if (isDragging && !dragMoved) {
        triggerCorePulse();
      }
      isDragging = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Animasi Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let simTime = 0;

    function animate(now: number) {
      animationFrameId = requestAnimationFrame(animate);

      const rawDt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      const dt = rawDt * SPEED_MULTIPLIER;
      simTime += dt;

      if (!isDragging) {
        pointerVelocity.x *= 0.92;
        pointerVelocity.y *= 0.92;
        targetUserRot.y += pointerVelocity.y;
        targetUserRot.x = Math.max(-1.15, Math.min(1.15, targetUserRot.x + pointerVelocity.x));
      }

      currentUserRot.x += (targetUserRot.x - currentUserRot.x) * 0.1;
      currentUserRot.y += (targetUserRot.y - currentUserRot.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      // Lingkaran Luar Pembatas
      ctx.beginPath();
      ctx.arc(cx, cy, baseScale * 0.985, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(167, 139, 250, 0.11)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const backPrimitives: Primitive[] = [];
      const frontPrimitives: Primitive[] = [];

      buildStarPrimitives(simTime, currentUserRot.x, currentUserRot.y, backPrimitives, frontPrimitives);
      buildSecondaryOrbitsPrimitives(simTime, currentUserRot.x, currentUserRot.y, backPrimitives, frontPrimitives);
      buildMainOrbitsAndParticles(simTime, dt, currentUserRot.x, currentUserRot.y, backPrimitives, frontPrimitives);

      backPrimitives.sort((a, b) => a.z - b.z);
      frontPrimitives.sort((a, b) => a.z - b.z);

      for (let i = 0; i < backPrimitives.length; i++) {
        backPrimitives[i].draw();
      }

      drawCentralCoreAndRipples(simTime, rawDt);

      for (let i = 0; i < frontPrimitives.length; i++) {
        frontPrimitives[i].draw();
      }
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const handleBadgeClick = useCallback(() => {
    pulseTriggerRef.current?.();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[540px] sm:h-[580px] lg:h-[620px] rounded-[32px] overflow-hidden border border-white/10 bg-gradient-to-br from-[#231642]/85 via-[#141234]/90 to-[#0c0920]/95 backdrop-blur-2xl shadow-[0_28px_70px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.12)] flex items-center justify-center select-none"
    >
      {/* Background ambient lighting glows */}
      <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-violet-600/20 blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full bg-cyan-600/18 blur-[65px] pointer-events-none" />

      {/* 3D Orbit Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none z-10"
        title="Sentuh atau geser untuk memutar sudut pandang 3D. Klik inti untuk memancarkan energi."
      />

      {/* Bottom Badge Capsule */}
      <button
        type="button"
        onClick={handleBadgeClick}
        title="Klik untuk memancarkan gelombang energi inti"
        className="group absolute bottom-6 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#0f0a22]/80 hover:bg-[#160f33]/90 border border-violet-400/25 hover:border-violet-400/50 text-[11px] font-bold tracking-[1.5px] uppercase text-purple-100/90 shadow-[0_6px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_6px_28px_rgba(168,85,247,0.28)] transition-all active:scale-95 cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 shadow-[0_0_8px_#a855f7,0_0_14px_#c084fc]" />
        </span>
        <span>Sentuh · Pahami · Belajar Mandiri</span>
      </button>
    </div>
  );
}
