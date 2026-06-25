import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'blocks' | 'blackhole' | 'explosion' | 'tap' | 'collapse' | 'bigbang';
interface Props { onComplete: () => void; }

// ── PRNG ──────────────────────────────────────────────────────────────────
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

// ── easing ────────────────────────────────────────────────────────────────
const easeOut  = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn   = (t: number) => t * t;
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ── config ─────────────────────────────────────────────────────────────────
const BH_R   = 90;   // blackhole radius
const TAP_SZ = 220;  // tap sphere diameter

// ── deterministic noise ───────────────────────────────────────────────────
function dNoise(i: number, t: number) {
  const s = Math.sin(i * 127.1 + t * 0.001) * 43758.5453;
  return s - Math.floor(s);
}

// ══════════════════════════════════════════════════════════════════════════
// SCENE 1: Stream of squares converging from edges to center (looping)
// ══════════════════════════════════════════════════════════════════════════
interface StreamPt {
  angle: number; startR: number; travelMs: number; birthMs: number;
  size: number; gray: number; rot0: number; rotSpeed: number; curve: number;
}

const STREAM: StreamPt[] = (() => {
  const rng = makePrng(42);
  const CYCLE = 2400;   // ms for one particle to travel edge→center
  const TOTAL = 280;
  return Array.from({ length: TOTAL }, (_, i) => ({
    angle:    rng() * Math.PI * 2,
    startR:   220 + rng() * 280,
    travelMs: 900 + rng() * 900,
    birthMs:  (i / TOTAL) * CYCLE,   // stagger births across one cycle
    size:     2 + Math.floor(rng() * 5),
    gray:     70 + Math.floor(rng() * 120),
    rot0:     rng() * Math.PI * 2,
    rotSpeed: (0.003 + rng() * 0.01) * (rng() < 0.5 ? 1 : -1),
    curve:    (rng() - 0.5) * 0.6,
  }));
})();

function drawBlockStream(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  elapsed: number,
  globalAlpha: number,
) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  const CYCLE = 2400;

  for (const p of STREAM) {
    // How long since this particle was born (with cycling)
    const raw = elapsed - p.birthMs;
    if (raw < 0) continue;

    const cycleTime = raw % CYCLE;  // position within current cycle
    const frac = cycleTime / p.travelMs;  // 0→1 travel progress
    if (frac >= 1) continue;  // waiting for next cycle

    const eased = easeIn(frac);
    const dist  = p.startR * (1 - eased) + BH_R * eased;
    if (dist < BH_R * 1.05) continue;

    const angle = p.angle + p.curve * eased * Math.PI * 0.5;
    const px    = cx + Math.cos(angle) * dist;
    const py    = cy + Math.sin(angle) * dist;

    // Fade in from edge, fade out near center
    const fadeIn  = Math.min(frac * 5, 1);
    const fadeOut = Math.min((1 - frac) * 4, 1);
    const opacity = fadeIn * fadeOut * globalAlpha;
    if (opacity < 0.02) continue;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.rot0 + p.rotSpeed * elapsed);
    ctx.globalAlpha = opacity;
    ctx.fillStyle   = `rgb(${p.gray},${p.gray},${p.gray})`;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SCENE 2: Intense blackhole canvas (completely new)
// ══════════════════════════════════════════════════════════════════════════
interface DebrisPt {
  angle: number; radius: number; orbSpeed: number; inSpeed: number;
  size: number; gray: number; rot: number; rotSpeed: number; isSquare: boolean;
}

const DEBRIS: DebrisPt[] = (() => {
  const rng = makePrng(7);
  return Array.from({ length: 70 }, (_, i) => ({
    angle:    rng() * Math.PI * 2,
    radius:   BH_R * 1.2 + rng() * BH_R * 2.8,
    orbSpeed: (0.0010 + rng() * 0.0020) * (rng() < 0.5 ? 1 : -1),
    inSpeed:  0.005 + rng() * 0.012,
    size:     1.5 + rng() * 5,
    gray:     180 + Math.floor(rng() * 75),
    rot:      rng() * Math.PI * 2,
    rotSpeed: (0.003 + rng() * 0.012) * (rng() < 0.5 ? 1 : -1),
    isSquare: i < 28,
  }));
})();

