"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-semibold tracking-tight text-white">
          AgentHub
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-white/70 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link
            href="/governance"
            className="text-white/70 hover:text-white transition-colors"
          >
            Governance
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </nav>
      </div>
    </header>
  );
}
