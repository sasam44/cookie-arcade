"use client";

import { useEffect, useState } from "react";

import { COOKIE_CHAIN, GAMES, type GameId } from "@/lib/config";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LiveFeed } from "@/components/LiveFeed";
import { NetworkPulse } from "@/components/NetworkPulse";
import { SwapPanel } from "@/components/SwapPanel";
import { TokenBoard } from "@/components/TokenBoard";
import { WalletPanel } from "@/components/WalletPanel";
import { CoinFlipGame } from "@/components/games/CoinFlipGame";
import { LotteryGame } from "@/components/games/LotteryGame";
import { TriviaGame } from "@/components/games/TriviaGame";
import { Cookie, CherryCookie, MintCookie, GoldenCookie, CookieField, Crumb, Steam } from "@/components/CookieArt";
import { SoundToggle } from "@/components/SoundToggle";
import { RainbowTitle } from "@/components/RainbowTitle";

export default function Page() {
  const [tab, setTab] = useState<GameId | "dashboard">("trivia");

  useEffect(() => {
    const onError = (e: ErrorEvent) => console.error("[global-error]", e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => console.error("[unhandled-rejection]", e.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <CookieField count={14} />

      <Header tab={tab} setTab={setTab} />

      <ErrorBoundary>
        <WalletPanel />
      </ErrorBoundary>

      <ErrorBoundary>
        <NetworkPulse />
      </ErrorBoundary>

      <ErrorBoundary>
        {tab === "trivia" ? <TriviaGame /> : tab === "coinflip" ? <CoinFlipGame /> : tab === "lottery" ? <LotteryGame /> : <Dashboard />}
      </ErrorBoundary>

      <ErrorBoundary>
        <LiveFeed />
      </ErrorBoundary>

      <ErrorBoundary>
        <SwapPanel />
      </ErrorBoundary>

      <ErrorBoundary>
        <TokenBoard />
      </ErrorBoundary>

      <Footer />
    </main>
  );
}

function Header({ tab, setTab }: { tab: GameId | "dashboard"; setTab: (t: any) => void }) {
  return (
    <header className="card-warm relative overflow-hidden p-6">
      {/* Floating decorations */}
      <div className="absolute -right-4 -top-4 animate-float">
        <Cookie size={80} />
      </div>
      <div className="absolute -bottom-2 right-44 animate-bounce-soft" style={{ animationDelay: "0.4s" }}>
        <CherryCookie size={56} />
      </div>
      <div className="absolute -left-3 top-16 animate-float" style={{ animationDelay: "1.2s" }}>
        <MintCookie size={60} />
      </div>

      {/* Sparkle crumbs */}
      <Crumb top="20%" left="15%" size={4} delay={0} color="#fcb752" />
      <Crumb top="60%" left="80%" size={5} delay={0.5} color="#ff6b8a" />
      <Crumb top="40%" left="50%" size={3} delay={1.0} color="#7dd3a8" />
      <Crumb top="80%" left="20%" size={4} delay={1.5} color="#fcb752" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Title row — just cookie + title text, no plain white circle */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="animate-glow rounded-full">
              <Cookie size={84} />
            </div>
            <Steam />
          </div>
          <div>
            <RainbowTitle text="Cookie Arcade" size={64} rotate={-6} className="-mt-2" />
            <div className="mt-3 flex items-center gap-2 text-base font-semibold text-cookie-100">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>Live on</span>
              <span className="text-cookie-300">{COOKIE_CHAIN.name}</span>
              <span className="text-cookie-300/40">·</span>
              <span>on-chain games · win real cookies</span>
            </div>
          </div>
        </div>

        {/* Bigger nav row */}
        <nav className="flex flex-wrap items-center gap-3 text-base font-bold">
          <NavBtn active={tab === "trivia"} onClick={() => setTab("trivia")} emoji="🎯" label="Trivia" />
          <NavBtn active={tab === "coinflip"} onClick={() => setTab("coinflip")} emoji="🪙" label="Coin Flip" />
          <NavBtn active={tab === "lottery"} onClick={() => setTab("lottery")} emoji="🎰" label="Lottery" />
          <NavBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} emoji="📊" label="Dashboard" />
          <a
            href={COOKIE_CHAIN.bridge}
            target="_blank"
            rel="noopener"
            className="btn-cute rounded-full border-2 border-cherry-500/50 bg-gradient-to-br from-cherry-500/30 to-cherry-600/20 px-5 py-2.5 text-cookie-100 hover:border-cherry-300"
          >
            🌉 Bridge
          </a>
          <SoundToggle />
        </nav>
      </div>
    </header>
  );
}

function NavBtn({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`btn-cute flex items-center gap-2 rounded-full border-2 px-5 py-2.5 transition ${
        active
          ? "border-cookie-300 bg-gradient-to-br from-cookie-300 to-cookie-500 text-dough-900 shadow-lg"
          : "border-cookie-500/40 bg-dough-800/60 text-cookie-100 hover:border-cookie-300 hover:bg-dough-700/80"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function Dashboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DashCard title="Daily Trivia" desc="Answer today's question, submit a memo tx. Free." color="sky" cookieType="choc" />
      <DashCard title="Coin Flip" desc="Pick heads or tails, flip the chain. Provably-fair." color="amber" cookieType="cherry" />
      <DashCard title="Lottery" desc="Buy a ticket, win the round. ~0.05 COOK / ticket." color="cherry" cookieType="mint" />
      <div className="card-warm lg:col-span-3 flex items-start gap-4 p-5">
        <div className="flex-shrink-0 animate-bounce-soft">
          <GoldenCookie size={56} />
        </div>
        <div>
          <div className="font-display text-lg text-cookie-100">How it works ✨</div>
          <div className="mt-1 text-sm text-cookie-200/70">
            All three games use the SPL Memo v2 program — no custom program, no escrow.
            Just real on-chain transactions. Every play is a paid tx (~0.001 COOK) and lives
            on the global leaderboard below. Connect your Nightly wallet, bridge some COOK, and start playing!
          </div>
        </div>
      </div>
    </div>
  );
}

function DashCard({ title, desc, color, cookieType }: { title: string; desc: string; color: "amber" | "cherry" | "sky" | "mint"; cookieType: "choc" | "cherry" | "mint" }) {
  const accents = {
    amber: "from-cookie-300/20 to-cookie-600/20 border-cookie-400/30",
    cherry: "from-cherry-400/20 to-cherry-500/20 border-cherry-400/30",
    sky: "from-sky2-400/20 to-sky2-500/20 border-sky2-400/30",
    mint: "from-mint-400/20 to-mint-500/20 border-mint-400/30",
  }[color];
  const CookieComp = cookieType === "choc" ? Cookie : cookieType === "cherry" ? CherryCookie : MintCookie;
  return (
    <div className={`card-cute relative overflow-hidden border-2 bg-gradient-to-br ${accents} p-5 transition hover:scale-[1.03] hover:shadow-2xl`}>
      <div className="absolute -right-4 -top-4 opacity-25 animate-float">
        <CookieComp size={90} />
      </div>
      <div className="relative z-10">
        <div className="flex h-20 items-center justify-center">
          <div className="animate-bounce-soft">
            <CookieComp size={72} />
          </div>
        </div>
        <div className="mt-3 font-display text-xl text-cookie-100">{title}</div>
        <div className="mt-1 text-sm text-cookie-200/70">{desc}</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="card-warm relative mt-6 grid gap-4 overflow-hidden p-5 text-sm text-cookie-200/70 md:grid-cols-3">
      <div className="absolute -right-6 -bottom-6 opacity-20">
        <CherryCookie size={120} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Cookie size={32} />
          <div className="font-display text-cookie-100">Built for the Cookie Chain bounty</div>
        </div>
        <div className="mt-2 text-xs">
          Network <span className="font-mono text-cookie-300">{COOKIE_CHAIN.name}</span> · genesis <span className="font-mono text-cookie-300">{COOKIE_CHAIN.genesisHash.slice(0, 16)}…</span> · chain {COOKIE_CHAIN.chainId}
        </div>
      </div>
      <div className="relative z-10">
        <div className="font-display text-cookie-100">🌐 Ecosystem plugs</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <a className="rounded-full bg-cookie-500/20 px-2 py-1 underline hover:bg-cookie-500/30" href={COOKIE_CHAIN.das} target="_blank" rel="noopener">Cookie DAS</a>
          <a className="rounded-full bg-cookie-500/20 px-2 py-1 underline hover:bg-cookie-500/30" href={COOKIE_CHAIN.swap} target="_blank" rel="noopener">Cookieswap</a>
          <a className="rounded-full bg-cookie-500/20 px-2 py-1 underline hover:bg-cookie-500/30" href="https://bakedbazaar.art" target="_blank" rel="noopener">Baked Bazaar</a>
          <a className="rounded-full bg-cookie-500/20 px-2 py-1 underline hover:bg-cookie-500/30" href="https://github.com/cookiechain/cookie-mcp" target="_blank" rel="noopener">cookie-mcp</a>
        </div>
      </div>
      <div className="relative z-10">
        <div className="font-display text-cookie-100">👛 Bring your wallet</div>
        <div className="mt-2 text-xs">
          Install <a className="rounded-full bg-cookie-500/20 px-2 py-1 underline hover:bg-cookie-500/30" href="https://nightly.app" target="_blank" rel="noopener">Nightly</a>, add a custom network with RPC{" "}
          <span className="font-mono text-cookie-300">{COOKIE_CHAIN.rpc}</span>, then bridge COOK at{" "}
          <a className="rounded-full bg-cookie-500/20 px-2 py-1 underline hover:bg-cookie-500/30" href={COOKIE_CHAIN.bridge} target="_blank" rel="noopener">hyperlane.cookiescan.io</a>.
        </div>
      </div>
    </footer>
  );
}
