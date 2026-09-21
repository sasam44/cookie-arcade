"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sound";

export function SoundToggle() {
  const [muted, setLocalMuted] = useState(false);

  useEffect(() => {
    setLocalMuted(isMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setLocalMuted(next);
    try { localStorage.setItem("cookie-arcade:muted", JSON.stringify(next)); } catch {}
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cookie-arcade:muted");
      if (saved) { setMuted(JSON.parse(saved) === true); setLocalMuted(JSON.parse(saved) === true); }
    } catch {}
  }, []);

  return (
    <button
      onClick={toggle}
      title={muted ? "Unmute sounds" : "Mute sounds"}
      className="btn-cute grid h-9 w-9 place-items-center rounded-full border-2 border-cookie-500/40 bg-dough-900/60 text-cookie-200 hover:border-cookie-300 hover:text-cookie-100"
    >
      <span className="text-base">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}
