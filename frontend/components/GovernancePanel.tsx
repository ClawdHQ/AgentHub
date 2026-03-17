interface Proposal {
  id: string;
  title: string;
  status: "active" | "passed" | "failed" | "pending";
  votesFor: bigint;
  votesAgainst: bigint;
  endTime: string;
}

interface GovernancePanelProps {
  proposals?: Proposal[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400 bg-green-400/10",
  passed: "text-blue-400 bg-blue-400/10",
  failed: "text-red-400 bg-red-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
};

export default function GovernancePanel({ proposals = [] }: GovernancePanelProps) {
  if (proposals.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-6">
        <h3 className="font-semibold mb-4">Governance Proposals</h3>
        <p className="text-white/40 text-sm text-center py-8">No active proposals</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-6">
      <h3 className="font-semibold mb-4">Governance Proposals</h3>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="border border-white/5 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium">{proposal.title}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_COLORS[proposal.status] ?? "text-white/60 bg-white/10"
                }`}
              >
                {proposal.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>For: {proposal.votesFor.toString()}</span>
              <span>Against: {proposal.votesAgainst.toString()}</span>
              <span>Ends: {proposal.endTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
