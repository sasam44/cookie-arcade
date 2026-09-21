"use client";

import { useEffect, useRef } from "react";

/**
 * High-performance custom cursor.
 *
 - Position updates via direct DOM mutation (no React re-render).
 - Cursor element is moved with `transform: translate3d()` — GPU-accelerated, no layout reflow.
 - Crumbs spawned via DOM injection (also no React render).
 - Hover/click state mutated via `dataset` attribute + CSS variable (no React state).
 *
 * Performance budget: every mousemove mutates <cursor>.style.transform once.
 * Crumbs are spawned at most every 60ms.
 */
export function CookieCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastTrailRef = useRef(0);
  const enabledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      document.body.style.cursor = "";
      return;
    }
    enabledRef.current = true;
    document.body.style.cursor = "none";
    // Hide the cursor on the iframe preview where pointer events may be off.
    document.documentElement.style.cursor = "none";

    let lastX = 0;
    let lastY = 0;
    let rafPending = false;

    // RAF-throttled position update — coalesce multiple mousemove events into one paint.
    function schedule() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        const c = cursorRef.current;
        if (!c) return;
        c.style.transform = `translate3d(${lastX}px, ${lastY}px, 0)`;
      });
    }

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      schedule();
      // Crumb throttle
      const now = performance.now();
      if (now - lastTrailRef.current > 60) {
        lastTrailRef.current = now;
        spawnCrumb(lastX, lastY);
      }
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInteractive = !!target.closest(
        'button, a, [role="button"], input, textarea, select, label, [data-cursor="hover"]'
      );
      const c = cursorRef.current;
      if (c) c.dataset.hover = isInteractive ? "1" : "0";
    }

    function onDown() {
      const c = cursorRef.current;
      if (c) c.dataset.click = "1";
    }
    function onUp() {
      const c = cursorRef.current;
      if (c) c.dataset.click = "0";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="cursor-cookie"
      data-hover="0"
      data-click="0"
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width="28" height="28">
        <defs>
          <radialGradient id="ccDough" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#ffe7b5" />
            <stop offset="60%" stopColor="#fcb752" />
            <stop offset="100%" stopColor="#d97a18" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#ccDough)" />
        <ellipse cx="11" cy="10" rx="3.2" ry="2" fill="white" opacity="0.4" />
        <ellipse cx="11" cy="13" rx="1.6" ry="1.2" fill="#3a1f08" />
        <ellipse cx="20" cy="11" rx="1.4" ry="1.6" fill="#3a1f08" />
        <ellipse cx="22" cy="19" rx="1.6" ry="1.2" fill="#3a1f08" />
        <ellipse cx="13" cy="20" rx="1.4" ry="1.6" fill="#3a1f08" />
        <ellipse cx="18" cy="22" rx="1.2" ry="1" fill="#3a1f08" />
      </svg>
    </div>
  );
}

// ---- helpers (module-scoped, no React) ----

function spawnCrumb(x: number, y: number) {
  const crumb = document.createElement("div");
  crumb.className = "cursor-trail";
  const size = 5 + Math.random() * 6;
  // Random drift direction for a more organic look
  const dx = (Math.random() - 0.5) * 10;
  const dy = (Math.random() - 0.5) * 10;
  crumb.style.cssText = `
    width:${size}px;
    height:${size}px;
    left:${x + dx}px;
    top:${y + dy}px;
  `;
  document.body.appendChild(crumb);
  // Remove after the trail-fade animation finishes.
  setTimeout(() => crumb.remove(), 950);
}
