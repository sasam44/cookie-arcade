"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider as BaseWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { NightlyWalletAdapter } from "@solana/wallet-adapter-nightly";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { COOKIE_CHAIN } from "@/lib/config";

// Cast wallet adapter components to `any` to bypass @types/react 19 vs 18 mismatch
// when @solana/wallet-adapter-react ships older ReactNode return types.
const CP = ConnectionProvider as any;
const BP = BaseWalletProvider as any;
const WMP = WalletModalProvider as any;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => COOKIE_CHAIN.rpc, []);

  const wallets = useMemo(
    () => [
      new NightlyWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <CP endpoint={endpoint} config={{ commitment: "confirmed", wsEndpoint: COOKIE_CHAIN.wss }}>
      <BP wallets={wallets} autoConnect={false}>
        <WMP>{children}</WMP>
      </BP>
    </CP>
  );
}
