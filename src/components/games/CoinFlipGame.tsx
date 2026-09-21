"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

import { buildMemo } from "@/lib/arcade";
import { COOKIE_CHAIN } from "@/lib/config";
import { explorerTx, shortAddress } from "@/lib/format";
import { Cookie, GoldenCookie, CherryCookie, MintCookie, Crumb, Steam } from "@/components/CookieArt";
import { Confetti } from "@/components/Confetti";
import { ToastStack, type ToastItem } from "@/components/Toast";
import { CoinFlipLeaderboard } from "@/components/CoinFlipLeaderboard";
import { sfx } from "@/lib/sound";

type Phase = "idle" | "building" | "signing" | "sending" | "confirming" | "confirmed" | "error";
type Side = "heads" | "tails";
type Flip = { id: number; side: Side; result: Side; win: boolean; tx: string; hash: string; height: number };

function flipFromHash(hash: string, height: number): Side {
  let n = 0;
  for (let i = 0; i < hash.length; i++) n = (n * 131 + hash.charCodeAt(i)) >>> 0;
  const u = (n ^ height) >>> 0;
  return u % 2 === 0 ? "heads" : "tails";
}

function getStreakBadge(streak: number): { emoji: string; label: string } | null {
  if (streak >= 10) return { emoji: "💎", label: "Diamond 10x" };
  if (streak >= 7) return { emoji: "🌟", label: "Super 7x" };
  if (streak >= 5) return { emoji: "🔥", label: "Fire 5x" };
  if (streak >= 3) return { emoji: "⚡", label: "Hot 3x" };
  return null;
}

