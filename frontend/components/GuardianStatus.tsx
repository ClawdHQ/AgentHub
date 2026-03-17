"use client";

import { useState, useEffect } from "react";

interface GuardianStatusProps {
  agentAddress: string;
  softPaused?: boolean;
  hardPaused?: boolean;
  violationCount?: number;
}

const MAX_VIOLATIONS = 3;

export default function GuardianStatus({
  agentAddress,
  softPaused = false,
  hardPaused = false,
  violationCount = 0,
}: GuardianStatusProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 15_000);
    return () => clearInterval(interval);
  }, [agentAddress]);

  const status = hardPaused ? "HARD_PAUSED" : softPaused ? "SOFT_PAUSED" : "ACTIVE";
  const statusColors = {
    ACTIVE: "text-green-400",
    SOFT_PAUSED: "text-yellow-400",
    HARD_PAUSED: "text-red-400",
  };
  const dotColors = {
    ACTIVE: "bg-green-400",
    SOFT_PAUSED: "bg-yellow-400",
    HARD_PAUSED: "bg-red-400",
  };

  return (
    <div className="rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Guardian Status</h3>
        <span className="text-xs text-white/40">
          {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className={`h-3 w-3 rounded-full ${dotColors[status]}`} />
        <span className={`font-semibold ${statusColors[status]}`}>{status}</span>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/60">Violations</span>
        <span className={violationCount >= MAX_VIOLATIONS ? "text-red-400" : "text-white/80"}>
          {violationCount} / {MAX_VIOLATIONS}
        </span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            violationCount >= MAX_VIOLATIONS
              ? "bg-red-400"
              : violationCount > 0
              ? "bg-yellow-400"
              : "bg-green-400"
          }`}
          style={{ width: `${(violationCount / MAX_VIOLATIONS) * 100}%` }}
        />
      </div>
    </div>
  );
}
