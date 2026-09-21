"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: number;
  emoji: string;
  title: string;
  description: string;
  badge?: string;
  duration?: number;
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[10001] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 3500;

  useEffect(() => {
    const id = window.setTimeout(() => setExiting(true), duration);
    const id2 = window.setTimeout(() => onDismiss(), duration + 300);
    return () => { window.clearTimeout(id); window.clearTimeout(id2); };
  }, [duration, onDismiss]);

  return (
    <div className={`pointer-events-auto rounded-2xl border-2 border-cookie-300/50 bg-gradient-to-br from-cookie-500/95 to-cherry-500/95 p-3 shadow-2xl backdrop-blur-md ${exiting ? "toast-out" : "toast-in"}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-dough-900/30 text-3xl shadow-inner">{toast.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-display text-base font-bold text-white">{toast.title}</div>
            {toast.badge ? <span className="badge-pop rounded-full bg-dough-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cookie-100">{toast.badge}</span> : null}
          </div>
          <div className="mt-0.5 text-xs text-cream-100/90">{toast.description}</div>
        </div>
      </div>
    </div>
  );
}
