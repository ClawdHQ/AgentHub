// Contract addresses and ABIs for AgentHub on Polkadot Hub Testnet

export const AGENT_FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_AGENT_FACTORY_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const GUARDIAN_POLICY_ADDRESS =
  (process.env.NEXT_PUBLIC_GUARDIAN_POLICY_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const GOVERNOR_ADDRESS =
  (process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ??
  "https://api.studio.thegraph.com/query/0/agenthub/version/latest";

// Risk tier mapping
export const RISK_TIER_LABELS: Record<number, string> = {
  0: "CONSERVATIVE",
  1: "MODERATE",
  2: "AGGRESSIVE",
};

export const RISK_TIER_COLORS: Record<number, string> = {
  0: "text-green-400 bg-green-400/10",
  1: "text-yellow-400 bg-yellow-400/10",
  2: "text-red-400 bg-red-400/10",
};

// Protocol registry for Hub testnet
export const PROTOCOL_REGISTRY: Record<string, `0x${string}`> = {
  "DOT Staking": "0x0000000000000000000000000000000000000804",
  "Hub DEX": "0x0000000000000000000000000000000000000000",
  "Test Protocol": "0x0000000000000000000000000000000000000000",
};
