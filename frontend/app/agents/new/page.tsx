"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import CreateAgentModal from "@/components/CreateAgentModal";
import SiteHeader from "@/components/SiteHeader";

export default function NewAgentPage() {
  const { isConnected } = useAccount();
  const [openCreateModal, setOpenCreateModal] = useState(false);

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <SiteHeader />

      <div className="px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-white/60 hover:text-white text-sm">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
          <p className="text-white/60 mb-8">
            Deploy an AI-controlled DeFi agent with Guardian protection
          </p>

          <div className="rounded-xl border border-white/10 p-8 text-center">
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-white/60">Connect your wallet to create an agent</p>
                <div className="flex items-center justify-center">
                  <ConnectButton showBalance={false} chainStatus="icon" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/60">Wallet connected. Start the 4-step agent wizard.</p>
                <button
                  onClick={() => setOpenCreateModal(true)}
                  className="rounded-lg bg-[#E6007A] px-6 py-3 font-semibold text-white hover:bg-[#E6007A]/80 transition-colors"
                >
                  Open Agent Wizard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateAgentModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      />
    </main>
  );
}
