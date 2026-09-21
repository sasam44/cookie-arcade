// Cookie Chain mainnet config (verified on-chain via cookie-mcp 2026-07-20).
export const COOKIE_CHAIN = {
  name: "Cookie Chain",
  rpc: "https://rpc.cookiescan.io",
  wss: "wss://wss.cookiescan.io",
  chainId: 420042004,
  genesisHash: "9wDaBRDgArEUpvhHxGguNkwoVh4UpGZB9o2EoEcBB2",
  // SPL Memo v2 — already deployed on Cookie Chain, no deploy needed.
  memo: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  // COOK is the native mint (same string as wSOL on Solana, different chain).
  cookMint: "So11111111111111111111111111111111111111112",
  // Ecosystem links
  bridge: "https://hyperlane.cookiescan.io",
  swap: "https://swap.cookiescan.io",
  cookiebox: "https://cookiebox.cookiescan.io",
  das: "https://api.cookiescan.io",
  faucet: "https://cookiescan.io/faucet",
  docs: "https://docs.cookiechain.wtf",
  explorer: "https://cookiescan.io",
};

// Game-specific constants
export const ARCADE_TAG = "cookie:arcade:v1"; // prefix in every game tx memo
export const GAMES = ["trivia", "coinflip", "lottery"] as const;
export type GameId = (typeof GAMES)[number];

export const TRIVIA_REWARD_COOK = 1; // 1 COOK for correct answer
