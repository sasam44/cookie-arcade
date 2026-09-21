"use client";

/**
 * Hand-crafted SVG cookie illustrations — chunky chocolate chips, soft dough,
 * visible crumbs. Used everywhere in the arcade for personality.
 */

import { CSSProperties } from "react";

export function Cookie({ size = 64, className = "", style, animated = false }: { size?: number; className?: string; style?: CSSProperties; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`cookie ${animated ? "animate-cookie-spin" : ""} ${className}`}
      style={style}
      aria-hidden
    >
      {/* Shadow */}
      <ellipse cx="50" cy="92" rx="38" ry="3" fill="rgba(0,0,0,0.35)" />
      {/* Cookie body */}
      <circle cx="50" cy="50" r="42" fill="url(#doughGrad)" />
      {/* Edge crumb texture */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const x = 50 + Math.cos(a) * 42;
        const y = 50 + Math.sin(a) * 42;
        return <circle key={i} cx={x} cy={y} r={1.6 + (i % 3) * 0.4} fill="#9d580d" opacity={0.5 + (i % 3) * 0.15} />;
      })}
      {/* Surface bumps for texture */}
      {[
        { x: 22, y: 32, r: 3 },
        { x: 70, y: 26, r: 2.4 },
        { x: 78, y: 60, r: 3.2 },
        { x: 28, y: 68, r: 2.8 },
        { x: 50, y: 78, r: 2.4 },
        { x: 38, y: 22, r: 2 },
        { x: 60, y: 42, r: 1.8 },
      ].map((b, i) => (
        <circle key={`b${i}`} cx={b.x} cy={b.y} r={b.r} fill="#fed28b" opacity={0.5} />
      ))}
      {/* Chocolate chips */}
      {[
        { x: 32, y: 40, rx: 5, ry: 4, rot: 18 },
        { x: 58, y: 32, rx: 4.5, ry: 5, rot: -22 },
        { x: 70, y: 56, rx: 5.5, ry: 4, rot: 35 },
        { x: 38, y: 62, rx: 4.8, ry: 5.2, rot: -8 },
        { x: 50, y: 50, rx: 4, ry: 4.5, rot: 12 },
        { x: 24, y: 56, rx: 4.5, ry: 4, rot: -28 },
        { x: 62, y: 70, rx: 5, ry: 4.8, rot: 22 },
      ].map((c, i) => (
        <g key={`c${i}`} transform={`rotate(${c.rot} ${c.x} ${c.y})`}>
          <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill="#3a1f08" />
          <ellipse cx={c.x - 1} cy={c.y - 1} rx={c.rx * 0.4} ry={c.ry * 0.4} fill="#7a4421" opacity={0.6} />
        </g>
      ))}
      {/* Highlight */}
      <ellipse cx="38" cy="32" rx="10" ry="6" fill="white" opacity="0.25" />
      <defs>
        <radialGradient id="doughGrad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffe7b5" />
          <stop offset="40%" stopColor="#fcb752" />
          <stop offset="80%" stopColor="#d97a18" />
          <stop offset="100%" stopColor="#9d580d" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function CherryCookie({ size = 64, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`cookie ${className}`} style={style} aria-hidden>
      <ellipse cx="50" cy="92" rx="38" ry="3" fill="rgba(0,0,0,0.35)" />
      <circle cx="50" cy="52" r="42" fill="url(#cherryDough)" />
      {/* Crumbs */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x = 50 + Math.cos(a) * 42;
        const y = 52 + Math.sin(a) * 42;
        return <circle key={i} cx={x} cy={y} r={1.4 + (i % 2) * 0.4} fill="#9d580d" opacity={0.4} />;
      })}
      {/* Cherry on top */}
      <circle cx="48" cy="30" r="14" fill="url(#cherryGrad)" />
      <ellipse cx="44" cy="25" rx="5" ry="3" fill="white" opacity="0.5" />
      {/* Cherry stem */}
      <path d="M 50 18 Q 60 8 70 12" stroke="#3eb47a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="68" cy="11" rx="4" ry="2.5" fill="#3eb47a" transform="rotate(-20 68 11)" />
      {/* Chips */}
      <ellipse cx="32" cy="56" rx="5" ry="4" fill="#3a1f08" transform="rotate(20 32 56)" />
      <ellipse cx="62" cy="64" rx="4.5" ry="5" fill="#3a1f08" transform="rotate(-15 62 64)" />
      <ellipse cx="40" cy="72" rx="4" ry="4.5" fill="#3a1f08" />
      <defs>
        <radialGradient id="cherryDough" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff5e0" />
          <stop offset="50%" stopColor="#fcb752" />
          <stop offset="100%" stopColor="#9d580d" />
        </radialGradient>
        <radialGradient id="cherryGrad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ff8aa8" />
          <stop offset="60%" stopColor="#e94560" />
          <stop offset="100%" stopColor="#a01838" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function MintCookie({ size = 64, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`cookie ${className}`} style={style} aria-hidden>
      <ellipse cx="50" cy="92" rx="38" ry="3" fill="rgba(0,0,0,0.35)" />
      <circle cx="50" cy="50" r="42" fill="url(#mintDough)" />
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const x = 50 + Math.cos(a) * 42;
        const y = 50 + Math.sin(a) * 42;
        return <circle key={i} cx={x} cy={y} r={1.4 + (i % 2) * 0.4} fill="#9d580d" opacity={0.4} />;
      })}
      {/* Mint chips */}
      {[
        { x: 30, y: 35, r: 4 },
        { x: 56, y: 28, r: 3.5 },
        { x: 68, y: 52, r: 4 },
        { x: 38, y: 58, r: 3.8 },
        { x: 50, y: 66, r: 3.5 },
        { x: 26, y: 60, r: 3 },
      ].map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={c.r} fill="#3eb47a" />
          <circle cx={c.x - 1} cy={c.y - 1} r={c.r * 0.5} fill="#a8e8c4" opacity={0.6} />
        </g>
      ))}
      <ellipse cx="38" cy="32" rx="10" ry="6" fill="white" opacity="0.25" />
      <defs>
        <radialGradient id="mintDough" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff5e0" />
          <stop offset="40%" stopColor="#fdd9a8" />
          <stop offset="100%" stopColor="#9d580d" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function GoldenCookie({ size = 64, className = "", style, animated = false }: { size?: number; className?: string; style?: CSSProperties; animated?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`cookie ${animated ? "animate-cookie-spin" : ""} ${className}`} style={style} aria-hidden>
      {/* Glow halo */}
      <circle cx="50" cy="50" r="48" fill="url(#goldGlow)" opacity={0.6} className="animate-glow" />
      <ellipse cx="50" cy="92" rx="38" ry="3" fill="rgba(0,0,0,0.35)" />
      <circle cx="50" cy="50" r="40" fill="url(#goldDough)" />
      {/* Stars */}
      <text x="50" y="56" fontSize="22" textAnchor="middle" fill="#fff5e0" opacity={0.9}>✦</text>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x = 50 + Math.cos(a) * 30;
        const y = 50 + Math.sin(a) * 30;
        return <text key={i} x={x} y={y + 4} fontSize="10" textAnchor="middle" fill="#ffe7b5" opacity={0.8}>✦</text>;
      })}
      <defs>
        <radialGradient id="goldDough" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff8e7" />
          <stop offset="40%" stopColor="#fcb752" />
          <stop offset="100%" stopColor="#9d580d" />
        </radialGradient>
        <radialGradient id="goldGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(252,183,82,0.6)" />
          <stop offset="100%" stopColor="rgba(252,183,82,0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Background tile of scattered cookies */
