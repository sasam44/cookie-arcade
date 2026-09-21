"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

import { buildMemo } from "@/lib/arcade";
import { COOKIE_CHAIN } from "@/lib/config";
import { explorerTx, shortAddress, timeAgo } from "@/lib/format";

type Phase = "idle" | "building" | "signing" | "sending" | "confirming" | "confirmed" | "error";

const TICKET_FEE = 0.05; // COOK
const ROUND_LENGTH_BLOCKS = 100;

export function LotteryGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [timings, setTimings] = useState<{ build: number; sign: number; send: number; confirm: number } | null>(null);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [recentTickets, setRecentTickets] = useState<{ tx: string; t: number }[]>([]);
  const [slot, setSlot] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const t = setInterval(async () => {
      try {
        const epoch = await connection.getEpochInfo();
        if (alive) setSlot(epoch.absoluteSlot);
      } catch {}
    }, 6000);
    return () => { alive = false; clearInterval(t); };
  }, [connection]);

  const blocksUntilDraw = slot != null ? ROUND_LENGTH_BLOCKS - (slot % ROUND_LENGTH_BLOCKS) : null;

  async function buy() {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.sendTransaction) {
      setError("Connect your Nightly wallet first.");
      setPhase("error");
      return;
    }
    setError(null);
    setLastSig(null);
    const tBuildStart = performance.now();
    try {
      setPhase("building");
      const memo = buildMemo("lottery", "ticket", { round, fee: TICKET_FEE, player: wallet.publicKey.toBase58().slice(0, 8) });
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
        console.warn("[lottery] wallet.sendTransaction failed, falling back:", sendErr?.message);
        signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true, maxRetries: 3 });
      }
      const tSent = performance.now();
      setLastSig(signature);

      setPhase("confirming");
      try {
        const conf = await Promise.race([
          connection.confirmTransaction({ signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }, "confirmed"),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("confirm-timeout")), 15000)),
        ]);
        if ((conf as any)?.value?.err) throw new Error("On-chain error: " + JSON.stringify((conf as any).value.err));
      } catch (e: any) {
        const m = e?.message || "";
        if (!m.includes("confirm-timeout")) throw e;
      }
      const tConfirmed = performance.now();

      setTimings({ build: Math.round(tBuilt - tBuildStart), sign: Math.round(tSigned - tBuilt), send: Math.round(tSent - tSigned), confirm: Math.round(tConfirmed - tSent) });
      setPhase("confirmed");
      setTicketCount((n) => n + 1);
      setRecentTickets((prev) => [{ tx: signature, t: Date.now() / 1000 }, ...prev].slice(0, 8));
    } catch (e: any) {
      console.error("[lottery]", e);
      setError(pretty(e));
      setPhase("error");
    }
  }

  function reset() {
    setError(null);
    setLastSig(null);
    setTicketCount(0);
    setRound((r) => r + 1);
    setPhase("idle");
    setTimings(null);
    setRecentTickets([]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-cookie-500/30 bg-gradient-to-br from-dough-700/60 to-dough-800/80 p-6">
        <div className="text-[10px] uppercase tracking-widest text-cookie-300">Cookie Lottery · Round #{round}</div>
        <div className="mt-1 font-display text-2xl text-cookie-100">Buy a ticket. Win the pool.</div>
        <p className="mt-2 text-sm text-cookie-200/80">
          Each ticket = 1 memo tx (~{TICKET_FEE} COOK). Every {ROUND_LENGTH_BLOCKS} blocks, the
          chain rolls a provably-fair draw from the latest blockhash. First ticket in that window
          wins.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Stat label="Round" value={`#${round}`} sub={`slot ${slot ?? "—"}`} />
          <Stat label="Blocks until draw" value={blocksUntilDraw ?? "—"} sub="every 100 blocks" />
          <Stat label="Tickets this round" value={ticketCount} sub={ticketCount > 0 ? "you're in" : "be first"} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={buy}
            disabled={phase !== "idle" && phase !== "confirmed" && phase !== "error"}
            className="rounded-full bg-gradient-to-br from-cookie-400 to-cookie-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-dough-900 shadow transition hover:from-cookie-300 disabled:opacity-50"
          >
            {phase === "building" ? "Building tx…" : phase === "signing" ? "Sign in wallet…" : phase === "sending" ? "Sending…" : phase === "confirming" ? "Confirming…" : `🎟 Buy ticket · ~${TICKET_FEE} COOK`}
          </button>
          <button
            onClick={reset}
            className="rounded-full border border-cookie-500/30 px-4 py-2 text-xs uppercase tracking-widest text-cookie-300 hover:border-cookie-300 hover:text-cookie-100"
          >
            new round
          </button>
        </div>

        {error ? <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div> : null}
        {timings && phase === "confirmed" ? (
          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-cookie-200/80">
            <Step label="build" ms={timings.build} />
            <Step label="sign" ms={timings.sign} />
            <Step label="send" ms={timings.send} />
            <Step label="confirm" ms={timings.confirm} accent />
          </div>
        ) : null}
        {lastSig ? (
          <a href={explorerTx(lastSig)} target="_blank" rel="noopener" className="mt-3 block break-all text-[10px] text-cookie-300 underline">
            tx {lastSig.slice(0, 24)}…{lastSig.slice(-12)} ↗
          </a>
        ) : null}
      </div>

      <div className="rounded-3xl border border-cookie-500/20 bg-dough-700/40 p-5">
        <div className="text-[10px] uppercase tracking-widest text-cookie-300">Your tickets · round #{round}</div>
        <div className="mt-1 font-display text-lg text-cookie-100">Recent plays</div>
        <ul className="mt-3 space-y-1">
          {recentTickets.length === 0 ? (
            <li className="py-3 text-xs text-cookie-200/60">No tickets yet — buy one to enter the draw.</li>
          ) : (
            recentTickets.map((t) => (
              <li key={t.tx} className="flex items-center justify-between rounded-xl border border-cookie-500/15 bg-dough-900/40 px-3 py-2 text-xs">
                <a href={explorerTx(t.tx)} target="_blank" rel="noopener" className="font-mono text-cookie-200 hover:text-cookie-300">
                  {shortAddress(t.tx, 6, 6)}
                </a>
                <span className="text-cookie-200/70">{timeAgo(t.t)}</span>
              </li>
            ))
          )}
        </ul>
        <div className="mt-4 text-[10px] text-cookie-200/60">
          Draw logic: at block N = round × {ROUND_LENGTH_BLOCKS}, the lottery takes sha256(latest_blockhash)
          and selects the player whose ticket tx was first seen in that window.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cookie-500/20 bg-dough-900/40 p-3">
      <div className="text-[9px] uppercase tracking-widest text-cookie-300">{label}</div>
      <div className="mt-1 font-display text-lg text-cookie-100">{value}</div>
      {sub ? <div className="mt-0.5 text-[10px] text-cookie-200/60">{sub}</div> : null}
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
  if (msg.includes("insufficient") || msg.includes("0x1")) return "Insufficient COOK for the ticket fee.";
  if (msg.toLowerCase().includes("failed to send")) return `Failed to send — make sure Nightly is on Cookie Chain (RPC https://rpc.cookiescan.io). Original: ${msg}`;
  return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
}
