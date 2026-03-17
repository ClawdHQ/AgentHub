import {
  BigInt,
  BigDecimal,
  Bytes,
  Address,
} from "@graphprotocol/graph-ts";

import {
  AgentCreated,
} from "../generated/AgentFactory/AgentFactory";

import {
  AgentExecuted,
  AgentBlocked,
} from "../generated/AgentAccount/AgentAccount";

import {
  PolicyViolation,
  SoftPaused,
} from "../generated/GuardianPolicy/GuardianPolicy";

import {
  Agent,
  Operation,
  Violation,
  ProtocolStats,
} from "../generated/schema";

const PROTOCOL_STATS_ID = "global";

function getOrCreateProtocolStats(): ProtocolStats {
  let stats = ProtocolStats.load(PROTOCOL_STATS_ID);
  if (!stats) {
    stats = new ProtocolStats(PROTOCOL_STATS_ID);
    stats.totalAgents = BigInt.fromI32(0);
    stats.totalOps = BigInt.fromI32(0);
    stats.totalValueMoved = BigDecimal.fromString("0");
    stats.pauseEvents = BigInt.fromI32(0);
  }
  return stats;
}

function riskTierToString(tier: i32): string {
  if (tier === 0) return "CONSERVATIVE";
  if (tier === 1) return "MODERATE";
  return "AGGRESSIVE";
}

/**
 * Handle AgentCreated event from AgentFactory
 * Creates Agent entity and increments ProtocolStats.totalAgents
 */
export function handleAgentCreated(event: AgentCreated): void {
  const agent = new Agent(event.params.agent.toHexString());
  agent.owner = event.params.owner;
  agent.aiSigner = Bytes.fromHexString("0x0000000000000000000000000000000000000000");
  agent.strategyDescription = event.params.strategyDescription;
  agent.riskTier = riskTierToString(event.params.tier);
  agent.active = true;
  agent.createdAt = event.block.timestamp;
  agent.totalOpsExecuted = BigInt.fromI32(0);
  agent.totalValueMoved = BigDecimal.fromString("0");
  agent.violationCount = BigInt.fromI32(0);
  agent.save();

  const stats = getOrCreateProtocolStats();
  stats.totalAgents = stats.totalAgents.plus(BigInt.fromI32(1));
  stats.save();
}

/**
 * Handle AgentExecuted event
 * Creates Operation entity, updates agent totals
 */
export function handleAgentExecuted(event: AgentExecuted): void {
  const opId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const op = new Operation(opId);

  const agentId = event.address.toHexString();
  op.agent = agentId;
  op.target = event.params.target;
  op.value = event.params.value.toBigDecimal();
  op.success = true;
  op.timestamp = event.block.timestamp;
  op.blockNumber = event.block.number;
  op.txHash = event.transaction.hash;
  op.save();

  // Update agent totals
  const agent = Agent.load(agentId);
  if (agent) {
    agent.totalOpsExecuted = agent.totalOpsExecuted.plus(BigInt.fromI32(1));
    agent.totalValueMoved = agent.totalValueMoved.plus(op.value);
    agent.save();
  }

  // Update protocol stats
  const stats = getOrCreateProtocolStats();
  stats.totalOps = stats.totalOps.plus(BigInt.fromI32(1));
  stats.totalValueMoved = stats.totalValueMoved.plus(op.value);
  stats.save();
}

/**
 * Handle AgentBlocked event
 * Creates Operation entity with success=false
 */
export function handleAgentBlocked(event: AgentBlocked): void {
  const opId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const op = new Operation(opId);

  const agentId = event.address.toHexString();
  op.agent = agentId;
  op.target = event.params.target;
  op.value = BigDecimal.fromString("0");
  op.success = false;
  op.timestamp = event.block.timestamp;
  op.blockNumber = event.block.number;
  op.txHash = event.transaction.hash;
  op.save();

  // Update protocol stats
  const stats = getOrCreateProtocolStats();
  stats.totalOps = stats.totalOps.plus(BigInt.fromI32(1));
  stats.save();
}

/**
 * Handle PolicyViolation event
 * Creates Violation entity and increments agent.violationCount
 */
export function handlePolicyViolation(event: PolicyViolation): void {
  const violationId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const violation = new Violation(violationId);

  violation.agent = event.params.agent.toHexString();
  violation.target = event.params.target;
  violation.selector = event.params.selector;
  violation.reason = event.params.reason;
  violation.timestamp = event.block.timestamp;
  violation.save();

  // Increment agent violation count
  const agent = Agent.load(event.params.agent.toHexString());
  if (agent) {
    agent.violationCount = agent.violationCount.plus(BigInt.fromI32(1));
    agent.save();
  }
}

/**
 * Handle SoftPaused event
 * Increments ProtocolStats.pauseEvents
 */
export function handleSoftPaused(event: SoftPaused): void {
  const stats = getOrCreateProtocolStats();
  stats.pauseEvents = stats.pauseEvents.plus(BigInt.fromI32(1));
  stats.save();
}