export function CookieField({ count = 14 }: { count?: number }) {
  const cookies = [
    { type: "choc", top: "8%", left: "5%", size: 56, rot: -12, op: 0.18 },
    { type: "cherry", top: "20%", left: "92%", size: 48, rot: 18, op: 0.15 },
    { type: "mint", top: "65%", left: "8%", size: 64, rot: 25, op: 0.16 },
    { type: "choc", top: "78%", left: "88%", size: 52, rot: -20, op: 0.18 },
    { type: "cherry", top: "45%", left: "96%", size: 44, rot: 8, op: 0.14 },
    { type: "mint", top: "12%", left: "50%", size: 38, rot: -30, op: 0.12 },
    { type: "choc", top: "88%", left: "40%", size: 42, rot: 15, op: 0.15 },
    { type: "choc", top: "32%", left: "3%", size: 36, rot: -8, op: 0.13 },
    { type: "cherry", top: "55%", left: "94%", size: 50, rot: -22, op: 0.16 },
    { type: "mint", top: "92%", left: "70%", size: 46, rot: 12, op: 0.14 },
    { type: "choc", top: "5%", left: "75%", size: 32, rot: 25, op: 0.12 },
    { type: "cherry", top: "75%", left: "20%", size: 40, rot: -18, op: 0.13 },
    { type: "mint", top: "38%", left: "92%", size: 38, rot: 30, op: 0.12 },
    { type: "choc", top: "60%", left: "2%", size: 34, rot: -25, op: 0.13 },
  ].slice(0, count);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {cookies.map((c, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            top: c.top,
            left: c.left,
            opacity: c.op,
            transform: `rotate(${c.rot}deg)`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${4 + (i % 3)}s`,
          }}
        >
          {c.type === "choc" ? <Cookie size={c.size} /> : c.type === "cherry" ? <CherryCookie size={c.size} /> : <MintCookie size={c.size} />}
        </div>
      ))}
    </div>
  );
}

/** Small crumb particle */
export function Crumb({ size = 12, top, left, delay = 0, color = "#fb9a2c" }: { size?: number; top: string; left: string; delay?: number; color?: string }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        top,
        left,
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size}px ${color}`,
        animation: `sparkle 1.8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.7,
      }}
    />
  );
}

/** Steam puff that rises from a cookie */
export function Steam({ delay = 0 }: { delay?: number }) {
  return (
    <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2">
      {[0, 0.5, 1].map((d, i) => (
        <div
          key={i}
          className="steam absolute h-2 w-2 rounded-full bg-cream-100/40"
          style={{
            left: `${-6 + i * 6}px`,
            top: 0,
            animationDelay: `${delay + i * 0.5}s`,
            ["--sx" as any]: `${-10 + i * 10}px`,
          }}
        />
      ))}
    </div>
  );
}
