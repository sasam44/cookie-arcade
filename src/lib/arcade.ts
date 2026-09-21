// Cookie Arcade on-chain activity reader.
// Every play sends a memo to SPL Memo v2 on Cookie Chain. We read the recent
// memo-program signatures and filter for `cookie:arcade:v1:<game>:<action>`.
//
// Format: `cookie:arcade:v1|<game>|<action>|<data...>`
//   game ∈ { trivia, tower, lottery }
//   action ∈ { play, win, stack, ticket, … }

import { type Connection, PublicKey } from "@solana/web3.js";
import { ARCADE_TAG, COOKIE_CHAIN, type GameId } from "./config";

export type ArcadeEventKind = GameId;

export interface ArcadeEvent {
  signature: string;
  slot: number;
  blockTime: number | null;
  player: string; // signer pubkey
  game: GameId;
  action: string; // play / win / stack / ticket / …
  raw: string; // full memo body after tag strip
}

const SPL_MEMO_PREFIX_RE = /^\[\d+\]\s*/;

/** Parse a memo field into an ArcadeEvent, or return null if it's not a game memo. */
export function parseArcadeMemo(memo: string | null | undefined, signature: string, slot: number, blockTime: number | null): ArcadeEvent | null {
  if (!memo) return null;
  const cleaned = memo.replace(SPL_MEMO_PREFIX_RE, "");
  if (!cleaned.startsWith(ARCADE_TAG)) return null;
  const rest = cleaned.slice(ARCADE_TAG.length + 1); // skip tag + ":"
  // schema: game|action|data
  const [game, action = "", ...dataParts] = rest.split("|");
  if (!["trivia", "coinflip", "lottery"].includes(game)) return null;
  return {
    signature,
    slot,
    blockTime,
    player: "", // resolved by caller via getTransaction
    game: game as GameId,
    action,
    raw: dataParts.join("|"),
  };
}

/** Load recent events for any game, sorted newest-first. */
export async function loadGlobalFeed(connection: Connection, opts: { limit?: number; playerHint?: string } = {}): Promise<ArcadeEvent[]> {
  const limit = opts.limit ?? 60;

  // The memo program sees all memos on the chain, so games appear here. We
  // also pull the player's own signatures to make sure their plays show up
  // even if they happened outside the memo-program scan window.
  const hydrate = async (sigs: Awaited<ReturnType<Connection["getSignaturesForAddress"]>>) => {
    const out: ArcadeEvent[] = [];
    for (const s of sigs) {
      const ev = parseArcadeMemo(s.memo, s.signature, s.slot, s.blockTime ?? null);
      if (!ev) continue;
      let signer: string | null = null;
      try {
        const txInfo = await connection.getTransaction(s.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        signer = (txInfo?.transaction.message as any)?.accountKeys?.[0] ?? null;
      } catch { /* skip */ }
      if (!signer) continue;
      ev.player = signer;
      out.push(ev);
    }
    return out;
  };

  try {
    const memoSigs = await connection.getSignaturesForAddress(new PublicKey(COOKIE_CHAIN.memo), { limit });
    const playerSigs = opts.playerHint
      ? await connection.getSignaturesForAddress(new PublicKey(opts.playerHint), { limit }).catch(() => [] as any)
      : [];
    const merged: ArcadeEvent[] = [];
    const seen = new Set<string>();
    for (const t of [...(await hydrate(playerSigs)), ...(await hydrate(memoSigs))]) {
      if (seen.has(t.signature)) continue;
      seen.add(t.signature);
      merged.push(t);
    }
    merged.sort((a, b) => (b.blockTime ?? b.slot) - (a.blockTime ?? a.slot));
    return merged.slice(0, limit);
  } catch (e) {
    console.warn("loadGlobalFeed failed:", e);
    return [];
  }
}

/** Build a memo string for the given (game, action, data). */
export function buildMemo(game: GameId, action: string, data: Record<string, string | number> = {}): string {
  const tail = Object.entries(data)
    .map(([k, v]) => `${k}=${v}`)
    .join(";");
  return `${ARCADE_TAG}|${game}|${action}|${tail}`;
}

/** SPL Memo v2 expects base64 instruction data. */
export function memoDataBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
