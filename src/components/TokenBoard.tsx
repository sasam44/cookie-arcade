"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPercent, formatUsd, shortAddress } from "@/lib/format";

// Cookiescan API returns nested: { mint, metadata: {name, symbol, logo}, price: {usd, change24h}, marketData: {liquidity, volume24h} }
interface RawToken {
  mint: string;
  metadata?: { name?: string; symbol?: string; logo?: string };
  price?: { usd?: number | string; change24h?: number };
  marketData?: { liquidity?: number; volume24h?: number; marketCap?: number; supply?: number };
}

interface TokenRow {
  mint: string;
  symbol: string;
  name: string;
  priceUsd?: number;
  change24h?: number;
  liquidityUsd?: number;
  volume24h?: number;
  logoURI?: string;
}

interface RawMarket {
  marketId?: string;
  poolAddress?: string;
  baseToken?: { mint?: string; symbol?: string; amount?: number; priceUsd?: number };
  quoteToken?: { mint?: string; symbol?: string; amount?: number; priceUsd?: number };
  liquidityUsd?: number;
  liquidityDisplay?: string;
  volume24h?: number;
  volume24hUsd?: number;
}

interface MarketRow {
  id: string;
  symbolA: string;
  symbolB: string;
  liquidityUsd?: number;
  volume24h?: number;
}

function normalizeToken(raw: RawToken): TokenRow {
  const priceUsd = typeof raw.price?.usd === "string" ? Number(raw.price.usd) : raw.price?.usd;
  const liquidityUsd = raw.marketData?.liquidity;
  return {
    mint: raw.mint,
    symbol: raw.metadata?.symbol ?? shortAddress(raw.mint, 4, 4),
    name: raw.metadata?.name ?? "",
    priceUsd: typeof priceUsd === "number" && !isNaN(priceUsd) ? priceUsd : undefined,
    change24h: typeof raw.price?.change24h === "number" ? raw.price.change24h : undefined,
    liquidityUsd: typeof liquidityUsd === "number" ? liquidityUsd : undefined,
    volume24h: typeof raw.marketData?.volume24h === "number" ? raw.marketData.volume24h : undefined,
    logoURI: raw.metadata?.logo,
  };
}

function normalizeMarket(raw: RawMarket): MarketRow {
  return {
    id: raw.marketId ?? raw.poolAddress ?? Math.random().toString(36),
    symbolA: raw.baseToken?.symbol ?? "TOKEN_A",
    symbolB: raw.quoteToken?.symbol ?? "COOK",
    liquidityUsd: raw.liquidityUsd,
    volume24h: raw.volume24hUsd ?? raw.volume24h,
  };
}

