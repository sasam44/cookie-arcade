"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { COOKIE_CHAIN } from "@/lib/config";
import { formatUsd, shortAddress } from "@/lib/format";

interface RawToken {
  mint: string;
  metadata?: { name?: string; symbol?: string; logo?: string };
  price?: { usd?: number | string; change24h?: number };
  marketData?: { liquidity?: number; volume24h?: number };
}

interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  priceUsd?: number;
  logoURI?: string;
  liquidityUsd?: number;
}

interface QuoteResponse {
  route?: {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    minOutAmount: string;
    priceImpactPct: number;
    feeBps: number;
    dex: string;
    poolAddress: string;
  };
  routes?: any[];
  error?: string;
}

function normalizeToken(raw: RawToken): TokenInfo {
  const priceUsd = typeof raw.price?.usd === "string" ? Number(raw.price.usd) : raw.price?.usd;
  return {
    mint: raw.mint,
    symbol: raw.metadata?.symbol ?? shortAddress(raw.mint, 4, 4),
    name: raw.metadata?.name ?? "",
    priceUsd: typeof priceUsd === "number" && !isNaN(priceUsd) ? priceUsd : undefined,
    logoURI: raw.metadata?.logo,
    liquidityUsd: raw.marketData?.liquidity,
  };
}

