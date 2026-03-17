import Link from "next/link";

interface AgentCardProps {
  address: string;
  strategyDescription: string;
  riskTier: number;
  active: boolean;
  opsToday?: number;
}

const TIER_LABELS: Record<number, string> = {
  0: "CONSERVATIVE",
  1: "MODERATE",
  2: "AGGRESSIVE",
};

const TIER_COLORS: Record<number, string> = {
  0: "text-green-400 bg-green-400/10",
  1: "text-yellow-400 bg-yellow-400/10",
  2: "text-red-400 bg-red-400/10",
};

export default function AgentCard({
  address,
  strategyDescription,
  riskTier,
  active,
  opsToday = 0,
}: AgentCardProps) {
  return (
    <Link href={`/agents/${address}`}>
      <div className="rounded-xl border border-white/10 p-6 hover:border-white/20 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono text-sm text-white/60">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                TIER_COLORS[riskTier] ?? "text-white/60 bg-white/10"
              }`}
            >
              {TIER_LABELS[riskTier] ?? "UNKNOWN"}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-green-400" : "bg-red-400"
              }`}
            />
          </div>
        </div>
        <p className="text-sm text-white/80 mb-4 line-clamp-2">
          {strategyDescription || "No strategy description"}
        </p>
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{opsToday} ops today</span>
          <span className="text-[#E6007A]">View →</span>
        </div>
      </div>
    </Link>
  );
}
