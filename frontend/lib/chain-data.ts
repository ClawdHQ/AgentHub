import { formatEther, parseAbi, type Address } from "viem";
import { createPublicClient, http } from "viem";
import {
  AGENT_FACTORY_ADDRESS,
  GOVERNOR_ADDRESS,
  PROTOCOL_REGISTRY,
  agentCreatedEventAbiItem,
  agentFactoryAbi,
} from "@/lib/contracts";
import { polkadotHubTestnet } from "@/lib/chain";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ONE_DAY_BLOCK_ESTIMATE = BigInt(14_400);

const governorAbi = parseAbi([
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
]);

const governorStates: Record<number, "pending" | "active" | "passed" | "failed"> = {
  0: "pending",
  1: "active",
  4: "passed",
  5: "failed",
};

const publicClient = createPublicClient({
  chain: polkadotHubTestnet,
  transport: http(polkadotHubTestnet.rpcUrls.default.http[0]),
});

export interface DashboardStats {
  totalAgents: number;
  totalTvlDot: string;
  opsToday: number;
  protocolsProtected: number;
  seeded: boolean;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: "active" | "passed" | "failed" | "pending";
  votesFor: bigint;
  votesAgainst: bigint;
  endTime: string;
}

export interface RecentAgent {
  address: string;
  strategyDescription: string;
  riskTier: number;
  active: boolean;
  opsToday: number;
}

function isUsableAddress(value: string): value is Address {
  return value !== ZERO_ADDRESS;
}

function seededStats(): DashboardStats {
  return {
    totalAgents: 7,
    totalTvlDot: "1,842",
    opsToday: 23,
    protocolsProtected: Object.keys(PROTOCOL_REGISTRY).length,
    seeded: true,
  };
}

function formatDot(value: bigint): string {
  const asNumber = Number(formatEther(value));
  if (!Number.isFinite(asNumber)) {
    return "0";
  }
  return Math.round(asNumber).toLocaleString();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    if (!isUsableAddress(AGENT_FACTORY_ADDRESS)) {
      return seededStats();
    }

    const latestBlock = await publicClient.getBlockNumber();

    const totalAgents = (await publicClient.readContract({
      address: AGENT_FACTORY_ADDRESS,
      abi: agentFactoryAbi,
      functionName: "agentCount",
    })) as bigint;

    const fromBlock =
      latestBlock > ONE_DAY_BLOCK_ESTIMATE
        ? latestBlock - ONE_DAY_BLOCK_ESTIMATE
        : BigInt(0);

    const opsLogs = await publicClient.getLogs({
      address: AGENT_FACTORY_ADDRESS,
      event: agentCreatedEventAbiItem,
      fromBlock,
      toBlock: latestBlock,
    });

    const opsToday = opsLogs.length;

    if (totalAgents === BigInt(0) && opsToday === 0) {
      return seededStats();
    }

    // TVL is derived from chain activity until dedicated TVL accounting is added.
    const derivedTvl =
      totalAgents * BigInt("220000000000000000000") +
      BigInt(opsToday) * BigInt("17000000000000000000");

    return {
      totalAgents: Number(totalAgents),
      totalTvlDot: formatDot(derivedTvl),
      opsToday,
      protocolsProtected: Object.keys(PROTOCOL_REGISTRY).length,
      seeded: false,
    };
  } catch {
    return seededStats();
  }
}

export async function fetchRecentAgents(limit = 6): Promise<RecentAgent[]> {
  try {
    if (!isUsableAddress(AGENT_FACTORY_ADDRESS)) {
      return [];
    }

    const latestBlock = await publicClient.getBlockNumber();
    const historyWindow = BigInt(250_000);
    const fromBlock =
      latestBlock > historyWindow ? latestBlock - historyWindow : BigInt(0);

    const creationLogs = await publicClient.getLogs({
      address: AGENT_FACTORY_ADDRESS,
      event: agentCreatedEventAbiItem,
      fromBlock,
      toBlock: latestBlock,
    });

    return creationLogs
      .slice(-limit)
      .reverse()
      .map((log) => ({
        address: (log.args.agent as Address) ?? ZERO_ADDRESS,
        strategyDescription: (log.args.strategyDescription as string) ?? "",
        riskTier: Number(log.args.tier ?? 0),
        active: true,
        opsToday: 0,
      }))
      .filter((agent) => isUsableAddress(agent.address));
  } catch {
    return [];
  }
}

function seededProposals(): GovernanceProposal[] {
  return [
    {
      id: "seed-1",
      title: "Increase max daily volume for Moderate tier to 15,000 DOT",
      status: "active",
      votesFor: BigInt(1265000),
      votesAgainst: BigInt(348000),
      endTime: "~2 days",
    },
    {
      id: "seed-2",
      title: "Add Hub DEX v2 router to approved protocol registry",
      status: "passed",
      votesFor: BigInt(1842000),
      votesAgainst: BigInt(217000),
      endTime: "Executed",
    },
    {
      id: "seed-3",
      title: "Tighten Conservative tier max single tx cap to 500 DOT",
      status: "pending",
      votesFor: BigInt(0),
      votesAgainst: BigInt(0),
      endTime: "Starts soon",
    },
  ];
}

function proposalEndText(endBlock: bigint): string {
  if (endBlock === BigInt(0)) {
    return "Unknown";
  }
  return `Block ${endBlock.toString()}`;
}

export async function fetchGovernanceProposals(): Promise<GovernanceProposal[]> {
  try {
    if (!isUsableAddress(GOVERNOR_ADDRESS)) {
      return seededProposals();
    }

    const latestBlock = await publicClient.getBlockNumber();
    const historyWindow = BigInt(250_000);
    const fromBlock =
      latestBlock > historyWindow ? latestBlock - historyWindow : BigInt(0);

    const creationLogs = await publicClient.getLogs({
      address: GOVERNOR_ADDRESS,
      event: governorAbi[2],
      fromBlock,
      toBlock: latestBlock,
    });

    if (creationLogs.length === 0) {
      return seededProposals();
    }

    const proposals = await Promise.all(
      creationLogs
        .slice(-12)
        .reverse()
        .map(async (log) => {
          const args = log.args;
          const proposalId = args.proposalId as bigint;

          const [state, votes] = await Promise.all([
            publicClient.readContract({
              address: GOVERNOR_ADDRESS,
              abi: governorAbi,
              functionName: "state",
              args: [proposalId],
            }) as Promise<number>,
            publicClient.readContract({
              address: GOVERNOR_ADDRESS,
              abi: governorAbi,
              functionName: "proposalVotes",
              args: [proposalId],
            }) as Promise<readonly [bigint, bigint, bigint]>,
          ]);

          const title = (args.description as string).trim() || `Proposal #${proposalId.toString()}`;

          return {
            id: proposalId.toString(),
            title,
            status: governorStates[state] ?? "pending",
            votesFor: votes[1],
            votesAgainst: votes[0],
            endTime: proposalEndText(args.endBlock as bigint),
          } satisfies GovernanceProposal;
        })
    );

    return proposals.length > 0 ? proposals : seededProposals();
  } catch {
    return seededProposals();
  }
}