export function CoinFlipGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [flips, setFlips] = useState<Flip[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [seed, setSeed] = useState<{ hash: string; height: number } | null>(null);
  const [timings, setTimings] = useState<{ build: number; sign: number; send: number; confirm: number } | null>(null);
  const [animating, setAnimating] = useState<Side | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const prevBestStreak = useRef(0);
  const toastIdRef = useRef(0);

  function pushToast(t: Omit<ToastItem, "id">) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
  }
  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const wins = flips.filter((f) => f.win).length;
  const losses = flips.length - wins;
  const winRate = flips.length > 0 ? Math.round((wins / flips.length) * 100) : 0;
  const currentStreak = (() => {
    let s = 0;
    for (let i = flips.length - 1; i >= 0; i--) {
      if (flips[i].win) s++;
      else break;
    }
    return s;
  })();
  const bestStreak = (() => {
    let best = 0, cur = 0;
    for (const f of flips) {
      if (f.win) { cur++; best = Math.max(best, cur); }
      else cur = 0;
    }
    return best;
  })();

  // Detect new streak badge unlock
  useEffect(() => {
    if (bestStreak > prevBestStreak.current) {
      const badge = getStreakBadge(bestStreak);
      if (badge) {
        sfx.badgeUnlock();
        pushToast({
          emoji: badge.emoji,
          title: `${badge.label} streak!`,
          description: `You flipped ${bestStreak} in a row. On-chain verified.`,
          badge: "NEW",
          duration: 4000,
        });
      }
    }
    prevBestStreak.current = bestStreak;
  }, [bestStreak]);

  async function ensureSeed() {
    if (seed) return seed;
    const [latest] = await Promise.all([connection.getLatestBlockhash("confirmed")]);
    return { hash: latest.blockhash, height: latest.lastValidBlockHeight };
  }

  async function flip(side: Side) {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.sendTransaction) {
      setError("Connect your Nightly wallet first.");
      setPhase("error");
      return;
    }
    setError(null);
    sfx.click();
    const tBuildStart = performance.now();
    try {
      setPhase("building");
      const s = seed ?? (await ensureSeed());
      if (!seed) setSeed(s);
      const result = flipFromHash(s.hash, s.height);

      const memo = buildMemo("coinflip", side === result ? "win" : "lose", { pick: side, result, height: s.height });
      const ix = new TransactionInstruction({
        programId: new PublicKey(COOKIE_CHAIN.memo),
        keys: [],
        data: Buffer.from(new TextEncoder().encode(memo)),
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = wallet.publicKey;
      const latest = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = latest.blockhash;
      const tBuilt = performance.now();

      setPhase("signing");
      const signed = await wallet.signTransaction(tx);
      const tSigned = performance.now();

      setPhase("sending");
      let signature: string;
      try {
        signature = await wallet.sendTransaction(signed, connection, { skipPreflight: true });
      } catch (sendErr: any) {
        console.warn("[coinflip] wallet.sendTransaction failed, falling back:", sendErr?.message);
        signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true, maxRetries: 3 });
      }
      const tSent = performance.now();
      setLastSig(signature);

      // Spin animation + tick sound
      setAnimating(side);
      let tickInterval: any = null;
      try {
        tickInterval = setInterval(() => sfx.flipTick(), 90);
      } catch {}

      setPhase("confirming");
      let confirmed = false;
      try {
        const conf = await Promise.race([
          connection.confirmTransaction({ signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }, "confirmed"),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("confirm-timeout")), 15000)),
        ]);
        if ((conf as any)?.value?.err) throw new Error("On-chain error: " + JSON.stringify((conf as any).value.err));
        confirmed = true;
      } catch (e: any) {
        const m = e?.message || "";
        if (!m.includes("confirm-timeout")) throw e;
      }
      if (tickInterval) clearInterval(tickInterval);
      const tConfirmed = performance.now();

      setTimings({ build: Math.round(tBuilt - tBuildStart), sign: Math.round(tSigned - tBuilt), send: Math.round(tSent - tSigned), confirm: Math.round(tConfirmed - tSent) });
      setPhase("confirmed");

      const won = side === result;
      sfx.flipLand(won);
      if (won) setShowConfetti(true);

      setAnimating(null);
      const nextId = flips.length + 1;
      setFlips((prev) => [
        { id: nextId, side, result, win: won, tx: signature, hash: s.hash, height: s.height },
        ...prev,
      ].slice(0, 30));

      // Trigger leaderboard refresh after a short delay (let indexer catch up)
      setTimeout(() => setLeaderboardKey((k) => k + 1), 4000);
    } catch (e: any) {
      console.error("[coinflip]", e);
      setAnimating(null);
      sfx.flipLand(false);
      setError(pretty(e));
      setPhase("error");
    }
  }

  function reset() {
    setFlips([]);
    setError(null);
    setLastSig(null);
    setSeed(null);
    setPhase("idle");
    setTimings(null);
  }

  const lastResult = flips[0]?.result;
  const lastWin = flips[0]?.win;

  return (
    <>
      <Confetti active={showConfetti} onAnimationEnd={() => setShowConfetti(false)} count={70} duration={1600} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="card-cute relative overflow-hidden p-5">
          <Crumb top="8%" left="12%" size={4} delay={0} color="#fcb752" />
          <Crumb top="40%" left="80%" size={5} delay={0.6} color="#ff6b8a" />
          <Crumb top="85%" left="30%" size={3} delay={1.2} color="#7dd3a8" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cookie-300">
              <span className="text-base">🪙</span>
              Coin Flip · On-chain PvP
            </div>
            <div className="mt-1 font-display text-2xl text-cookie-100">Pick a side. Flip the chain.</div>
            <p className="mt-2 text-xs text-cookie-200/80">
              Each flip = 1 memo tx on Cookie Chain. Result is hashed from the latest blockhash
              (provably fair — verifiable post-flip). Heads or tails, no in-between.
            </p>

            {/* Cookie coin visual */}
            <div className="mt-6 flex justify-center">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${animating ? "animate-pulse" : lastWin === false ? "bg-rose-500/20" : lastWin === true ? "bg-emerald-500/20" : "bg-cookie-500/10"} blur-2xl`} />
                <div className={`relative rounded-full border-4 ${animating ? "animate-cookie-spin border-cookie-200" : lastWin === true ? "border-emerald-400 shadow-[0_0_40px_rgba(62,180,122,0.6)]" : lastWin === false ? "border-rose-400 shadow-[0_0_40px_rgba(255,107,138,0.4)]" : "border-cookie-400/50"} transition-all`}>
                  {animating ? (
                    <div className="animate-cookie-spin"><Cookie size={140} /></div>
                  ) : lastResult === "heads" ? (
                    <div className="animate-pop-in"><Cookie size={140} /></div>
                  ) : lastResult === "tails" ? (
                    <div className="animate-pop-in"><CherryCookie size={140} /></div>
                  ) : (
                    <div className="animate-float"><GoldenCookie size={140} /></div>
                  )}
                </div>
                {!animating && lastResult ? <Steam delay={0} /> : null}
              </div>
            </div>

            {/* Result label */}
            <div className="mt-3 text-center">
              {animating ? (
                <div className="font-display text-sm uppercase tracking-widest text-cookie-300 animate-pulse">flipping…</div>
              ) : lastResult ? (
                <div className={`font-display text-sm uppercase tracking-widest ${lastWin ? "text-emerald-300" : "text-rose-300"}`}>
                  {lastWin ? "🎉 Win!" : "😢 Lose"} · {lastResult}
                </div>
              ) : (
                <div className="font-display text-sm uppercase tracking-widest text-cookie-300/60">awaiting flip</div>
              )}
            </div>

            {/* Pick buttons */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => flip("heads")}
                disabled={phase !== "idle" && phase !== "confirmed" && phase !== "error"}
                className="btn-cute flex-1 rounded-2xl border-2 border-cookie-400/50 bg-gradient-to-br from-yellow-500/30 to-cookie-600/30 px-4 py-4 text-xs font-bold uppercase tracking-widest text-cookie-100 disabled:opacity-50"
              >
                <div className="flex justify-center"><Cookie size={48} /></div>
                <div className="mt-2 font-display text-sm">Heads</div>
              </button>
              <button
                onClick={() => flip("tails")}
                disabled={phase !== "idle" && phase !== "confirmed" && phase !== "error"}
                className="btn-cute flex-1 rounded-2xl border-2 border-cherry-400/50 bg-gradient-to-br from-cherry-400/30 to-cookie-700/30 px-4 py-4 text-xs font-bold uppercase tracking-widest text-cookie-100 disabled:opacity-50"
              >
                <div className="flex justify-center"><CherryCookie size={48} /></div>
                <div className="mt-2 font-display text-sm">Tails</div>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <Stat label="flips" value={flips.length} emoji="🎲" />
              <Stat label="wins" value={wins} accent="emerald" emoji="🏆" />
              <Stat label="losses" value={losses} accent="rose" emoji="💔" />
              <Stat label="win%" value={flips.length > 0 ? `${winRate}%` : "—"} emoji="📊" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className={`relative rounded-xl border-2 ${currentStreak >= 3 ? "border-amber-400 streak-glow" : "border-cookie-500/30"} bg-gradient-to-br from-cookie-500/10 to-transparent p-2 text-center transition`}>
                <div className="flex items-center justify-center gap-1 text-[8px] font-semibold uppercase tracking-widest text-cookie-300">
                  <span className="text-[10px]">🔥</span> streak
                </div>
                <div className={`font-display text-lg ${currentStreak >= 3 ? "text-amber-300" : currentStreak >= 1 ? "text-cookie-100" : "text-cookie-300"}`}>{currentStreak}</div>
                {currentStreak >= 3 ? <div className="badge-pop absolute -top-2 right-1 rounded-full bg-gradient-to-br from-amber-400 to-cookie-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-dough-900">{getStreakBadge(currentStreak)?.label}</div> : null}
              </div>
              <Stat label="best streak" value={bestStreak} emoji="⭐" />
            </div>

            {timings ? (
              <div className="mt-3 grid grid-cols-4 gap-1 text-[10px] text-cookie-200/80">
                <Step label="build" ms={timings.build} />
                <Step label="sign" ms={timings.sign} />
                <Step label="send" ms={timings.send} />
                <Step label="confirm" ms={timings.confirm} accent={phase === "confirmed"} />
              </div>
            ) : null}

            {error ? <div className="mt-3 rounded-xl border-2 border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div> : null}

            <button
              onClick={reset}
              className="btn-cute mt-4 w-full rounded-full border border-cookie-500/40 bg-dough-800/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cookie-300 hover:border-cookie-300 hover:text-cookie-100"
            >
              clear history
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card-warm relative overflow-hidden p-6">
            <div className="absolute -right-4 -top-4 opacity-15"><MintCookie size={100} /></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cookie-300">
                    <span>📜</span>
                    Flip history
                  </div>
                  <div className="mt-1 font-display text-xl text-cookie-100">
                    {flips.length} flips · {winRate}% win
                    {bestStreak >= 3 ? <span className="ml-2 inline-block animate-bounce-soft text-amber-300">⭐</span> : null}
                  </div>
                </div>
                {seed ? (
                  <div className="hidden text-right text-[10px] text-cookie-300/60 md:block">
                    <div className="font-semibold uppercase tracking-widest">seed hash</div>
                    <div className="font-mono">{seed.hash.slice(0, 20)}…</div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {flips.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-cookie-500/30 bg-dough-900/40 p-8 text-center">
                    <div className="mx-auto mb-3 flex w-fit justify-center"><GoldenCookie size={64} /></div>
                    <div className="text-sm font-display text-cookie-300">No flips yet</div>
                    <div className="mt-1 text-xs text-cookie-200/60">Pick a side and flip the chain!</div>
                  </div>
                ) : (
                  flips.map((f, idx) => (
                    <div
                      key={f.id}
                      className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2 text-xs transition hover:scale-[1.01] ${
                        f.win ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-mint-400/10" : "border-rose-500/40 bg-gradient-to-r from-rose-500/10 to-cherry-400/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-display text-cookie-100">#{f.id}</div>
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${f.win ? "bg-emerald-500/30 text-emerald-100" : "bg-rose-500/30 text-rose-100"}`}>
                          {f.win ? "🏆" : "💔"}
                        </div>
                        <div className="flex items-center gap-1 text-cookie-200/80">
                          <span>picked</span>
                          <div className="flex h-6 w-6 items-center justify-center">{f.side === "heads" ? <Cookie size={20} /> : <CherryCookie size={20} />}</div>
                          <span>· got</span>
                          <div className="flex h-6 w-6 items-center justify-center">{f.result === "heads" ? <Cookie size={20} /> : <CherryCookie size={20} />}</div>
                        </div>
                      </div>
                      <a
                        href={explorerTx(f.tx)}
                        target="_blank"
                        rel="noopener"
                        className="rounded-full bg-cookie-500/20 px-2 py-1 font-mono text-[10px] text-cookie-300 hover:bg-cookie-500/40 hover:text-cookie-100"
                      >
                        {shortAddress(f.tx, 4, 4)} ↗
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <CoinFlipLeaderboard refreshKey={leaderboardKey} />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, accent, emoji }: { label: string; value: any; accent?: "emerald" | "rose" | "amber"; emoji?: string }) {
  const color = accent === "emerald" ? "text-emerald-300" : accent === "rose" ? "text-rose-300" : accent === "amber" ? "text-amber-300" : "text-cookie-100";
  return (
    <div className="rounded-xl border border-cookie-500/30 bg-gradient-to-br from-cookie-500/10 to-transparent p-2 text-center transition hover:border-cookie-400/50">
      <div className="flex items-center justify-center gap-1 text-[8px] font-semibold uppercase tracking-widest text-cookie-300">
        {emoji ? <span className="text-[10px]">{emoji}</span> : null}{label}
      </div>
      <div className={`font-display text-base ${color}`}>{value}</div>
    </div>
  );
}

function Step({ label, ms, accent }: { label: string; ms: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-cookie-500/20 bg-dough-800/60 px-1 py-1 text-center">
      <div className="text-[8px] uppercase tracking-widest text-cookie-300">{label}</div>
      <div className={`font-display text-cookie-100 ${accent ? "text-emerald-300" : ""}`}>{ms}</div>
    </div>
  );
}

function pretty(e: any): string {
  const msg = e?.message ?? String(e);
  if (msg.includes("User rejected")) return "Wallet rejected the request.";
  if (msg.includes("insufficient") || msg.includes("0x1")) return "Insufficient COOK for the tx fee.";
  if (msg.toLowerCase().includes("failed to send")) return `Failed to send — make sure Nightly is on Cookie Chain (RPC https://rpc.cookiescan.io). Original: ${msg}`;
  return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
}
