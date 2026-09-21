// Lightweight formatters. We don't pull in any external number-formatting libs.

export function shortAddress(addr: string | null | undefined, head = 4, tail = 4): string {
  if (!addr) return "—";
  if (typeof addr !== "string") return String(addr);
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function lamportsToCook(lamports: number | string | bigint | null | undefined, decimals = 9): string {
  if (lamports == null) return "0";
  let big: bigint;
  try {
    big = typeof lamports === "bigint" ? lamports : BigInt(lamports);
  } catch {
    return "0";
  }
  const factor = 10n ** BigInt(decimals);
  const whole = big / factor;
  const frac = big % factor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export function formatUsd(n: number | null | undefined, opts: { digits?: number } = {}): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const digits = opts.digits ?? (n < 0.01 ? 6 : n < 1 ? 4 : 2);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatPercent(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function timeAgo(unix: number | null | undefined): string {
  if (!unix) return "—";
  const diff = Date.now() / 1000 - unix;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function explorerAddress(addr: string): string {
  return `https://cookiescan.io/address/${addr}`;
}
export function explorerTx(sig: string): string {
  return `https://cookiescan.io/tx/${sig}`;
}
