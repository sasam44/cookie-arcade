# 🍪 Cookie Arcade

> An on-chain arcade cApp built for the **Cookie Chain** superteam bounty.

A live, deployed, open-source dApp that lets anyone with a **Nightly wallet** play three on-chain games, swap tokens, and inspect the live state of Cookie Chain — all from one cozy, cookie-themed UI.

**🌐 Live URL:** https://cookie-arena.vercel.app

---

## ✨ What's inside

### 🎮 Three on-chain games (SPL Memo v2 — no custom program)
| Game | How it works | Cost |
|------|--------------|------|
| **🎯 Daily Trivia** | Deterministic question-of-day · submit your answer as a memo tx | ~0.001 COOK |
| **🪙 Coin Flip** | Provably-fair heads/tails · result is hashed from the latest blockhash | ~0.001 COOK |
| **🎰 Lottery** | Buy a ticket per round · win the round (mock pool for demo) | ~0.05 COOK |

Every play writes a structured memo to **SPL Memo v2** on Cookie Chain:
```
cookie:arcade:v1|<game>|<action>|<data...>
```
e.g. `cookie:arcade:v1|coinflip|win|pick=heads;result=heads;height=26456741`

### 🛠 Ecosystem integration
- **Wallet:** Nightly + Phantom + Solflare (Nightly required per bounty brief)
- **RPC:** `https://rpc.cookiescan.io` (Cookie Chain mainnet)
- **Token registry:** Cookiescan DAS via `/api/cookiescan/api/tokens`
- **Liquidity:** Cookieswap + Cookiebox via `/api/cookiescan/api/markets`
- **Swap:** Cookieswap aggregator via `/api/swap/quote` + `/api/swap/build`
- **NFT marketplace:** Baked Bazaar listings via `/api/bazaar/listings`

### 📊 Live dashboard
- RPC health, slot, block time, TPS, latency, COOK/USD price, WS endpoint
- Latency bar chart (color-coded: green <300ms, amber <600ms, pink >600ms)

### 🎁 Polish
- Hand-crafted SVG cookies (chocolate, cherry, mint, golden)
- Rainbow comic-style title (Lilita One + 8-color palette per letter)
- Web Audio API sound effects (no external assets — pure oscillators)
- Confetti on win, toast notifications for streak badges
- Coin flip leaderboard (reads on-chain memos)
- Animated cursor with crumb trail (RAF-throttled, GPU-accelerated)
- Warm rose-red background, glassmorphism cards, custom Bagel Fat One display font

---

## 🧱 Stack

- **Framework:** Next.js 14 (App Router, static export)
- **Wallet:** `@solana/wallet-adapter-react` (Nightly, Phantom, Solflare)
- **RPC client:** `@solana/web3.js` directly
- **Charts:** `recharts`
- **Styling:** Tailwind CSS + custom CSS for animations
- **Fonts:** Bagel Fat One, Lilita One, Quicksand, Fredoka (Google Fonts)
- **Sound:** Web Audio API (no external assets)

---

## 🏃 Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

To build a production bundle:
```bash
npm run build
npm run start
```

### Environment
No `.env` required for the demo — all RPC endpoints and program IDs are constants in `src/lib/config.ts`. Wallet must be set to **Cookie Chain** custom network (RPC `https://rpc.cookiescan.io`, chain ID `420042004`).

---

## 📁 Project layout

```
src/
├── app/
│   ├── globals.css           # Tailwind + custom CSS animations
│   ├── layout.tsx            # Root layout (wallet + cursor providers)
│   └── page.tsx              # Main page (tabs: Trivia / Coin Flip / Lottery / Dashboard)
├── components/
│   ├── CoinArt.tsx           # Hand-crafted SVG cookies
│   ├── CoinFlipLeaderboard.tsx
│   ├── Confetti.tsx
│   ├── CookieCursor.tsx      # RAF-throttled cursor with crumb trail
│   ├── ErrorBoundary.tsx
│   ├── LiveFeed.tsx          # On-chain activity feed
│   ├── NetworkPulse.tsx      # RPC stats + latency chart
│   ├── RainbowTitle.tsx      # Comic-style multi-color title
│   ├── SoundToggle.tsx
│   ├── SwapPanel.tsx         # Cookieswap multi-route quote + build+sign
│   ├── Toast.tsx             # Streak / badge notifications
│   ├── TokenBoard.tsx        # Tokens + top pools chart
│   ├── WalletPanel.tsx
│   ├── WalletProvider.tsx
│   └── games/
│       ├── CoinFlipGame.tsx
│       ├── LotteryGame.tsx
│       └── TriviaGame.tsx
└── lib/
    ├── arcade.ts             # Memo schema, feed parser, build helpers
    ├── config.ts             # COOKIE_CHAIN constants, RPC, program IDs
    ├── format.ts             # shortAddress, lamportsToCook, formatUsd, …
    └── sound.ts              # Web Audio API sound effects
```

---

## 🔐 Cookie Chain config (verified on-chain via cookie-mcp, 2026-07-20)

```ts
COOKIE_CHAIN = {
  name: "Cookie Chain",
  rpc: "https://rpc.cookiescan.io",
  wss: "wss://wss.cookiescan.io",
  chainId: 420042004,
  genesisHash: "9wDaBRDgArEUpvhHxGguNkwoVh4UpGZB9o2EoEcBB2",
  memo: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", // SPL Memo v2
  cookMint: "So11111111111111111111111111111111111111112", // native
}
```

---

## 🎯 Bounty requirements check

| Requirement | Status |
|-------------|--------|
| Connect wallet (Nightly required) | ✅ Nightly + Phantom + Solflare |
| Show connected address | ✅ WalletPanel + Stat cards |
| Trigger real transactions on Cookie Chain | ✅ Trivia/CoinFlip/Lottery all send SPL Memo txs |
| Confirmation handling with timing (ms grid) | ✅ build/sign/send/confirm ms in every game |
| Error handling + user feedback | ✅ pretty() error formatter, fallback to `sendRawTransaction` |
| Show app data + activity dashboard | ✅ LiveFeed, NetworkPulse, TokenBoard |
| Use existing Cookie Chain programs (SPL Memo) | ✅ MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr |
| Deployed + publicly accessible | ✅ https://cookie-arena.vercel.app |
| Open source + README | ✅ This file |
| Live URL + GitHub repo | ✅ Both ready for submission |

---

## 🎮 On-chain demo flow

1. Connect **Nightly** (add Cookie Chain as a custom network with RPC `https://rpc.cookiescan.io`)
2. Bridge some COOK from Solana at https://hyperlane.cookiescan.io
3. Open **🎯 Daily Trivia** → answer the question → confirm in wallet → see your tx confirmed in ~400ms
4. Open **🪙 Coin Flip** → pick heads/tails → see the cookie spin → result is provably fair (hash from latest blockhash)
5. Check the **live feed** below the game to see your play (and everyone else's) on-chain
6. Watch the **latency chart** fill up with samples every 6 seconds
7. Win 3+ flips in a row → unlock streak badge ⚡

---

## 📜 License

MIT — built for the Cookie Chain bounty by sasam44. Have fun. 🍪
