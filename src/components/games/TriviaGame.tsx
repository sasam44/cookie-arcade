"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

import { buildMemo } from "@/lib/arcade";
import { COOKIE_CHAIN, TRIVIA_REWARD_COOK } from "@/lib/config";
import { explorerTx, shortAddress } from "@/lib/format";
import { Confetti } from "@/components/Confetti";
import { WalletPromptOverlay } from "@/components/WalletPromptOverlay";
import { sfx } from "@/lib/sound";

type Phase = "idle" | "building" | "signing" | "sending" | "confirming" | "confirmed" | "sent" | "error";

interface TriviaQuestion {
  q: string;
  options: string[];
  correct: number;
  explain?: string;
}

const POOL: TriviaQuestion[] = [
  { q: "What is the native token of Cookie Chain?", options: ["COOK", "SOL", "USDC", "GORI"], correct: 0, explain: "COOK = So1111…112 on Cookie Chain." },
  { q: "Which RPC powers the Cookie Chain mainnet?", options: ["api.mainnet-beta.solana.com", "rpc.cookiescan.io", "cookiechain.dev/rpc", "rpc.cookiedao.org"], correct: 1, explain: "All cookiescan.io subdomains share the same indexer + RPC." },
  { q: "What wallet is REQUIRED by the Cookie Chain bounty spec?", options: ["Phantom", "Backpack", "Nightly", "Solflare"], correct: 2, explain: "Nightly is the preferred wallet per the bounty brief." },
  { q: "Which feature makes Cookie Chain stand out for builders?", options: ["Proof-of-Work consensus", "Sub-second finality + ~$0.001 fees", "EVM compatibility", "Mandatory KYC"], correct: 1, explain: "Sub-second finality + minimal tx fees are highlighted in the bounty." },
  { q: "What is the Cookie Chain NFT marketplace called?", options: ["Magic Eden", "Tensor", "Baked Bazaar", "OpenSea"], correct: 2, explain: "Baked Bazaar — a Metaplex Auction House fork at hausS13j…" },
  { q: "Which program is already deployed for SPL memos on Cookie Chain?", options: ["MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"], correct: 0, explain: "SPL Memo v2 — free to call, no deploy needed." },
  { q: "What's the explorer for Cookie Chain transactions?", options: ["solscan.io", "etherscan.io", "cookiescan.io", "cookie.explorer"], correct: 2, explain: "cookiescan.io indexes the entire chain." },
  { q: "Cookie Chain's auction-house program id (NFT marketplace) starts with…", options: ["hausS13j…", "metaqbxx…", "TokenkegQ…", "whirLbMi…"], correct: 0, explain: "hausS13j… = Baked Bazaar (Metaplex Auction House fork)." },
];

function dayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function questionForDay(): TriviaQuestion {
  const key = dayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return POOL[hash % POOL.length];
}

export function TriviaGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const question = useMemo(() => questionForDay(), []);
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [timings, setTimings] = useState<{ build: number; sign: number; send: number; confirm: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const isCorrect = picked != null && picked === question.correct;

  async function submit(answer: number) {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.sendTransaction) {
      setError("Connect your Nightly wallet first.");
      setPhase("error");
      return;
    }
    setPicked(answer);
    setError(null);
    setLastSig(null);
    sfx.click();
    const tBuildStart = performance.now();
    try {
      setPhase("building");
      const isRight = answer === question.correct;
      const memo = buildMemo("trivia", isRight ? "correct" : "wrong", { q: question.correct, a: answer });
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
        console.warn("[trivia] wallet.sendTransaction failed, falling back:", sendErr?.message);
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
        const st = await pollStatus(connection, signature);
        if (st?.err) throw new Error("On-chain error: " + JSON.stringify(st.err));
      }
      const tConfirmed = performance.now();

      setTimings({ build: Math.round(tBuilt - tBuildStart), sign: Math.round(tSigned - tBuilt), send: Math.round(tSent - tSigned), confirm: Math.round(tConfirmed - tSent) });
      setPhase("confirmed");

      // Sound + confetti feedback
      if (isRight) {
        sfx.triviaCorrect();
        setShowConfetti(true);
      } else {
        sfx.triviaWrong();
      }
    } catch (e: any) {
      console.error("[trivia]", e);
      sfx.triviaWrong();
      setError(pretty(e));
      setPhase("error");
    }
  }

  return (
    <>
      <Confetti active={showConfetti} onAnimationEnd={() => setShowConfetti(false)} count={50} />
      <WalletPromptOverlay phase={phase} />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card-cute p-6">
          <div className="text-[10px] uppercase tracking-widest text-cookie-300">Daily Trivia · {dayKey()}</div>
          <div className="mt-1 font-display text-2xl text-cookie-100">Prove you know Cookie Chain.</div>
          <p className="mt-2 text-sm text-cookie-200/80">
            Pick the right answer → submit a memo tx. Every correct answer is a real SPL Memo v2 instruction on
            the chain. Cost: ~0.001 COOK (just the tx fee).
          </p>
          <div className="mt-5 rounded-2xl border-2 border-cherry-500/20 bg-dough-900/40 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">Today's question</div>
            <div className="mt-2 font-display text-xl font-bold text-cookie-100">{question.q}</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {question.options.map((opt, i) => {
                const disabled = phase === "building" || phase === "signing" || phase === "sending" || phase === "confirming" || (picked != null && phase !== "idle" && phase !== "error");
                const isPicked = picked === i;
                const showCorrect = picked != null && i === question.correct;
                const showWrong = isPicked && i !== question.correct;
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => submit(i)}
                    className={`btn-cute rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
                      showCorrect
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-100"
                        : showWrong
                        ? "border-rose-400 bg-rose-500/15 text-rose-100"
                        : isPicked
                        ? "border-cookie-300 bg-cookie-500/20 text-cookie-100"
                        : "border-cookie-500/30 bg-dough-800/60 text-cookie-200 hover:border-cookie-300 hover:text-cookie-100"
                    } disabled:opacity-50`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Option {String.fromCharCode(65 + i)}</div>
                    <div className="mt-1 font-display font-bold">{opt}</div>
                  </button>
                );
              })}
            </div>
            {picked != null && phase === "confirmed" ? (
              <div className={`mt-4 rounded-xl border-2 p-3 text-sm ${isCorrect ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-rose-500/40 bg-rose-500/10 text-rose-200"}`}>
                {isCorrect ? `✓ Correct! Your answer is now on-chain.` : `✗ Not quite. The correct answer was "${question.options[question.correct]}". ${question.explain ?? ""}`}
              </div>
            ) : null}
            {error ? <div className="mt-3 rounded-xl border-2 border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div> : null}
          </div>
        </div>

        <TxStatus phase={phase} error={error} lastSig={lastSig} timings={timings} reward={isCorrect ? TRIVIA_REWARD_COOK : 0} correct={isCorrect && phase === "confirmed"} />
      </div>
    </>
  );
}