function drawBlackholeScene(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  elapsed: number,
  intensity: number,  // 0→1
) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  // ── dark background with growing void influence ─────────────────────────
  const bgAlpha = intensity * 0.55;
  ctx.fillStyle = `rgba(0,0,0,${bgAlpha.toFixed(2)})`;
  ctx.fillRect(0, 0, W, H);

  // ── accretion disk (glowing ring around BH) ─────────────────────────────
  const diskInner = BH_R * 1.02;
  const diskOuter = BH_R * 3.2;
  const disk = ctx.createRadialGradient(cx, cy, diskInner, cx, cy, diskOuter);
  const hue = Math.floor(220 - intensity * 80); // shifts blue→purple
  disk.addColorStop(0,   `rgba(255,255,255,${0.55 + intensity * 0.3})`);
  disk.addColorStop(0.15, `rgba(200,220,255,${0.25 + intensity * 0.15})`);
  disk.addColorStop(0.4,  `hsla(${hue},80%,65%,${0.12 + intensity * 0.08})`);
  disk.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, diskOuter, 0, Math.PI * 2);
  ctx.fillStyle = disk;
  ctx.fill();

  // ── distortion rays ────────────────────────────────────────────────────
  const rayCount = 36;
  for (let i = 0; i < rayCount; i++) {
    const baseA  = (i / rayCount) * Math.PI * 2;
    const wobble = Math.sin(elapsed * 0.0035 + i * 2.1) * 0.22 * intensity;
    const a      = baseA + wobble;
    const len    = BH_R * (0.4 + dNoise(i, elapsed) * 1.8) * (0.5 + intensity * 0.5);
    const rawA   = (0.06 + 0.18 * intensity) * (0.4 + 0.6 * Math.sin(elapsed * 0.006 + i));
    const rayHue = (hue + i * 3) % 360;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (BH_R + 2), cy + Math.sin(a) * (BH_R + 2));
    ctx.lineTo(cx + Math.cos(a) * (BH_R + 2 + len), cy + Math.sin(a) * (BH_R + 2 + len));
    ctx.strokeStyle = `hsla(${rayHue},60%,90%,${rawA.toFixed(2)})`;
    ctx.lineWidth   = 0.8 + intensity * 2;
    ctx.stroke();
  }

  // ── sweeping light arcs ─────────────────────────────────────────────────
  const arcs = [
    { r: BH_R * 1.3,  spd: 0.0022,  spread: 0.6,  bright: 0.9,  hue:  220 },
    { r: BH_R * 1.8,  spd: -0.0016, spread: 0.8,  bright: 0.7,  hue:  280 },
    { r: BH_R * 2.6,  spd: 0.0011,  spread: 1.2,  bright: 0.45, hue:  180 },
    { r: BH_R * 1.05, spd: -0.003,  spread: 0.4,  bright: 1.0,  hue:  260 },
    { r: BH_R * 3.4,  spd: 0.0008,  spread: 1.8,  bright: 0.3,  hue:  200 },
  ];
  for (const arc of arcs) {
    const a0   = elapsed * arc.spd;
    const g    = arc.bright * (0.6 + 0.4 * intensity);
    const arcH = arc.hue + intensity * 40;
    // Glow
    ctx.beginPath();
    ctx.arc(cx, cy, arc.r, a0, a0 + arc.spread);
    ctx.strokeStyle = `hsla(${arcH},70%,85%,${(g * 0.35).toFixed(2)})`;
    ctx.lineWidth   = 16;
    ctx.lineCap     = 'round';
    ctx.stroke();
    // Sharp
    ctx.beginPath();
    ctx.arc(cx, cy, arc.r, a0, a0 + arc.spread);
    ctx.strokeStyle = `hsla(${arcH},90%,95%,${g.toFixed(2)})`;
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  // ── relativistic jets (bright beams from poles) ─────────────────────────
  if (intensity > 0.3) {
    const jetLen   = BH_R * (1 + intensity * 3);
    const jetAlpha = (intensity - 0.3) / 0.7 * 0.5;
    for (const dir of [-1, 1]) {
      const grad = ctx.createLinearGradient(cx, cy, cx, cy + dir * jetLen);
      grad.addColorStop(0,   `rgba(255,255,255,${jetAlpha.toFixed(2)})`);
      grad.addColorStop(0.4, `hsla(${hue},80%,80%,${(jetAlpha * 0.5).toFixed(2)})`);
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + dir * jetLen);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 3 + intensity * 8;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  // ── chromatic aberration flashes at high intensity ─────────────────────
  if (intensity > 0.65 && dNoise(999, elapsed) > 0.75) {
    const aberR = intensity * 6;
    const aberA = (dNoise(998, elapsed) - 0.75) * 4 * 0.6;
    ctx.save();
    ctx.globalAlpha = aberA;
    ctx.globalCompositeOperation = 'screen';
    // Red shift left
    ctx.fillStyle = `rgba(255,30,30,0.15)`;
    ctx.fillRect(0, 0, cx - aberR, H);
    // Blue shift right
    ctx.fillStyle = `rgba(30,80,255,0.15)`;
    ctx.fillRect(cx + aberR, 0, W - cx - aberR, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  // ── pulsing event horizon glow ──────────────────────────────────────────
  const pulseBase = 0.3 + intensity * 0.5;
  const pulse     = pulseBase + Math.sin(elapsed * 0.012) * 0.2 * intensity;
  const halo = ctx.createRadialGradient(cx, cy, BH_R, cx, cy, BH_R * 5);
  halo.addColorStop(0,   `hsla(${hue},60%,80%,${pulse.toFixed(2)})`);
  halo.addColorStop(0.3, `hsla(${hue + 20},60%,60%,${(pulse * 0.3).toFixed(2)})`);
  halo.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, BH_R * 5, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // ── orbiting debris ─────────────────────────────────────────────────────
  for (const d of DEBRIS) {
    const pull   = 1 + intensity * 0.8;
    const angle  = d.angle + elapsed * d.orbSpeed * pull;
    // Debris slowly spirals inward
    const r      = Math.max(d.radius - elapsed * d.inSpeed * intensity, BH_R * 1.06);
    const dx     = cx + Math.cos(angle) * r;
    const dy     = cy + Math.sin(angle) * r;
    const rot    = d.rot + elapsed * d.rotSpeed;
    const al     = 0.4 + 0.6 * intensity;
    const g      = d.gray;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rot);
    ctx.globalAlpha = al;
    if (d.isSquare) {
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── solid black event horizon ───────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, BH_R, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Bright edge ring
  const edgeGlow = 0.4 + intensity * 0.55 + Math.sin(elapsed * 0.015) * 0.15 * intensity;
  ctx.beginPath();
  ctx.arc(cx, cy, BH_R + 1, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue + 30},80%,95%,${edgeGlow.toFixed(2)})`;
  ctx.lineWidth   = 1.5 + intensity * 4;
  ctx.stroke();

  // ── warp distortion rings ───────────────────────────────────────────────
  for (let ring = 0; ring < 5; ring++) {
    const ringR  = BH_R * 1.3 + ring * BH_R * 0.6;
    const ringPulse = Math.sin(elapsed * 0.008 + ring * 1.2) * 0.5 + 0.5;
    const ringA  = (0.06 + 0.08 * intensity) * ringPulse;
    if (ringA < 0.01) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${ringA.toFixed(2)})`;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SCENE 3b: Bigbang canvas (colorful cosmic explosion)
// ══════════════════════════════════════════════════════════════════════════
interface BbPt {
  angle: number; speed: number; hue: number; sat: number;
  size: number; delay: number; trail: number; layer: number;
}

// Pre-computed star trajectories (finalFrac = fraction of screenR to stop at)
interface StarPt { angle: number; finalFrac: number; hue: number; size: number; delay: number; sparkle: boolean; }
const BB_STARS: StarPt[] = (() => {
  const rng = makePrng(77);
  return Array.from({ length: 240 }, () => ({
    angle:      rng() * Math.PI * 2,
    finalFrac:  0.15 + rng() * 1.0,   // 15%–115% of screenR
    hue:        rng() * 360,
    size:       0.7 + rng() * 2.6,
    delay:      rng() * 0.12,         // all launched within first 12% of timeline
    sparkle:    rng() > 0.55,
  }));
})();

// Layer 0 = hot micro-sparks (white, tiny, very fast)
// Layer 1 = main colorful burst
// Layer 2 = slow heavy debris
const BB_PARTICLES: BbPt[] = (() => {
  const rng = makePrng(17);
  const pts: BbPt[] = [];

  // Layer 0: 140 micro-sparks — white/cyan, super fast, short delay
  for (let i = 0; i < 140; i++) {
    pts.push({
      angle:  rng() * Math.PI * 2,
      speed:  0.75 + rng() * 0.55,
      hue:    170 + rng() * 60,   // cyan-white
      sat:    40 + rng() * 30,
      size:   0.6 + rng() * 1.6,
      delay:  rng() * 0.08,
      trail:  30 + rng() * 80,
      layer:  0,
    });
  }
  // Layer 1: 320 main colorful particles
  for (let i = 0; i < 320; i++) {
    pts.push({
      angle:  rng() * Math.PI * 2,
      speed:  0.2 + rng() * 0.8,
      hue:    rng() * 360,
      sat:    80 + rng() * 20,
      size:   1.2 + rng() * 5,
      delay:  rng() * 0.25,
      trail:  14 + rng() * 65,
      layer:  1,
    });
  }
  // Layer 2: 90 slow large debris chunks
  for (let i = 0; i < 90; i++) {
    pts.push({
      angle:  rng() * Math.PI * 2,
      speed:  0.08 + rng() * 0.35,
      hue:    rng() * 360,
      sat:    70 + rng() * 30,
      size:   2.5 + rng() * 6,
      delay:  0.05 + rng() * 0.2,
      trail:  4 + rng() * 20,
      layer:  2,
    });
  }
  return pts;
})();

function drawBigbang(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  elapsed: number,
  duration: number,
) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const t = Math.min(elapsed / duration, 1);
  const screenR = Math.sqrt(cx * cx + cy * cy) + 100;

  ctx.clearRect(0, 0, W, H);

  // ── background darkens as explosion settles ─────────────────────────────
  const bgFill = Math.max(0, t - 0.3) * 0.6;
  if (bgFill > 0) {
    ctx.fillStyle = `rgba(0,0,2,${bgFill.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── hot glowing core (fades by t=0.5) ──────────────────────────────────
  const coreT = Math.max(0, 1 - t * 2.2);
  if (coreT > 0.01) {
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, screenR * 0.25);
    core.addColorStop(0,    `rgba(255,255,255,${coreT.toFixed(2)})`);
    core.addColorStop(0.25, `hsla(190,100%,90%,${(coreT * 0.7).toFixed(2)})`);
    core.addColorStop(0.6,  `hsla(260,80%,60%,${(coreT * 0.3).toFixed(2)})`);
    core.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, W, H);
  }

  // ── initial white flash ─────────────────────────────────────────────────
  const flashA = Math.max(0, 1 - t * 4.5);
  if (flashA > 0.01) {
    ctx.fillStyle = `rgba(255,255,255,${flashA.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── energy tendrils / lightning streaks near center ─────────────────────
  const tendrilT = Math.max(0, 1 - t * 5);  // only first 200ms
  if (tendrilT > 0.01) {
    const tendrilCount = 16;
    for (let i = 0; i < tendrilCount; i++) {
      const a   = (i / tendrilCount) * Math.PI * 2 + t * 0.5;
      const len = (60 + dNoise(i, elapsed) * 120) * tendrilT;
      const al  = tendrilT * (0.4 + dNoise(i + 100, elapsed) * 0.6);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Jagged lightning: two segments
      const midX = cx + Math.cos(a + 0.3) * len * 0.5;
      const midY = cy + Math.sin(a + 0.3) * len * 0.5;
      ctx.lineTo(midX, midY);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.strokeStyle = `rgba(220,240,255,${al.toFixed(2)})`;
      ctx.lineWidth   = 1 + tendrilT * 2;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  // ── shock wave rings ────────────────────────────────────────────────────
  const shockDefs = [
    { delay: 0.00, spd: 1.05, hue:   0, thick: 28, bright: 1.0 },  // white primary
    { delay: 0.04, spd: 0.92, hue: 210, thick: 18, bright: 0.85 },
    { delay: 0.08, spd: 0.80, hue: 270, thick: 14, bright: 0.75 },
    { delay: 0.07, spd: 0.97, hue:  45, thick: 10, bright: 0.7  },
    { delay: 0.12, spd: 0.75, hue: 355, thick: 10, bright: 0.65 },
    { delay: 0.11, spd: 0.88, hue: 140, thick:  8, bright: 0.6  },
    { delay: 0.15, spd: 0.70, hue: 185, thick:  8, bright: 0.55 },
    { delay: 0.20, spd: 0.65, hue:  30, thick:  6, bright: 0.5  },
    { delay: 0.25, spd: 0.60, hue: 310, thick:  6, bright: 0.45 },
    // Secondary echo wave
    { delay: 0.22, spd: 0.55, hue: 210, thick: 12, bright: 0.5  },
  ];
  for (const rd of shockDefs) {
    const rt = Math.max(0, (t - rd.delay) / (1 - rd.delay));
    if (rt <= 0) continue;
    const r  = easeOut(rt) * screenR * rd.spd;
    const al = (1 - rt) * rd.bright;
    if (al < 0.01 || r < 1) continue;
    // Wide glow
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = rd.hue === 0
      ? `rgba(255,255,255,${(al * 0.4).toFixed(2)})`
      : `hsla(${rd.hue},100%,80%,${(al * 0.35).toFixed(2)})`;
    ctx.lineWidth = rd.thick;
    ctx.stroke();
    // Sharp edge
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = rd.hue === 0
      ? `rgba(255,255,255,${al.toFixed(2)})`
      : `hsla(${rd.hue},100%,72%,${al.toFixed(2)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── nebula cloud (builds up mid-explosion) ──────────────────────────────
  const nebT = Math.min(Math.max(0, (t - 0.1) / 0.9) * 1.6, 1);
  const nebA = nebT * (1 - t * 0.65) * 0.55;
  if (nebA > 0.01) {
    const neb1 = ctx.createRadialGradient(cx, cy, screenR * 0.05, cx, cy, screenR * 0.65);
    neb1.addColorStop(0,   `hsla(200,100%,85%,${nebA.toFixed(2)})`);
    neb1.addColorStop(0.2, `hsla(260,90%,65%,${(nebA * 0.7).toFixed(2)})`);
    neb1.addColorStop(0.5, `hsla(30,100%,60%,${(nebA * 0.35).toFixed(2)})`);
    neb1.addColorStop(0.8, `hsla(350,90%,50%,${(nebA * 0.15).toFixed(2)})`);
    neb1.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, W, H);
    // Secondary off-center nebula patch
    const neb2 = ctx.createRadialGradient(
      cx + screenR * 0.2, cy - screenR * 0.15, 0,
      cx + screenR * 0.2, cy - screenR * 0.15, screenR * 0.4,
    );
    neb2.addColorStop(0,   `hsla(180,100%,70%,${(nebA * 0.4).toFixed(2)})`);
    neb2.addColorStop(0.5, `hsla(300,80%,55%,${(nebA * 0.2).toFixed(2)})`);
    neb2.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, W, H);
  }

  // ── particles (all 3 layers) ────────────────────────────────────────────
  for (const p of BB_PARTICLES) {
    const pt = Math.max(0, (t - p.delay) / (1 - p.delay));
    if (pt <= 0) continue;

    const dist     = easeOut(pt) * screenR * 1.15 * p.speed;
    if (dist < 1) continue;

    // Layer-specific alpha curve
    const al = p.layer === 0
      ? (1 - pt) * 0.9                       // sparks: fade linearly
      : p.layer === 2
        ? (1 - pt * 0.6) * 0.85             // debris: linger longer
        : (1 - pt * 0.72) * 0.95;           // main: standard

    if (al < 0.01) continue;

    const px  = cx + Math.cos(p.angle) * dist;
    const py  = cy + Math.sin(p.angle) * dist;

    // Trail — longer for sparks
    const trailLen  = p.trail * (p.layer === 0 ? 1.5 : 1) * pt;
    const trailDist = Math.max(0, dist - trailLen);
    const ptx = cx + Math.cos(p.angle) * trailDist;
    const pty = cy + Math.sin(p.angle) * trailDist;

    const lum = p.layer === 0 ? 95 : 82;
    const grd = ctx.createLinearGradient(ptx, pty, px, py);
    grd.addColorStop(0, `hsla(${p.hue},${p.sat}%,${lum}%,0)`);
    grd.addColorStop(1, `hsla(${p.hue},${p.sat}%,${lum}%,${al.toFixed(2)})`);
    ctx.beginPath();
    ctx.moveTo(ptx, pty);
    ctx.lineTo(px, py);
    ctx.strokeStyle = grd;
    ctx.lineWidth   = p.size * (p.layer === 0 ? 0.5 : 0.8);
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Dot (sparks skip dot for performance, debris gets glow)
    if (p.layer !== 0) {
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${lum}%,${al.toFixed(2)})`;
      ctx.fill();
      if (p.layer === 2 && p.size > 5) {
        // Debris glow
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},${p.sat}%,70%,${(al * 0.2).toFixed(2)})`;
        ctx.fill();
      }
    }
  }

  // ── stars: launched fast from center, decelerate hard and STOP ──────────
  // All stars reach their final position by t≈0.35; they stay put after that.
  const STOP_T = 0.35;
  for (const s of BB_STARS) {
    const raw    = Math.max(0, t - s.delay);
    const moveFrac = Math.min(raw / Math.max(STOP_T - s.delay, 0.01), 1);
    // Quartic easeOut: launches at full speed, stops hard
    const eased  = 1 - Math.pow(1 - moveFrac, 4);
    const finalDist = s.finalFrac * screenR;
    const dist   = eased * finalDist;

    const px = cx + Math.cos(s.angle) * dist;
    const py = cy + Math.sin(s.angle) * dist;

    // Fade in fast when launched; stay fully visible after stopping
    const al = Math.min(moveFrac * 6, 1) * 0.88;
    if (al < 0.01) continue;

    // Short motion blur trail while moving
    if (moveFrac < 1) {
      const prevDist = Math.max(0, dist - s.size * 8 * (1 - moveFrac));
      const bx = cx + Math.cos(s.angle) * prevDist;
      const by = cy + Math.sin(s.angle) * prevDist;
      const blurGrd = ctx.createLinearGradient(bx, by, px, py);
      blurGrd.addColorStop(0, `hsla(${s.hue},60%,97%,0)`);
      blurGrd.addColorStop(1, `hsla(${s.hue},60%,97%,${(al * 0.5).toFixed(2)})`);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(px, py);
      ctx.strokeStyle = blurGrd;
      ctx.lineWidth   = s.size * 0.7;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }

    // Star dot
    ctx.beginPath();
    ctx.arc(px, py, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${s.hue},55%,97%,${al.toFixed(2)})`;
    ctx.fill();

    // Cross sparkle — visible once the star has stopped
    if (s.sparkle && moveFrac > 0.85) {
      const sparkleAl = (moveFrac - 0.85) / 0.15 * al;
      const sLen = s.size * (s.size > 1.8 ? 4.5 : 3);
      for (const ang of [0, Math.PI / 2]) {
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(ang) * sLen, py - Math.sin(ang) * sLen);
        ctx.lineTo(px + Math.cos(ang) * sLen, py + Math.sin(ang) * sLen);
        ctx.strokeStyle = `hsla(${s.hue},60%,99%,${(sparkleAl * 0.45).toFixed(2)})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export function RollAnimation({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('blocks');
  const phaseRef          = useRef<Phase>('blocks');

  const blockCanvasRef   = useRef<HTMLCanvasElement>(null);
  const bhCanvasRef      = useRef<HTMLCanvasElement>(null);
  const bbCanvasRef      = useRef<HTMLCanvasElement>(null);
  const shakeRef         = useRef<HTMLDivElement>(null);
  const aberRef          = useRef<HTMLDivElement>(null);

  const blockRafRef  = useRef<number | null>(null);
  const bhRafRef     = useRef<number | null>(null);
  const bbRafRef     = useRef<number | null>(null);
  const shakeRafRef  = useRef<number | null>(null);

  const blockStartRef = useRef<number | null>(null);
  const bhStartRef    = useRef<number | null>(null);
  const bbStartRef    = useRef<number | null>(null);
  const bbDoneRef     = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── phase timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('blackhole'), 5000);
    const t2 = setTimeout(() => setPhase('explosion'), 9400);
    const t3 = setTimeout(() => setPhase('tap'),       10300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // ── screen shake (blackhole phase) ────────────────────────────────────
  useEffect(() => {
    const el  = shakeRef.current;
    const ab  = aberRef.current;
    if (!el) return;
    if (phase !== 'blackhole') {
      el.style.transform = '';
      if (ab) ab.style.opacity = '0';
      if (shakeRafRef.current) cancelAnimationFrame(shakeRafRef.current);
      return;
    }
    const BH_PHASE_DUR = 4400;
    let start: number | null = null;
    const loop = (ts: number) => {
      if (!start) start = ts;
      const e   = ts - start;
      const pct = Math.min(e / BH_PHASE_DUR, 1);
      const mag = 2 + pct * pct * 18;  // ramps quadratically 2→20
      const dx  = (Math.random() - 0.5) * mag * 2;
      const dy  = (Math.random() - 0.5) * mag * 2;
      el.style.transform = `translate(${dx}px,${dy}px)`;
      // Chromatic aberration overlay at high intensity
      if (ab) {
        const aberA = pct > 0.6 ? ((pct - 0.6) / 0.4) * 0.35 : 0;
        ab.style.opacity = aberA.toFixed(2);
      }
      shakeRafRef.current = requestAnimationFrame(loop);
    };
    shakeRafRef.current = requestAnimationFrame(loop);
    return () => { if (shakeRafRef.current) cancelAnimationFrame(shakeRafRef.current); };
  }, [phase]);

  // ── SCENE 1: block stream canvas (runs through blocks + blackhole) ─────
  useEffect(() => {
    const canvas = blockCanvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = (ts: number) => {
      if (!blockStartRef.current) blockStartRef.current = ts;
      const elapsed = ts - blockStartRef.current;

      const ph = phaseRef.current;
      // Alpha: time-based smooth fade 1.0→0.35 over 2500ms after blocks→blackhole
      const FADE_START = 5000;   // = t1 timer (BLOCKS_DUR)
      const FADE_DUR   = 2500;   // crossfade duration
      let gAlpha: number;
      if (ph === 'blocks') {
        gAlpha = 1.0;
      } else if (ph === 'blackhole') {
        const fadeElapsed = elapsed - FADE_START;
        const fadeFrac    = Math.min(Math.max(fadeElapsed / FADE_DUR, 0), 1);
        gAlpha = 1.0 - fadeFrac * (1.0 - 0.35);  // 1.0 → 0.35
      } else {
        gAlpha = 0;
      }

      if (gAlpha > 0) {
        drawBlockStream(ctx, cx, cy, elapsed, gAlpha);
      } else {
        ctx.clearRect(0, 0, W, H);
      }

      if (ph !== 'explosion' && ph !== 'tap' && ph !== 'collapse' && ph !== 'bigbang') {
        blockRafRef.current = requestAnimationFrame(draw);
      }
    };
    const ctx = canvas.getContext('2d')!;
    blockRafRef.current = requestAnimationFrame(draw);
    return () => { if (blockRafRef.current) cancelAnimationFrame(blockRafRef.current); };
  }, []);

  // ── SCENE 2: blackhole canvas — starts from mount so BH appears early ──
  // Intensity ramps 0→0.3 during blocks phase, then 0.3→1 during blackhole
  useEffect(() => {
    const canvas = bhCanvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const BLOCKS_DUR = 5000;  // must match phase timer t1
    const BH_DUR     = 4400;  // duration of blackhole phase

    const ctx = canvas.getContext('2d')!;
    let startTime: number | null = null;

    const loop = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      // Stop drawing once we leave blocks/blackhole
      const ph = phaseRef.current;
      if (ph === 'explosion' || ph === 'tap' || ph === 'collapse' || ph === 'bigbang') {
        ctx.clearRect(0, 0, W, H);
        return;
      }

      // Intensity: gentle ramp during blocks, full ramp during blackhole
      let intensity: number;
      if (elapsed < BLOCKS_DUR) {
        intensity = (elapsed / BLOCKS_DUR) * 0.32;
      } else {
        intensity = 0.32 + Math.min((elapsed - BLOCKS_DUR) / BH_DUR, 1) * 0.68;
      }

      drawBlackholeScene(ctx, cx, cy, elapsed, intensity);
      bhRafRef.current = requestAnimationFrame(loop);
    };
    bhRafRef.current = requestAnimationFrame(loop);
    return () => { if (bhRafRef.current) cancelAnimationFrame(bhRafRef.current); };
  }, []);  // runs once on mount

  // ── SCENE 3b: bigbang canvas ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'bigbang') return;
    const canvas = bbCanvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const BB_DUR = 3000;

    const ctx = canvas.getContext('2d')!;
    bbStartRef.current = null;

    const loop = (ts: number) => {
      if (!bbStartRef.current) bbStartRef.current = ts;
      const elapsed = ts - bbStartRef.current;
      drawBigbang(ctx, cx, cy, elapsed, BB_DUR);
      if (elapsed < BB_DUR + 200) {
        bbRafRef.current = requestAnimationFrame(loop);
      } else {
        if (!bbDoneRef.current) {
          bbDoneRef.current = true;
          onComplete();
        }
      }
    };
    bbRafRef.current = requestAnimationFrame(loop);
    return () => { if (bbRafRef.current) cancelAnimationFrame(bbRafRef.current); };
  }, [phase, onComplete]);

  // ── tap handler ────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase !== 'tap') return;
    setPhase('collapse');
    setTimeout(() => setPhase('bigbang'), 1100);
  }, [phase]);

  // ── explosion shards ───────────────────────────────────────────────────
  const shards = (() => {
    const r = makePrng(55);
    return Array.from({ length: 40 }, (_, i) => ({
      angle: (i / 40) * Math.PI * 2 + r() * 0.3,
      dist:  160 + r() * 200,
      size:  3 + Math.floor(r() * 10),
      delay: r() * 0.2,
    }));
  })();

  // ─── render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Chromatic aberration overlay (CSS) */}
      <div
        ref={aberRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background: 'linear-gradient(90deg, rgba(255,0,60,0.12) 0%, transparent 35%, transparent 65%, rgba(0,80,255,0.12) 100%)',
          mixBlendMode: 'screen',
          zIndex: 50,
        }}
      />

      {/* Shake wrapper */}
      <div ref={shakeRef} className="absolute inset-0 flex items-center justify-center">

        {/* SCENE 1: continuous block stream canvas */}
        <canvas
          ref={blockCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        />

        {/* SCENE 1→2: black seed dot growing at center (stays through blackhole) */}
        {(phase === 'blocks' || phase === 'blackhole') && (
          <motion.div
            className="absolute rounded-full bg-black pointer-events-none"
            style={{ zIndex: 3 }}
            initial={{ width: 0, height: 0 }}
            animate={{ width: BH_R * 2, height: BH_R * 2 }}
            transition={{ duration: 2.5, ease: 'easeIn' }}
          />
        )}

        {/* SCENE 2: blackhole canvas */}
        <canvas
          ref={bhCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100%', height: '100%',
            opacity: (phase === 'blocks' || phase === 'blackhole') ? 1 : 0,
            transition: 'opacity 0.4s ease',
            zIndex: 5,
          }}
        />

        {/* SCENE 2→3: explosion burst */}
        <AnimatePresence>
          {phase === 'explosion' && (
            <>
              {/* Expanding rings */}
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={`er${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    border: `${Math.max(1, 4 - i)}px solid rgba(255,255,255,${0.9 - i * 0.15})`,
                    boxShadow: `0 0 ${12 + i * 16}px rgba(255,255,255,${0.55 - i * 0.1})`,
                    zIndex: 15,
                  }}
                  initial={{ width: BH_R * 2, height: BH_R * 2, opacity: 1 }}
                  animate={{ width: BH_R * 2 + 600 + i * 180, height: BH_R * 2 + 600 + i * 180, opacity: 0 }}
                  transition={{ duration: 0.7 + i * 0.08, delay: i * 0.04, ease: 'easeOut' }}
                />
              ))}
              {/* White flash */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 20%, transparent 60%)', zIndex: 14 }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 1100, height: 1100, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              {/* Shards */}
              {shards.map(({ angle, dist, size, delay }, i) => (
                <motion.div
                  key={`sh${i}`}
                  className="absolute pointer-events-none rounded-sm"
                  style={{ width: size, height: size, background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.9)', zIndex: 13 }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.1 }}
                  transition={{ duration: 0.95, delay, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* SCENE 3a: calm tap sphere */}
        <AnimatePresence>
          {phase === 'tap' && (
            <motion.div
              key="tap-sphere"
              className="absolute flex items-center justify-center"
              style={{ zIndex: 20 }}
              initial={{ opacity: 0, scale: 0.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Pulse rings */}
              {[260, 325, 400].map((sz, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: sz, height: sz, border: `1px solid rgba(255,255,255,${0.18 - i * 0.04})` }}
                  animate={{ scale: [1, 1.07 + i * 0.03, 1], opacity: [0.5 - i * 0.1, 0.07, 0.5 - i * 0.1] }}
                  transition={{ duration: 2.2 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                />
              ))}
              {/* Sphere */}
              <motion.div
                onClick={handleTap}
                className="relative rounded-full cursor-pointer select-none"
                style={{
                  width: TAP_SZ, height: TAP_SZ,
                  background: 'radial-gradient(circle at 38% 32%, rgba(35,35,35,1) 0%, rgba(8,8,8,1) 55%, #000 100%)',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.18), 0 0 50px rgba(255,255,255,0.12), inset 0 0 60px rgba(0,0,0,0.95)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 2px rgba(255,255,255,0.15), 0 0 45px rgba(255,255,255,0.10), inset 0 0 60px rgba(0,0,0,0.95)',
                    '0 0 0 2px rgba(255,255,255,0.45), 0 0 90px rgba(255,255,255,0.28), inset 0 0 60px rgba(0,0,0,0.95)',
                    '0 0 0 2px rgba(255,255,255,0.15), 0 0 45px rgba(255,255,255,0.10), inset 0 0 60px rgba(0,0,0,0.95)',
                  ],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="text-white/55 text-xs font-bold tracking-[0.3em]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >TAP</motion.span>
                  <motion.span
                    className="text-white/35 text-[9px] tracking-[0.2em] mt-1.5"
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.25 }}
                  >解放する</motion.span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCENE 3a→3b: collapse — sphere imploding */}
        <AnimatePresence>
          {phase === 'collapse' && (
            <motion.div
              key="collapse"
              className="absolute flex items-center justify-center"
              style={{ zIndex: 25 }}
            >
              {/* Sphere shrinks to nothing */}
              <motion.div
                className="rounded-full"
                style={{
                  background: 'radial-gradient(circle at 38% 32%, rgba(35,35,35,1) 0%, #000 100%)',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.3)',
                }}
                initial={{ width: TAP_SZ, height: TAP_SZ, opacity: 1 }}
                animate={{ width: 0, height: 0, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.6, 0, 1, 0.7] }}
              />
              {/* Implosion rings converging inward */}
              {[280, 340, 420].map((sz, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{ border: `${2 - i * 0.5}px solid rgba(255,255,255,${0.7 - i * 0.15})` }}
                  initial={{ width: sz, height: sz, opacity: 0.8 }}
                  animate={{ width: 0, height: 0, opacity: 0 }}
                  transition={{ duration: 0.65, delay: i * 0.06, ease: 'easeIn' }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCENE 3b: bigbang canvas */}
        <canvas
          ref={bbCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100%', height: '100%',
            opacity: phase === 'bigbang' ? 1 : 0,
            zIndex: 30,
          }}
        />

      </div>

      {/* Global flash layer for explosion */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,200,200,0.4) 40%, transparent 70%)',
          zIndex: 16,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'explosion' ? [0, 1, 0] : 0 }}
        transition={{ duration: 0.5, times: [0, 0.1, 1] }}
      />

      {/* Collapse flash */}
      <AnimatePresence>
        {phase === 'collapse' && (
          <motion.div
            key="cflash"
            className="absolute inset-0 pointer-events-none"
            style={{ background: '#fff', zIndex: 28 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.5, delay: 0.5, times: [0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