export function SwapPanel() {
  const { publicKey, signTransaction, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [inputMint, setInputMint] = useState<string>(COOKIE_CHAIN.cookMint);
  const [outputMint, setOutputMint] = useState<string>("");
  const [amount, setAmount] = useState<string>("0.01");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "signing" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/cookiescan/api/tokens?page=1&limit=30")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const list: RawToken[] = Array.isArray(j?.data) ? j.data : [];
        if (Array.isArray(list)) setTokens(list.map(normalizeToken));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Auto-pick first non-COOK token that has actual liquidity once list arrives
  useEffect(() => {
    if (!outputMint && tokens.length > 0) {
      const candidate = tokens.find((t) => t.mint !== COOKIE_CHAIN.cookMint && t.liquidityUsd && t.liquidityUsd > 0);
      if (candidate) setOutputMint(candidate.mint);
    }
  }, [tokens, outputMint]);

  async function getQuote() {
    setError(null);
    setQuote(null);
    if (!outputMint) { setError("Pick a token to receive."); return; }
    setPhase("loading");
    try {
      const lamports = Math.round(parseFloat(amount || "0") * 1_000_000_000);
      const url = `/api/swap/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${lamports}&slippageBps=100`;
      const j = await fetch(url).then((r) => r.json());
      if (j?.error) {
        setError(j.error);
        setPhase("error");
        return;
      }
      setQuote(j);
      setPhase("idle");
    } catch (e: any) {
      setError(e?.message || "quote failed");
      setPhase("error");
    }
  }

  async function executeSwap() {
    if (!publicKey || !connected || !signTransaction || !sendTransaction) {
      setError("Connect wallet first.");
      setPhase("error");
      return;
    }
    if (!quote?.route) {
      setError("Fetch a quote first.");
      setPhase("error");
      return;
    }
    setError(null);
    setSig(null);
    setPhase("loading");
    try {
      const lamports = Math.round(parseFloat(amount || "0") * 1_000_000_000);
      const built = await fetch(`/api/swap/build?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${lamports}&slippageBps=100&wallet=${publicKey.toBase58()}`).then((r) => r.json());
      if (!built?.txBase64) throw new Error(built?.error || "aggregator returned no tx");

      const buf = Buffer.from(built.txBase64, "base64");
      const { Transaction, VersionedTransaction } = await import("@solana/web3.js");
      setPhase("signing");
      let signature: string;
      try {
        const vtx = VersionedTransaction.deserialize(buf);
        signature = await sendTransaction(vtx, connection, { skipPreflight: true });
      } catch {
        const tx = Transaction.from(buf);
        signature = await sendTransaction(tx, connection, { skipPreflight: true });
      }
      setPhase("sending");
      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }, "confirmed");
      setSig(signature);
      setPhase("done");
    } catch (e: any) {
      console.error("[swap]", e);
      setError(e?.message || "swap failed");
      setPhase("error");
    }
  }

  const inputSym = tokens.find((t) => t.mint === inputMint)?.symbol ?? "COOK";
  const outputSym = tokens.find((t) => t.mint === outputMint)?.symbol ?? "—";
  const outAmount = quote?.route?.outAmount;

  return (
    <div className="card-warm p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">DEX · Cookieswap</div>
          <div className="font-display text-xl text-cookie-100">Swap via Cookieswap (Candy Shop)</div>
        </div>
        <a className="text-xs font-semibold text-cookie-300 underline hover:text-cookie-100" href={COOKIE_CHAIN.swap} target="_blank" rel="noopener">open swap ↗</a>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-cherry-500/20 bg-dough-900/40 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">You pay</div>
          <select value={inputMint} onChange={(e) => setInputMint(e.target.value)} className="mt-2 w-full rounded-xl border border-cookie-500/30 bg-dough-900/60 px-3 py-2.5 text-sm font-bold text-cookie-100 focus:border-cookie-300 focus:outline-none">
            <option value={COOKIE_CHAIN.cookMint}>COOK · So11…1112</option>
            {tokens.filter((t) => t.mint !== COOKIE_CHAIN.cookMint).map((t) => (
              <option key={t.mint} value={t.mint}>{t.symbol} · {shortAddress(t.mint, 4, 4)}</option>
            ))}
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.001"
            className="mt-3 w-full rounded-xl border border-cookie-500/30 bg-dough-900/60 px-4 py-3 font-display text-2xl font-bold text-cookie-100 outline-none focus:border-cookie-300"
          />
        </div>

        <div className="rounded-2xl border-2 border-cherry-500/20 bg-dough-900/40 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">You receive</div>
          <select value={outputMint} onChange={(e) => setOutputMint(e.target.value)} className="mt-2 w-full rounded-xl border border-cookie-500/30 bg-dough-900/60 px-3 py-2.5 text-sm font-bold text-cookie-100 focus:border-cookie-300 focus:outline-none">
            <option value="">— pick a token —</option>
            {tokens.filter((t) => t.mint !== inputMint).map((t) => (
              <option key={t.mint} value={t.mint}>{t.symbol} · {shortAddress(t.mint, 4, 4)}</option>
            ))}
          </select>
          <div className="mt-3 flex h-[58px] items-center justify-between rounded-xl border border-cookie-500/30 bg-dough-900/60 px-4 font-display text-2xl text-cookie-100">
            {outAmount ? (
              <>
                <span className="font-bold">{formatLamports(outAmount)}</span>
                <span className="text-xs text-cookie-200/60">{outputSym}</span>
              </>
            ) : (
              <span className="text-cookie-200/40">— click fetch route</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={getQuote} disabled={!inputMint || !outputMint || phase === "loading"} className="btn-cute rounded-2xl border-2 border-cookie-500/40 bg-dough-900/60 px-5 py-2.5 text-sm font-bold text-cookie-100 hover:border-cookie-300 disabled:opacity-50">
          {phase === "loading" ? "loading…" : "fetch route"}
        </button>
        <button onClick={executeSwap} disabled={!quote?.route || !connected || phase === "loading" || phase === "signing" || phase === "sending"} className="btn-cute rounded-2xl bg-gradient-to-br from-cookie-300 to-cookie-500 px-5 py-2.5 text-sm font-bold text-dough-900 hover:from-cookie-200 hover:to-cookie-400 disabled:opacity-50">
          {phase === "signing" ? "signing…" : phase === "sending" ? "sending…" : "swap"}
        </button>
        {quote?.route ? (
          <div className="text-xs font-semibold text-cookie-200">
            via <span className="text-cookie-300">{quote.route.dex ?? "—"}</span>
            {" · "}
            impact <span className="text-cookie-100">{(quote.route.priceImpactPct * 100).toFixed(2)}%</span>
            {" · "}
            fee <span className="text-cookie-100">{quote.route.feeBps}bps</span>
          </div>
        ) : null}
      </div>

      {error ? <div className="mt-3 rounded-xl border-2 border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}
      {sig ? <div className="mt-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-200">✓ swap confirmed · <a href={`https://cookiescan.io/tx/${sig}`} target="_blank" rel="noopener" className="underline">{shortAddress(sig, 8, 8)} ↗</a></div> : null}
    </div>
  );
}

function formatLamports(s: string | number): string {
  try {
    const n = typeof s === "string" ? BigInt(s) : BigInt(Math.round(s));
    const whole = n / 1_000_000_000n;
    const frac = n % 1_000_000_000n;
    const fracStr = frac.toString().padStart(9, "0").slice(0, 4).replace(/0+$/, "");
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return "—";
  }
}
