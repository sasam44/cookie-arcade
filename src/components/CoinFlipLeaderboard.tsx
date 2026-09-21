"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { COOKIE_CHAIN } from "@/lib/config";
import { explorerAddress, shortAddress } from "@/lib/format";

interface LeaderRow {
  player: string;
  totalFlips: number;
  wins: number;
  losses: number;
  winRate: number;
  bestStreak: number;
  rank: number;
}

/**
 * Read recent coinflip memo txs from the SPL Memo program on Cookie Chain,
 * compute per-player stats, and show top winners.
 */
export function CoinFlipLeaderboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const { connection } = useConnection();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const sigs = await connection.getSignaturesForAddress(new PublicKey(COOKIE_CHAIN.memo), { limit: 200 });
        const memoSigs = sigs.filter((s) => s.memo && s.memo.includes("coinflip"));
        const map = new Map<string, { total: number; wins: number; losses: number; streak: number; best: number }>();
        for (const s of memoSigs) {
          let signer: string | null = null;
          try {
            const tx = await connection.getTransaction(s.signature, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            });
            signer = (tx?.transaction.message as any)?.accountKeys?.[0] ?? null;
          } catch { continue; }
          if (!signer) continue;
          const isWin = s.memo?.includes("win");
          const cur = map.get(signer) ?? { total: 0, wins: 0, losses: 0, streak: 0, best: 0 };
          cur.total++;
          if (isWin) { cur.wins++; cur.streak++; cur.best = Math.max(cur.best, cur.streak); }
          else { cur.losses++; cur.streak = 0; }
          map.set(signer, cur);
        }
        const computed: LeaderRow[] = Array.from(map.entries())
          .map(([player, s]) => ({
            player,
            totalFlips: s.total,
            wins: s.wins,
            losses: s.losses,
            winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
            bestStreak: s.best,
            rank: 0,
          }))
          .filter((r) => r.totalFlips >= 3) // need at least 3 flips to qualify
          .sort((a, b) => b.bestStreak - a.bestStreak || b.wins - a.wins)
          .slice(0, 8)
          .map((r, i) => ({ ...r, rank: i + 1 }));
        if (alive) { setRows(computed); setLoading(false); }
      } catch (e) {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [connection, refreshKey]);

  return (
    <div className="card-warm p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cookie-300">
            <span>🏆</span>
            Coin flip leaderboard
          </div>
          <div className="mt-1 font-display text-lg text-cookie-100">Top players by best streak</div>
        </div>
        <div className="text-[10px] font-mono text-cookie-200/60">from on-chain memos</div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-cherry-500/20 bg-dough-900/40">
        <table className="min-w-full text-sm">
          <thead className="bg-dough-800 text-xs uppercase tracking-widest text-cookie-200">
            <tr>
              <th className="px-3 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">Player</th>
              <th className="px-3 py-2 text-right font-bold">Flips</th>
              <th className="px-3 py-2 text-right font-bold">Win%</th>
              <th className="px-3 py-2 text-right font-bold">Best</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cherry-500/10">
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-3 text-cookie-200/60">Loading from chain…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-3 text-cookie-200/60">No qualified players yet (need ≥3 flips).</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.player} className={`transition hover:bg-cherry-500/10 ${r.rank === 1 ? "bg-gradient-to-r from-cookie-500/10 to-cherry-500/10" : ""}`}>
                  <td className="px-3 py-2 text-base font-bold">
                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : <span className="text-cookie-300">#{r.rank}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <a href={explorerAddress(r.player)} target="_blank" rel="noopener" className="font-mono text-xs font-bold text-cookie-100 hover:text-cookie-300">
                      {shortAddress(r.player, 5, 5)}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-right font-display font-bold text-cookie-100">{r.totalFlips}</td>
                  <td className="px-3 py-2 text-right font-display font-bold text-emerald-300">{r.winRate}%</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 font-display text-base font-bold ${r.bestStreak >= 5 ? "streak-glow bg-amber-500/30 text-amber-100" : r.bestStreak >= 3 ? "bg-cookie-500/30 text-cookie-100" : "bg-dough-800 text-cookie-200"}`}>
                      🔥 {r.bestStreak}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
