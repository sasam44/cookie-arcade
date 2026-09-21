"use client";

import { useEffect, useState } from "react";

export function Confetti({ active, onAnimationEnd, count = 60, duration = 1500 }: { active: boolean; onAnimationEnd?: () => void; count?: number; duration?: number }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const colors = ["#fb9a2c", "#ff6b8a", "#7dd3a8", "#7dc7ff", "#ffe7b5", "#3eb47a"];
    const next = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 200,
      size: 6 + Math.random() * 10,
    }));
    setParticles(next);
    const id = window.setTimeout(() => {
      setParticles([]);
      onAnimationEnd?.();
    }, duration + 600);
    return () => window.clearTimeout(id);
  }, [active, count, duration, onAnimationEnd]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
}