export function TokenBoard() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/cookiescan/api/tokens?page=1&limit=12").then((r) => r.json()).catch((e) => ({ error: e.message })),
      fetch("/api/cookiescan/api/markets?page=1&limit=12").then((r) => r.json()).catch((e) => ({ error: e.message })),
    ]).then(([t, m]) => {
      if (!alive) return;
      const tokensRaw: RawToken[] = Array.isArray(t?.data) ? t.data : [];
      const marketsRaw: RawMarket[] = Array.isArray(m?.markets) ? m.markets : Array.isArray(m?.data) ? m.data : [];
      // Filter out tokens with no price for the table.
      const normalizedTokens = tokensRaw.map(normalizeToken);
      const withPrice = normalizedTokens.filter((t) => t.priceUsd !== undefined);
      // Fall back to all tokens if none have price (still show mint + symbol)
      setTokens(withPrice.length > 0 ? withPrice : normalizedTokens.slice(0, 12));
      setMarkets(marketsRaw.map(normalizeMarket));
      setLoading(false);
      if (tokensRaw.length === 0 && marketsRaw.length === 0) setError("Registry warming up — retry in a moment.");
    });
    return () => { alive = false; };
  }, []);

  const chartData = tokens.slice(0, 8).map((t) => ({
    symbol: t.symbol.slice(0, 8),
    liquidityUsd: t.liquidityUsd ?? 0,
    volume24h: t.volume24h ?? 0,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-warm p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">Registry · Tokens</div>
            <div className="font-display text-xl text-cookie-100">Cookie Chain token board</div>
          </div>
          <div className="text-xs font-semibold text-cookie-300">via Cookiescan DAS</div>
        </div>

        <div className="mt-4 max-h-[480px] overflow-y-auto rounded-2xl border-2 border-cherry-500/20 bg-dough-900/40">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-dough-800 text-xs uppercase tracking-widest text-cookie-200">
              <tr>
                <th className="px-3 py-3 text-left font-bold">#</th>
                <th className="px-3 py-3 text-left font-bold">Token</th>
                <th className="px-3 py-3 text-right font-bold">Price</th>
                <th className="px-3 py-3 text-right font-bold">24h</th>
                <th className="px-3 py-3 text-right font-bold">Liquidity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cherry-500/10">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-3 py-4 text-cookie-200/60">loading…</td>
                  </tr>
                ))
              ) : tokens.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-4 text-cookie-200/60">{error ?? "No tokens found."}</td></tr>
              ) : (
                tokens.slice(0, 12).map((t, i) => (
                  <tr key={t.mint} className="transition hover:bg-cherry-500/10">
                    <td className="px-3 py-3 font-bold text-cookie-300">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {t.logoURI ? (
                          <img src={t.logoURI} alt="" className="h-7 w-7 rounded-full border border-cookie-500/30 bg-cookie-500/10" />
                        ) : (
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-cookie-400 to-cookie-600 text-xs font-bold text-dough-900">{t.symbol.slice(0, 1)}</div>
                        )}
                        <div>
                          <div className="font-display text-base font-bold text-cookie-100">{t.symbol}</div>
                          <div className="font-mono text-[10px] text-cookie-200/60">{shortAddress(t.mint, 5, 5)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-display text-base font-bold text-cookie-100">
                      {t.priceUsd != null ? formatUsd(t.priceUsd, { digits: t.priceUsd < 0.01 ? 8 : 4 }) : "—"}
                    </td>
                    <td className={`px-3 py-3 text-right font-display text-base font-bold ${(t.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {formatPercent(t.change24h ?? null)}
                    </td>
                    <td className="px-3 py-3 text-right font-display text-base text-cookie-200">
                      {t.liquidityUsd != null ? formatUsd(t.liquidityUsd) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-warm p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">Liquidity · Top pools</div>
            <div className="font-display text-xl text-cookie-100">Cookieswap & Cookiebox</div>
          </div>
          <div className="text-xs font-semibold text-cookie-300">via Cookiescan markets</div>
        </div>

        <div className="mt-4 h-56 rounded-2xl border border-cherry-500/20 bg-dough-900/40 p-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="symbol" stroke="#fcb752" fontSize={11} />
                <YAxis stroke="#fcb752" fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: "#1a0a0d", border: "1px solid #ff6b8a", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => formatUsd(Number(v))} />
                <Bar dataKey="liquidityUsd" fill="#ff6b8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-cookie-200/60">No pool data yet</div>
          )}
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border-2 border-cherry-500/20 bg-dough-900/40">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-dough-800 text-xs uppercase tracking-widest text-cookie-200">
              <tr>
                <th className="px-3 py-3 text-left font-bold">Pool</th>
                <th className="px-3 py-3 text-right font-bold">Liquidity</th>
                <th className="px-3 py-3 text-right font-bold">24h vol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cherry-500/10">
              {markets.length === 0 && !loading ? (
                <tr><td colSpan={3} className="px-3 py-4 text-cookie-200/60">Markets index warming up — retry in a moment.</td></tr>
              ) : (
                markets.slice(0, 10).map((m) => (
                  <tr key={m.id} className="transition hover:bg-cherry-500/10">
                    <td className="px-3 py-3 font-display text-base font-bold text-cookie-100">{m.symbolA}/{m.symbolB}</td>
                    <td className="px-3 py-3 text-right font-display text-base text-cookie-200">{formatUsd(m.liquidityUsd ?? null)}</td>
                    <td className="px-3 py-3 text-right font-display text-base text-cookie-200">{formatUsd(m.volume24h ?? null)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
