"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { COOKIE_CHAIN } from "@/lib/config";

interface Sample { i: number; latency: number; tps: number; blockTime: number; }

const MAX_SAMPLES = 30;
const POLL_MS = 6000;

export function NetworkPulse() {
  const { connection } = useConnection();
  const [slot, setSlot] = useState<number | null>(null);
  const [epoch, setEpoch] = useState<number | null>(null);
  const [blockTimeMs, setBlockTimeMs] = useState<number | null>(null);
  const [tps, setTps] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [cookUsd, setCookUsd] = useState<number | null>(null);
  const [health, setHealth] = useState<"ok" | "syncing" | "down">("syncing");
  const [series, setSeries] = useState<Sample[]>([]);

  // Use refs so the polling interval doesn't restart on every state update.
  const counterRef = useRef(0);
  const sampleRef = useRef<Sample | null>(null);

  useEffect(() => {
    let alive = true;
    let intervalId: any = null;

    const sample = async () => {
      const t0 = performance.now();
      try {
        const [epochInfo, perf] = await Promise.all([
          connection.getEpochInfo(),
          connection.getRecentPerformanceSamples(1).catch(() => [] as any[]),
        ]);
        const t1 = performance.now();
        if (!alive) return;
        const newLatency = Math.round(t1 - t0);
        let newTps: number | null = null;
        let newBlock: number | null = null;
        if (perf[0]) {
          newTps = Math.round(perf[0].numTransactions / perf[0].samplePeriodSecs);
          newBlock = Math.round((perf[0].samplePeriodSecs * 1000) / Math.max(1, perf[0].numSlots));
        }
        setEpoch(epochInfo.epoch);
        setSlot(epochInfo.absoluteSlot);
        if (newTps != null) setTps(newTps);
        if (newBlock != null) setBlockTimeMs(newBlock);
        setLatency(newLatency);
        setHealth("ok");

        // Push sample using refs to avoid stale closures
        counterRef.current += 1;
        const sample = { i: counterRef.current, latency: newLatency, tps: newTps ?? 0, blockTime: newBlock ?? 0 };
        sampleRef.current = sample;
        setSeries((s) => {
          const next = [...s, sample].slice(-MAX_SAMPLES);
          return next;
        });
      } catch (e) {
        if (alive) setHealth("down");
      }
      try {
        const r = await fetch("/api/cookiescan/api/cook").then((r) => r.json()).catch(() => null);
        const data = r?.data ?? r;
        if (alive && data?.priceUsd != null) setCookUsd(Number(data.priceUsd));
      } catch {}
    };

    // Run sample once immediately, then on interval.
    sample();
    intervalId = window.setInterval(sample, POLL_MS);
    return () => {
      alive = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [connection]); // ONLY re-run if connection changes (wallet switch / RPC change)

  const avgLatency = series.length > 0 ? Math.round(series.reduce((a, b) => a + b.latency, 0) / series.length) : 0;
  const maxLatency = series.length > 0 ? Math.max(...series.map((s) => s.latency)) : 0;
  const lastSample = series[series.length - 1];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Stat label="RPC Health" value={health === "ok" ? "healthy" : health === "syncing" ? "syncing…" : "down"} tone={health === "ok" ? "good" : health === "down" ? "bad" : "warn"} />
      <Stat label="Slot" value={slot ?? "—"} sub={epoch != null ? `epoch ${epoch}` : ""} />
      <Stat label="Block time" value={blockTimeMs != null ? `${blockTimeMs} ms` : "—"} sub="avg recent" />
      <Stat label="TPS" value={tps ?? "—"} sub="60s avg" />
      <Stat label="Latency" value={latency != null ? `${latency} ms` : "—"} sub="getEpochInfo RTT" />
      <Stat label="COOK / USD" value={cookUsd != null ? `$${cookUsd.toFixed(6)}` : "—"} sub="via Cookiescan DAS" />
      <Stat label="WS endpoint" value="wss.cookiescan.io" sub="ready" />
      <div className="rounded-2xl border-2 border-cherry-500/25 bg-gradient-to-br from-dough-700/40 to-dough-800/60 p-3 md:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-cookie-300">
          <span>RPC latency · TPS (live)</span>
          <span className="text-cookie-200/70">#{series.length}</span>
        </div>
        <div className="mt-2 h-24">
          {series.length === 0 ? (
            <div className="grid h-full place-items-center text-xs text-cookie-200/60">Collecting first sample…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="i" hide />
                <YAxis hide domain={[0, (maxLatency || 1000) * 1.1]} />
                <Tooltip
                  contentStyle={{ background: "#1a0a0d", border: "1px solid #ff6b8a", borderRadius: 12, fontSize: 12, color: "#ffe7b5" }}
                  labelFormatter={(i) => `sample #${i}`}
                  formatter={(v: any, k: any) => [`${v} ms`, k === "latency" ? "latency" : k]}
                />
                <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                  {series.map((s, idx) => (
                    <Cell
                      key={idx}
                      fill={s.latency < 300 ? "#3eb47a" : s.latency < 600 ? "#fcb752" : "#ff6b8a"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-cookie-200/50">
          <span>
            avg {avgLatency} ms · max {maxLatency} ms
            {lastSample ? <> · last <span className={lastSample.latency < 300 ? "text-emerald-300" : lastSample.latency < 600 ? "text-amber-300" : "text-rose-300"}>{lastSample.latency} ms</span></> : null}
          </span>
          <span>{series.length}/{MAX_SAMPLES} samples</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : "text-cookie-100";
  return (
    <div className="rounded-2xl border border-cherry-500/15 bg-gradient-to-br from-cookie-500/5 to-transparent p-4 transition hover:border-cherry-400/40">
      <div className="text-[10px] uppercase tracking-widest text-cookie-300">{label}</div>
      <div className={`mt-1 font-display text-2xl ${color}`}>{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-cookie-200/60">{sub}</div> : null}
    </div>
  );
}