function TxStatus({ phase, error, lastSig, timings, reward, correct }: {
  phase: Phase; error: string | null; lastSig: string | null;
  timings: { build: number; sign: number; send: number; confirm: number } | null;
  reward: number; correct: boolean;
}) {
  if (phase === "idle" && !lastSig) {
    return (
      <div className="card-warm p-5 text-sm text-cookie-200/70">
        Pick an answer to submit a memo tx. Your selection (and whether it's correct) will be written on-chain.
      </div>
    );
  }
  return (
    <div className={`card-cute p-5 text-sm ${correct ? "border-emerald-500/40" : phase === "error" ? "border-rose-500/40" : "border-cookie-500/30"}`}>
      {phase === "error" ? (
        <div className="text-rose-300">
          <div className="font-display text-base font-bold">✗ Transaction failed</div>
          <div className="mt-1 text-xs">{error}</div>
        </div>
      ) : correct ? (
        <div className="text-emerald-300">
          <div className="font-display text-base font-bold">✓ Correct! Tx confirmed in {timings?.confirm ?? 0} ms</div>
          <div className="mt-1 text-xs text-emerald-200/80">Memo written to chain.</div>
        </div>
      ) : (
        <div className="text-cookie-200">
          <div className="font-display text-base font-bold">{phase === "confirmed" ? "✓ Answer on-chain" : phaseLabel(phase)}</div>
          <div className="mt-1 text-xs text-cookie-200/70">…</div>
        </div>
      )}
      {timings && (phase === "confirmed" || phase === "sent") ? (
        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-cookie-200/80">
          <Step label="build" ms={timings.build} />
          <Step label="sign" ms={timings.sign} />
          <Step label="send" ms={timings.send} />
          <Step label="confirm" ms={timings.confirm} accent={phase === "confirmed"} />
        </div>
      ) : null}
      {lastSig && typeof lastSig === "string" ? (
        <a href={explorerTx(lastSig)} target="_blank" rel="noopener" className="mt-3 block break-all text-[10px] font-mono text-cookie-300 underline">
          tx {shortAddress(lastSig, 8, 8)} ↗
        </a>
      ) : null}
    </div>
  );
}

function Step({ label, ms, accent }: { label: string; ms: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-cookie-500/20 bg-dough-800/60 px-2 py-1 text-center">
      <div className="text-[9px] uppercase tracking-widest text-cookie-300">{label}</div>
      <div className={`font-display ${accent ? "text-emerald-300" : "text-cookie-100"}`}>{ms} ms</div>
    </div>
  );
}

function phaseLabel(p: Phase) {
  switch (p) {
    case "building": return "Building tx…";
    case "signing": return "Sign in wallet…";
    case "sending": return "Sending…";
    case "confirming": return "Confirming…";
    default: return p;
  }
}

async function pollStatus(connection: any, sig: string, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await connection.getSignatureStatuses([sig], { searchTransactionHistory: true });
      const v = r?.value?.[0];
      if (v) return v;
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

function pretty(e: any): string {
  const msg = e?.message ?? String(e);
  if (msg.includes("User rejected")) return "Wallet rejected the request.";
  if (msg.includes("insufficient") || msg.includes("0x1")) return "Insufficient COOK for the tx fee.";
  if (msg.toLowerCase().includes("failed to send")) return `Failed to send — make sure Nightly is on Cookie Chain (RPC https://rpc.cookiescan.io). Original: ${msg}`;
  return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
}
