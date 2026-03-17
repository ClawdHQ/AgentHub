# AgentHub Architecture

## System Overview

```
User → Frontend (Next.js) → AI Service (Node.js + OpenAI) → ERC-4337 Bundler
                                                                     ↓
Explorer ← Blockscout ← Polkadot Hub EVM ← EntryPoint ← AgentAccount ← GuardianPolicy ← DeFi Protocols
```

## Components

### Smart Contracts (Polkadot Hub Testnet, chainId 420420421)

| Contract | Role |
|----------|------|
| `AgentAccount` | ERC-4337 smart account per AI agent (EIP-1167 minimal proxy) |
| `AgentFactory` | Deploys agent clones via OpenZeppelin Clones |
| `GuardianPolicy` | Risk enforcement — AccessControl + two-tier Pausable |
| `AgentRegistry` | On-chain index of all deployed agents |
| `AgentHubToken` | ERC20Votes governance token (AHT) |
| `AgentHubGovernor` | Scoped governance — propose() restricted to governableContracts |
| `AgentHubTimelock` | 24h delay on all governance actions |

### Off-Chain AI Service

| Module | Role |
|--------|------|
| `PolicyInterpreter` | GPT-4o converts natural language → structured policy |
| `StrategyExecutor` | Every 10min: reads state → asks GPT-4o → submits UserOp |
| `AnomalyDetector` | Watches events, detects gas spikes / consecutive blocks |
| `UserOperationBuilder` | Constructs and signs ERC-4337 UserOperations |
| `BundlerClient` | Submits to bundler with exponential backoff |
| `GuardianChecker` | Pre-validates via eth_call (no gas cost) |

### Frontend (Next.js 14)

| Component | Role |
|-----------|------|
| `page.tsx` | Dashboard: stats, agent grid, activity feed |
| `CreateAgentModal` | 4-step agent creation wizard |
| `GuardianStatus` | Real-time pause/violation status |
| `ActivityFeed` | Last 10 executed/blocked operations |

## OpenZeppelin Integration

| Component | Non-trivial Usage |
|-----------|------------------|
| `AccessControl` | Risk tier roles as financial policy enforcement, not admin |
| `Pausable` | Two-tier: softPause (withdrawals only) + hardPause (full halt) |
| `Governor` | propose() scoped to governableContracts whitelist |
| `TimelockController` | 24h delay, open executor role |
| `ERC20Votes` | AHT governance token with delegation |
| `Clones` | EIP-1167 minimal proxy for 10x cheaper agent deployment |
| `ECDSA` | AI signer signature verification in validateUserOp |
| `Initializable` | Clone initialization pattern for AgentAccount |

## Data Flow

1. User describes strategy in plain English
2. Frontend POSTs to `/api/policy` → PolicyInterpreter parses via GPT-4o
3. User reviews and deploys via AgentFactory.createAgent()
4. StrategyExecutor monitors agent every 10 minutes
5. GPT-4o generates recommended action
6. GuardianChecker simulates via eth_call
7. UserOperationBuilder constructs signed UserOp
8. BundlerClient submits to ERC-4337 bundler
9. EntryPoint calls AgentAccount.validateUserOp()
10. AgentAccount calls GuardianPolicy.validateOperation() (first check)
11. EntryPoint calls AgentAccount.execute()
12. AgentAccount calls GuardianPolicy.validateOperation() again (defense-in-depth)
13. Target DeFi protocol executes
14. AnomalyDetector monitors events, triggers softPause if needed
