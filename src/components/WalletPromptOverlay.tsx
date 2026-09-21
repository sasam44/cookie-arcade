"use client";

/**
 * Big, impossible-to-miss overlay shown when the user is in a tx phase
 * where they need to act (sign in wallet) or wait (sending/confirming).
 * Critical for the bounty brief: the user must clearly see that the wallet
 * is waiting for their signature, especially if a popup was blocked.
 */
export type TxPhase = "idle" | "building" | "signing" | "sending" | "confirming" | "confirmed" | "sent" | "error";

const STEPS: TxPhase[] = ["building", "signing", "sending", "confirming"];

export function WalletPromptOverlay({ phase }: { phase: TxPhase }) {
  if (phase === "idle" || phase === "confirmed" || phase === "error" || phase === "sent") return null;

  const isSigning = phase === "signing";
  const title =
    phase === "building" ? "Building your transaction…" :
    phase === "signing" ? "🔐 Sign in your wallet" :
    phase === "sending" ? "📡 Sending to Cookie Chain…" :
    phase === "confirming" ? "⛓️ Waiting for confirmation…" :
    "";

  const hint =
    phase === "signing" ? "Check your Nightly extension/popup. Click Approve to sign the memo tx." :
    phase === "sending" ? "Your signed tx is being broadcast to the RPC." :
    phase === "confirming" ? "Validators are voting on your tx. Usually <500 ms." :
    "";

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-dough-900/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md animate-pop-in rounded-3xl border-2 border-cookie-300/60 bg-gradient-to-br from-dough-700 to-dough-800 p-7 text-center shadow-2xl">
        {/* Big pulsing icon */}
        <div className="mx-auto mb-4 flex w-fit justify-center">
          <div className={isSigning ? "animate-bounce-soft" : "animate-pulse"}>
            <div className="text-7xl">{isSigning ? "🔐" : "🍪"}</div>
          </div>
        </div>
        <div className="font-display text-2xl font-bold text-cookie-100">{title}</div>
        <div className="mt-2 text-sm text-cookie-200/80">{hint}</div>
        {/* Step dots */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
          {STEPS.map((s, i) => {
            const currentIdx = STEPS.indexOf(phase);
            const isDone = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${isDone ? "border-emerald-400 bg-emerald-500/30 text-emerald-100" : isActive ? "border-cookie-300 bg-cookie-500/30 text-cookie-100" : "border-cookie-500/30 text-cookie-200/40"}`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={isActive ? "text-cookie-100" : "text-cookie-200/40"}>{s}</span>
                {i < STEPS.length - 1 ? <span className="text-cookie-300/30">→</span> : null}
              </div>
            );
          })}
        </div>
        {/* Footer hint */}
        {isSigning ? (
          <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-200">
            💡 If you don&apos;t see a popup, check your Nightly extension icon in the browser toolbar.
          </div>
        ) : null}
      </div>
    </div>
  );
}
