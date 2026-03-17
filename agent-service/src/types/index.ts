// SPDX-License-Identifier: MIT
export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}

export type RiskTier = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export interface ParsedPolicy {
  tier: RiskTier;
  maxSingleTxValue: bigint;
  maxDailyVolume: bigint;
  allowedProtocolNames: string[];
  allowedSelectors: string[];
  xcmEnabled: boolean;
  reasoning: string;
}

export interface AgentAction {
  action: 'stake' | 'unstake' | 'swap';
  target: string;
  amount: string;
  calldata: string;
  reasoning: string;
}

export interface AgentState {
  agentAddress: string;
  ownerAddress: string;
  balance: bigint;
  entryPointDeposit: bigint;
  active: boolean;
  strategyDescription: string;
}

export interface SimulationResult {
  valid: boolean;
  reason: string;
  gasEstimate?: bigint;
}

export interface BundlerResult {
  userOpHash: string;
  txHash?: string;
  status: 'submitted' | 'included' | 'failed';
  error?: string;
}

export interface AnomalyEvent {
  type: 'GasSpike' | 'ConsecutiveBlocks' | 'ValueAnomaly' | 'UnknownTarget';
  agentAddress: string;
  details: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RollingMetrics {
  agentAddress: string;
  gasSpend7Day: bigint[];
  consecutiveBlocks: number;
  valueSamples: bigint[];
  lastKnownTargets: string[];
}
