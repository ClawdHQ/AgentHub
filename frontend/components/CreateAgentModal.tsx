"use client";

import { useState } from "react";
import { z } from "zod";

const strategySchema = z.string().min(20, "Strategy must be at least 20 characters").max(500, "Strategy must be at most 500 characters");

interface ParsedPolicy {
  tier: number;
  maxSingleTxValue: string;
  maxDailyVolume: string;
  allowedProtocols: string[];
  allowedSelectors: string[];
  xcmEnabled: boolean;
  reasoning: string;
}

interface CreateAgentModalProps {
  open: boolean;
  onClose: () => void;
}

const TIER_LABELS = ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"];

export default function CreateAgentModal({ open, onClose }: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const [strategy, setStrategy] = useState("");
  const [strategyError, setStrategyError] = useState("");
  const [parsedPolicy, setParsedPolicy] = useState<ParsedPolicy | null>(null);
  const [aiSigner, setAiSigner] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("0.1");
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleParseStrategy = async () => {
    const result = strategySchema.safeParse(strategy);
    if (!result.success) {
      setStrategyError(result.error.errors[0].message);
      return;
    }
    setStrategyError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      if (!res.ok) throw new Error("Failed to parse strategy");
      const policy = await res.json() as ParsedPolicy;
      setParsedPolicy(policy);
      setStep(2);
    } catch {
      setStrategyError("Failed to parse strategy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    // TODO: Implement actual deployment via wagmi useWriteContract
    alert("Deployment requires wallet connection");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="Create Agent">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-[#E6007A]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Strategy Input */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Describe Your Strategy</h2>
            <p className="text-white/60 text-sm mb-4">
              Tell the AI what DeFi strategy you want to execute
            </p>
            <textarea
              aria-label="Strategy description"
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-[#E6007A]"
              rows={5}
              placeholder="e.g. Stake DOT on the native staking protocol, maximum 0.5 DOT per transaction, conservative approach only..."
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              minLength={20}
              maxLength={500}
            />
            {strategyError && (
              <p className="text-red-400 text-xs mt-1">{strategyError}</p>
            )}
            <div className="flex justify-between items-center mt-1 mb-4">
              <span className="text-xs text-white/40">{strategy.length}/500</span>
            </div>
            <button
              onClick={handleParseStrategy}
              disabled={isLoading}
              className="w-full bg-[#E6007A] hover:bg-[#E6007A]/80 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {isLoading ? "Parsing..." : "Parse with AI →"}
            </button>
          </div>
        )}

        {/* Step 2: Policy Review */}
        {step === 2 && parsedPolicy && (
          <div>
            <h2 className="text-xl font-bold mb-1">Review Policy</h2>
            <p className="text-white/60 text-sm mb-4">AI-generated policy — review before deploying</p>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Risk Tier</span>
                <span className={`font-semibold ${parsedPolicy.tier === 2 ? "text-red-400" : parsedPolicy.tier === 1 ? "text-yellow-400" : "text-green-400"}`}>
                  {TIER_LABELS[parsedPolicy.tier]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Max Single Tx</span>
                <span>{(BigInt(parsedPolicy.maxSingleTxValue) / BigInt(1e18)).toString()} DOT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Max Daily Volume</span>
                <span>{(BigInt(parsedPolicy.maxDailyVolume) / BigInt(1e18)).toString()} DOT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">XCM Enabled</span>
                <span className={parsedPolicy.xcmEnabled ? "text-red-400" : "text-green-400"}>
                  {parsedPolicy.xcmEnabled ? "Yes ⚠️" : "No"}
                </span>
              </div>
            </div>
            {parsedPolicy.tier === 2 && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-xs text-red-400 mb-4">
                ⚠️ AGGRESSIVE tier enables XCM cross-chain calls
              </div>
            )}
            <p className="text-xs text-white/40 mb-4 italic">{parsedPolicy.reasoning}</p>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 border border-white/10 py-2.5 rounded-lg text-sm">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-[#E6007A] text-white font-semibold py-2.5 rounded-lg">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Configuration</h2>
            <p className="text-white/60 text-sm mb-4">Set up AI signer and initial deposit</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block" htmlFor="ai-signer">AI Signer Address</label>
                <input
                  id="ai-signer"
                  type="text"
                  value={aiSigner}
                  onChange={(e) => setAiSigner(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-[#E6007A]"
                  aria-label="AI Signer Address"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block" htmlFor="initial-deposit">Initial Deposit (DOT)</label>
                <input
                  id="initial-deposit"
                  type="number"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#E6007A]"
                  aria-label="Initial Deposit in DOT"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 border border-white/10 py-2.5 rounded-lg text-sm">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-[#E6007A] text-white font-semibold py-2.5 rounded-lg">Review →</button>
            </div>
          </div>
        )}

        {/* Step 4: Deploy */}
        {step === 4 && parsedPolicy && (
          <div>
            <h2 className="text-xl font-bold mb-1">Deploy Agent</h2>
            <p className="text-white/60 text-sm mb-4">Review and deploy your agent</p>
            <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-white/60">Risk Tier</span>
                <span>{TIER_LABELS[parsedPolicy.tier]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">AI Signer</span>
                <span className="font-mono text-xs truncate max-w-[140px]">{aiSigner || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Deposit</span>
                <span>{initialDeposit} DOT</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="flex-1 border border-white/10 py-2.5 rounded-lg text-sm">Back</button>
              <button onClick={handleDeploy} className="flex-1 bg-[#E6007A] text-white font-semibold py-2.5 rounded-lg">
                Deploy Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
