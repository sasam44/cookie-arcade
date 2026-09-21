import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

import type { Metadata } from "next";
import { WalletProvider } from "@/components/WalletProvider";
import { CookieCursor } from "@/components/CookieCursor";

export const metadata: Metadata = {
  title: "Cookie Arcade · cApp on Cookie Chain",
  description:
    "On-chain arcade games + swap terminal + token registry built for the Cookie Chain SVM. Trivia, Coin Flip, Lottery — every play is a real transaction on Cookie Chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CookieCursor />
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
