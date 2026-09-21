"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

import { loadGlobalFeed, type ArcadeEvent } from "@/lib/arcade";
import { explorerTx, shortAddress, timeAgo } from "@/lib/format";

const GAME_EMOJI: Record<string, string> = {
  trivia: "🎯",
  coinflip: "🪙",
  lottery: "🎰",
};

export function LiveFeed() {
  const { connection } = useConnection();
  const [events, setEvents] = useState<ArcadeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const data = await loadGlobalFeed(connection, { limit: 30 });
        if (alive) {
          setEvents(data);
          setLoading(false);
        }
      } catch (e) {
        if (alive) setLoading(false);
      }
    };
    refresh();
    const id = window.setInterval(refresh, 8000);
    return () => { alive = false; window.clearInterval(id); };
  }, [connection]);

  return (
    <div className="card-warm p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cookie-300">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cherry-400" />
            Live arcade feed
          </div>
          <div className="mt-1 font-display text-lg text-cookie-100">From the chain · last 30 plays</div>
        </div>
        <div className="font-mono text-[10px] text-cookie-200/60">cookie:arcade:v1</div>
      </div>
      {loading ? (
        <div className="mt-4 text-cookie-200/70">Loading…</div>
      ) : events.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-cherry-500/30 bg-dough-900/40 p-4 text-cookie-200/70">No plays yet. Be first to flip / answer / buy a ticket.</div>
      ) : (
        <ul className="mt-4 max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {events.map((e) => (
            <li key={e.signature} className="flex items-center justify-between gap-2 rounded-xl border border-cherry-500/15 bg-gradient-to-r from-cookie-500/5 to-transparent px-3 py-2 text-xs transition hover:border-cherry-400/40 hover:from-cookie-500/10">
              <a href={explorerTx(e.signature)} target="_blank" rel="noopener" className="flex items-center gap-2 font-mono text-cookie-200 hover:text-cookie-100">
                <span className="text-base">{GAME_EMOJI[e.game] ?? "🎮"}</span>
                <span>{shortAddress(e.player, 5, 5)}</span>
              </a>
              <span className="rounded-full bg-cherry-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cherry-400">{e.game}</span>
              <span className="hidden text-cookie-200/70 sm:inline">{e.action}</span>
              <span className="ml-auto text-cookie-200/60">{timeAgo(e.blockTime)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
