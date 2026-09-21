"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { COOKIE_CHAIN } from "@/lib/config";
import { explorerAddress, lamportsToCook, shortAddress } from "@/lib/format";
import { Cookie, CherryCookie, Crumb } from "./CookieArt";

export function WalletPanel() {
  const { publicKey, wallet, connected } = useWallet();
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const bal = await connection.getBalance(publicKey, "confirmed");
        if (alive) setBalance(bal);
      } catch {}
      try {
        const epoch = await connection.getEpochInfo();
        if (alive) setNetwork(`epoch ${epoch.epoch} · slot ${epoch.absoluteSlot}`);
      } catch {}
    })();
    const id = window.setInterval(async () => {
      try {
        const bal = await connection.getBalance(publicKey, "confirmed");
        if (alive) setBalance(bal);
      } catch {}
    }, 10000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [connected, publicKey, connection]);

  const isNightly = wallet?.adapter?.name?.toLowerCase().includes("nightly");

  return (
    <div className="card-cute relative overflow-hidden p-6">
      {/* Floating cookie decorations */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 animate-float opacity-30">
        <Cookie size={120} />
      </div>
      <div className="absolute -bottom-6 right-44 animate-bounce-soft opacity-40" style={{ animationDelay: "0.6s" }}>
        <CherryCookie size={56} />
      </div>
      <Crumb top="10%" left="40%" size={5} delay={0} color="#fcb752" />
      <Crumb top="80%" left="60%" size={4} delay={0.8} color="#ff6b8a" />
      <Crumb top="50%" left="30%" size={3} delay={1.4} color="#7dd3a8" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="animate-bounce-soft">
            <Cookie size={56} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-cookie-300">🍪 Cookie Wallet</div>
            <div className="mt-1 font-display text-2xl text-cookie-100">
              {connected ? (
                <span className="flex items-center gap-2">
                  You're in!
                  <span className="text-2xl animate-wiggle inline-block">🎉</span>
                </span>
              ) : (
                "Connect to play"
              )}
            </div>
            <div className="mt-1 text-xs text-cookie-200/70">
              Nightly required · {COOKIE_CHAIN.name} · {shortAddress(publicKey?.toBase58() ?? null)}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <WalletMultiButton className="!bg-gradient-to-br !from-cherry-400 !to-cherry-500 hover:!from-cherry-300 hover:!to-cherry-400 !text-white !rounded-2xl !h-12 !px-6 !text-sm !font-bold !shadow-lg !border-0" />
          {connected ? (
            <a
              href={publicKey ? explorerAddress(publicKey.toBase58()) : "#"}
              target="_blank"
              rel="noopener"
              className="text-[11px] uppercase tracking-widest text-cookie-300 hover:text-cookie-100"
            >
              cookiescan ↗
            </a>
          ) : null}
        </div>
      </div>

      {connected ? (
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Wallet" value={wallet?.adapter?.name ?? "—"} sub={isNightly ? "✓ preferred" : "use Nightly"} emoji="👛" />
          <Stat label="Address" value={shortAddress(publicKey?.toBase58() ?? null)} sub={<a className="underline hover:text-cookie-100" href={publicKey ? explorerAddress(publicKey.toBase58()) : "#"} target="_blank" rel="noopener">cookiescan ↗</a>} emoji="📍" />
          <Stat label="Native COOK" value={lamportsToCook(balance ?? 0)} sub={balance != null ? `${(balance / LAMPORTS_PER_SOL).toFixed(4)} raw` : "—"} emoji="🍪" />
          <Stat label="Network" value={network ?? "—"} sub={COOKIE_CHAIN.genesisHash.slice(0, 12) + "…"} emoji="🌐" />
        </div>
      ) : (
        <div className="relative z-10 mt-5 rounded-2xl border-2 border-dashed border-cookie-500/40 bg-dough-900/40 p-4 text-sm text-cookie-200/80">
          Don't have Nightly? Install from{" "}
          <a href="https://nightly.app" target="_blank" rel="noopener" className="font-semibold text-cookie-300 underline">nightly.app</a>, then add a custom network: <span className="font-mono text-cookie-300">RPC {COOKIE_CHAIN.rpc}</span>. Bridge COOK from Solana at{" "}
          <a href={COOKIE_CHAIN.bridge} target="_blank" rel="noopener" className="font-semibold text-cookie-300 underline">hyperlane.cookiescan.io</a>.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, emoji }: { label: string; value: React.ReactNode; sub?: React.ReactNode; emoji?: string }) {
  return (
    <div className="rounded-2xl border border-cookie-500/20 bg-gradient-to-br from-cookie-500/10 to-transparent p-3 transition hover:border-cookie-400/40 hover:from-cookie-500/20">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-semibold uppercase tracking-widest text-cookie-300">{label}</div>
        {emoji ? <div className="text-base">{emoji}</div> : null}
      </div>
      <div className="mt-1 truncate font-display text-sm text-cookie-100">{value}</div>
      {sub ? <div className="mt-0.5 truncate text-[10px] text-cookie-200/60">{sub}</div> : null}
    </div>
  );
}
