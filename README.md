# AgentHub

> **Trust-minimized AI DeFi agent platform on Polkadot Hub.**

[![CI](https://github.com/ClawdHQ/AgentHub/actions/workflows/test.yml/badge.svg)](https://github.com/ClawdHQ/AgentHub/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-blue)](https://soliditylang.org)
[![Network](https://img.shields.io/badge/Network-Polkadot%20Hub%20Testnet-E6007A)](https://blockscout-testnet.polkadot.io)

AgentHub lets users deploy autonomous AI-powered DeFi agents that execute trading and staking strategies on-chain — with every action guarded by smart-contract-enforced risk policies. Describe your strategy in plain English; the platform translates it into structured guardrails, deploys a self-contained smart account, and runs it continuously with full on-chain auditability.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Deploy Smart Contracts](#2-deploy-smart-contracts)
  - [3. Configure the Agent Service](#3-configure-the-agent-service)
  - [4. Launch the Frontend](#4-launch-the-frontend)
- [Configuration Reference](#configuration-reference)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Subgraph](#subgraph)
- [Smart Contract Overview](#smart-contract-overview)
- [Governance](#governance)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Overview

AgentHub is a three-layer platform:

| Layer | What it does |
|-------|-------------|
| **Smart Contracts** | ERC-4337 smart accounts (one per agent), a risk-enforcement Guardian, and AHT-token governance — all deployed on Polkadot Hub Testnet (chainId 420420417) |
| **AI Policy Layer** | A Next.js server route that turns plain-English strategies into typed on-chain policies via OpenRouter using Gemini 2.5 Flash Lite |
| **Frontend Dashboard** | A Next.js 15 web app where users create agents with a 4-step wizard, monitor live agents, and participate in governance |

---

## Features

- **Natural-language policies** — describe a strategy in plain English; Gemini 2.5 Flash Lite via OpenRouter converts it to a typed, on-chain-verifiable policy (tier, limits, allowed protocols)
- **Guardian risk enforcement** — `GuardianPolicy` validates every user operation twice (in `validateUserOp` and `execute`) before any funds move
- **Two-tier pause system** — *soft pause* blocks new transactions (withdrawals still allowed); *hard pause* halts everything; both are triggered automatically by the anomaly detector
- **ERC-4337 account abstraction** — each agent is its own smart account; gas is sponsored via a bundler, so the agent's owner never needs to manage gas manually
- **EIP-1167 minimal proxies** — `AgentFactory` deploys clones for ~10× cheaper than full contract deployments
- **AHT governance** — token-holder voting with a 24-hour timelock for policy changes; `AgentHubGovernor.propose()` is scoped to a whitelist of governable contracts
- **On-chain indexing** — a Graph Protocol subgraph indexes all agent events for efficient querying
- **Full auditability** — every executed or blocked operation is recorded on-chain and surfaced in the UI

---

## Architecture

```
User → Frontend (Next.js) → OpenRouter (Gemini 2.5 Flash Lite) → Policy JSON
                                                               ↓
Explorer ← Blockscout ← Polkadot Hub EVM ← EntryPoint ← AgentFactory / AgentAccount ← GuardianPolicy
```

### Data Flow

1. User describes a strategy in plain English
2. Frontend POSTs to `/api/policy` → Gemini 2.5 Flash Lite via OpenRouter parses it into a typed policy
3. User reviews and deploys via `AgentFactory.createAgent()`
4. The deployed agent is visible immediately on the dashboard and detail pages
5. Future automated execution can plug into the same guarded contract stack
6. `GuardianChecker` simulates the operation via `eth_call` (no gas cost)
7. `UserOperationBuilder` constructs and signs the `UserOperation`
8. `BundlerClient` submits to the ERC-4337 bundler (with exponential-backoff retry)
9. `EntryPoint` calls `AgentAccount.validateUserOp()` → `GuardianPolicy.validateOperation()` *(first check)*
10. `EntryPoint` calls `AgentAccount.execute()` → `GuardianPolicy.validateOperation()` *(defense-in-depth)*
11. Target DeFi protocol executes
12. `AnomalyDetector` monitors events; triggers `softPause` when anomalies are detected

For a deeper dive, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Tech Stack

### Smart Contracts
| Technology | Version | Purpose |
|-----------|---------|---------|
| Solidity | 0.8.26 | Contract language |
| Hardhat | 2.22.0 | Build, test, and deploy framework |
| OpenZeppelin Contracts | 5.0.2 | AccessControl, Pausable, Governor, ERC20Votes, Clones, ECDSA, Initializable |
| Ethers.js | 6.13.0 | Blockchain interaction |
| TypeChain | ethers-v6 | Type-safe contract bindings |

### Agent Service
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | v20+ | Runtime |
| TypeScript | 5.4.5 | Language |
| OpenAI SDK | 4.47.1 | LLM client for the agent-service scaffold |
| Viem | 2.13.5 | Lightweight EVM library |
| Ethers.js | 6.13.0 | Contract calls and signing |
| Pino | 9.2.0 | Structured JSON logging |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.5.13 | Full-stack React framework (App Router) |
| React | 18 | UI library |
| RainbowKit | 2.2.8 | Wallet connection UI |
| Wagmi | 2.19.5 | Wallet integration and Ethereum hooks |
| Viem | 2.38.3 | Lightweight EVM client |
| TanStack React Query | 5.74.3 | Server-state management |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| Zod | 3.25.76 | Schema validation |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| The Graph | GraphQL indexing for on-chain events |
| Blockscout | Block explorer for Polkadot Hub Testnet |

### Network

| Property | Value |
|----------|-------|
| Network | Polkadot Hub Testnet |
| Chain ID | 420420417 |
| RPC URL | https://services.polkadothub-rpc.com/testnet |
| Block Explorer | https://blockscout-testnet.polkadot.io |
| Native Token | DOT (18 decimals) |
| Faucet | https://faucet.polkadot.io |

### Current deployed addresses

These are the live addresses currently configured by the frontend:

| Contract | Address |
|----------|---------|
| `AgentFactory` | `0x4344e79d2f5d660cbBC8bdDC497B86eD3951d828` |
| `GuardianPolicy` | `0x16B869b99619b0D1886b7A55898C66246510f3A0` |
| `AgentHubGovernor` | `0xCbC2863De6b856C848848990DCac0610e60F796B` |
| `EntryPoint` | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` |

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** (bundled with Node.js)
- **MetaMask** (or any EVM-compatible wallet)
- **DOT** on Polkadot Hub Testnet — get test tokens from the [faucet](https://faucet.polkadot.io)
- **OpenRouter API key** for Gemini 2.5 Flash Lite
- **WalletConnect Project ID** — create one free at [cloud.walletconnect.com](https://cloud.walletconnect.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ClawdHQ/AgentHub.git
cd AgentHub
```

---

### 2. Deploy Smart Contracts

```bash
cd contracts
npm install
cp .env.example .env
```

Edit `.env`:

```env
PRIVATE_KEY=0x<your_deployer_private_key>
# Optional overrides (defaults shown):
POLKADOT_HUB_TESTNET_RPC=https://services.polkadothub-rpc.com/testnet
REPORT_GAS=true
```

```bash
npx hardhat compile
npx hardhat test                                                     # all 37 tests must pass
npx hardhat run scripts/deploy.ts --network polkadot-hub-testnet
```

Contract addresses are written to `deployments/hub-testnet.json`. You will need these for the next two steps.

> **Post-deployment role setup** (see full checklist in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)):
> - Grant `WATCHER_ROLE` on `GuardianPolicy` to the agent-service wallet
> - Grant `AGENT_OWNER_ROLE` on `GuardianPolicy` to `AgentFactory`
> - Grant `FACTORY_ROLE` on `AgentRegistry` to `AgentFactory`
> - Grant `PROPOSER_ROLE` on `AgentHubTimelock` to `AgentHubGovernor`

---

### 3. Configure the Agent Service

```bash
cd ../agent-service
npm install
cp .env.example .env
```

Edit `.env` with values from `deployments/hub-testnet.json`:

```env
OPENAI_API_KEY=sk-...

AI_SIGNER_PRIVATE_KEY=0x...      # wallet that signs UserOperations
WATCHER_PRIVATE_KEY=0x...        # wallet used by AnomalyDetector

GUARDIAN_POLICY_ADDRESS=0x...
AGENT_FACTORY_ADDRESS=0x...
ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789

RPC_URL=https://services.polkadothub-rpc.com/testnet
BUNDLER_URL=http://localhost:3000/rpc

LOG_LEVEL=info
```

```bash
npm run build
npm start
```

---

### 4. Launch the Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=420420417
NEXT_PUBLIC_AGENT_FACTORY_ADDRESS=0x4344e79d2f5d660cbBC8bdDC497B86eD3951d828
NEXT_PUBLIC_GUARDIAN_POLICY_ADDRESS=0x16B869b99619b0D1886b7A55898C66246510f3A0
NEXT_PUBLIC_GOVERNOR_ADDRESS=0xCbC2863De6b856C848848990DCac0610e60F796B
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_walletconnect_project_id>
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/0/agenthub/version/latest
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=AgentHub
```

```bash
npm run build
npm start          # production
# or
npm run dev        # development with hot reload
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration Reference

### Smart Contracts (`contracts/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | ✅ | Deployer wallet private key |
| `POLKADOT_HUB_TESTNET_RPC` | ❌ | RPC endpoint (default: Polkadot Hub Testnet) |
| `REPORT_GAS` | ❌ | Print gas usage table after tests |

### Agent Service (`agent-service/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | LLM API key used by the agent-service scaffold |
| `AI_SIGNER_PRIVATE_KEY` | ✅ | Wallet that signs `UserOperation`s |
| `WATCHER_PRIVATE_KEY` | ✅ | Wallet used by `AnomalyDetector` |
| `GUARDIAN_POLICY_ADDRESS` | ✅ | Deployed `GuardianPolicy` address |
| `AGENT_FACTORY_ADDRESS` | ✅ | Deployed `AgentFactory` address |
| `ENTRY_POINT_ADDRESS` | ✅ | ERC-4337 `EntryPoint` address |
| `RPC_URL` | ✅ | JSON-RPC endpoint |
| `BUNDLER_URL` | ✅ | ERC-4337 bundler endpoint |
| `LOG_LEVEL` | ❌ | Pino log level (default: `info`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CHAIN_ID` | ✅ | Target chain ID (`420420417`) |
| `NEXT_PUBLIC_AGENT_FACTORY_ADDRESS` | ✅ | Deployed `AgentFactory` address |
| `NEXT_PUBLIC_GUARDIAN_POLICY_ADDRESS` | ✅ | Deployed `GuardianPolicy` address |
| `NEXT_PUBLIC_GOVERNOR_ADDRESS` | ✅ | Deployed `AgentHubGovernor` address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_SUBGRAPH_URL` | ✅ | The Graph subgraph endpoint |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key (used by Next.js API routes, server-side only) |
| `OPENROUTER_MODEL` | ❌ | OpenRouter model slug for policy parsing |
| `OPENROUTER_SITE_URL` | ❌ | Referrer header sent to OpenRouter |
| `OPENROUTER_APP_NAME` | ❌ | App name sent to OpenRouter |

---

## Running Locally

Run all three layers in separate terminals:

```bash
# Terminal 1 — local Hardhat node (optional, for contract development)
cd contracts && npx hardhat node

# Terminal 2 — agent service (development mode)
cd agent-service && npm run dev

# Terminal 3 — frontend (development mode with hot reload)
cd frontend && npm run dev
```

---

## Testing

### Smart Contracts

```bash
cd contracts

npx hardhat test                        # run all 37 tests
npx hardhat test --grep "AgentFactory"  # run a subset
npx hardhat coverage                    # generate coverage report
```

Test files:

| File | Tests |
|------|-------|
| `test/GuardianPolicy.test.ts` | 22 |
| `test/AgentAccount.test.ts` | 8 |
| `test/AgentFactory.test.ts` | 7 |

### Frontend

```bash
cd frontend && npm run lint   # ESLint
```

### CI

Every push and pull request to `main` triggers the [test workflow](.github/workflows/test.yml), which:
1. Compiles contracts and runs all Hardhat tests
2. Builds the Next.js frontend with test environment variables

---

## API Reference

### `POST /api/policy` — Interpret Strategy

Converts a plain-English trading strategy into a structured on-chain policy using Gemini 2.5 Flash Lite via OpenRouter.

**Request**
```json
{
  "strategy": "Stake DOT conservatively — never more than 1 DOT per transaction, max 5 DOT daily"
}
```

**Response**
```json
{
  "tier": 0,
  "maxSingleTxValue": "1000000000000000000",
  "maxDailyVolume": "5000000000000000000",
  "allowedProtocols": ["0x0000000000000000000000000000000000000804"],
  "allowedSelectors": ["0x12345678"],
  "xcmEnabled": false,
  "reasoning": "Conservative tier applied based on the strategy description.",
  "model": "google/gemini-2.5-flash-lite"
}
```

Rate limited to **10 requests per hour** per IP.

---

### `POST /api/agent` — Create Agent

Deploys a new AI agent smart account via `AgentFactory.createAgent()`.

**Request**
```json
{
  "ownerAddress": "0x...",
  "strategyDescription": "Stake rewards every week",
  "policyTier": 0,
  "maxSingleTxValue": "1000000000000000000",
  "maxDailyVolume": "5000000000000000000",
  "allowedProtocols": ["0x0000000000000000000000000000000000000804"],
  "allowedSelectors": ["0x12345678"]
}
```

**Response**
```json
{
  "txHash": "0x...",
  "agentAddress": "0x...",
  "blockNumber": 12345,
  "status": "confirmed"
}
```

---

## Subgraph

AgentHub uses [The Graph](https://thegraph.com) to index on-chain events for efficient querying by the frontend.

**Endpoint:** `https://api.studio.thegraph.com/query/0/agenthub/version/latest`

**Example queries:**

```graphql
# List agents
query GetAgents {
  agents(first: 10) {
    id
    owner
    strategyDescription
    riskTier
    isPaused
    createdAt
  }
}

# Recent executions
query GetRecentExecutions {
  agentExecuteds(first: 20, orderBy: timestamp, orderDirection: desc) {
    id
    agent
    target
    value
    callData
    timestamp
  }
}
```

Schema and event mappings are in the [`subgraph/`](subgraph/) directory.

---

## Smart Contract Overview

```
contracts/contracts/
├── core/
│   ├── AgentAccount.sol      # ERC-4337 smart account (EIP-1167 minimal proxy)
│   ├── AgentFactory.sol      # Deploys agent clones via OpenZeppelin Clones
│   └── AgentRegistry.sol     # On-chain index of all deployed agents
├── governance/
│   ├── AgentHubGovernor.sol  # Scoped governance (propose() restricted to whitelist)
│   ├── AgentHubToken.sol     # AHT — ERC20Votes governance token
│   └── AgentHubTimelock.sol  # 24h delay on all governance actions
├── guardian/
│   └── GuardianPolicy.sol    # Risk enforcement — AccessControl + two-tier Pausable
└── interfaces/
    ├── IAgentAccount.sol
    ├── IGuardianPolicy.sol
    ├── IEntryPoint.sol
    └── IUserOperation.sol
```

### OpenZeppelin Components

| Component | Usage |
|-----------|-------|
| `AccessControl` | Risk-tier roles as financial policy enforcement |
| `Pausable` | Two-tier: `softPause` (withdrawals only) + `hardPause` (full halt) |
| `Governor` | `propose()` scoped to a `governableContracts` whitelist |
| `TimelockController` | 24h delay with open executor role |
| `ERC20Votes` | AHT token with delegation support |
| `Clones` | EIP-1167 minimal proxy for ~10× cheaper agent deployment |
| `ECDSA` | AI-signer signature verification in `validateUserOp` |
| `Initializable` | Clone initialization pattern for `AgentAccount` |

### Key Interfaces

```solidity
// AgentAccount — ERC-4337 smart account
function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds) external returns (uint256);
function execute(address target, uint256 value, bytes calldata data) external;
function withdrawDepositTo(address payable withdrawAddress, uint256 amount) external;

// GuardianPolicy — risk enforcement
function validateOperation(address agent, bytes calldata callData, uint256 value) external view returns (bool valid, string memory reason);
function softPause(address agent) external;   // withdrawals only
function hardPause(address agent) external;   // full halt
function unpause(address agent) external;

// AgentFactory — clone deployment
function createAgent(
    address owner,
    string memory strategy,
    uint8 riskTier,
    uint256 maxSingleTx,
    uint256 maxDailyVolume,
    address[] memory allowedProtocols,
    bytes4[] memory allowedSelectors
) external returns (address agent);

// AgentRegistry — agent index
function getAgentsByOwner(address owner) external view returns (address[] memory);
function isRegistered(address agent) external view returns (bool);
```

---

## Governance

AHT token holders govern the protocol:

1. **Propose** — `AgentHubGovernor.propose()` (restricted to whitelisted contracts)
2. **Vote** — 1 AHT = 1 vote; delegation supported
3. **Queue** — approved proposals are queued in `AgentHubTimelock` with a 24-hour delay
4. **Execute** — after the delay, any address can execute the queued action

Governance actions include updating `GuardianPolicy` parameters, adding new protocols to the allowed list, and upgrading contracts.

---

## Deployment

Full step-by-step instructions — including contract verification on Blockscout, Railway deployment for the agent service, and Vercel deployment for the frontend — are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The automated [deploy workflow](.github/workflows/deploy.yml) runs on every push to `main` that modifies the `contracts/` directory and uses the `DEPLOYER_PRIVATE_KEY` GitHub secret.

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Commit conventions ([Conventional Commits](https://www.conventionalcommits.org/))
- Pull request process
- Code style guidelines (NatSpec on all public Solidity functions, strict TypeScript)

```bash
# Quick start for contributors
git clone https://github.com/ClawdHQ/AgentHub.git
cd AgentHub

cd contracts && npm install && npx hardhat compile && npx hardhat test
cd ../agent-service && npm install && npm run build
cd ../frontend && npm install && npm run build
```

---

## Security

- **Never commit private keys or API keys** — use `.env` files (already in `.gitignore`)
- Report security vulnerabilities via [GitHub Security Advisories](https://github.com/ClawdHQ/AgentHub/security/advisories)
- All `GuardianPolicy` role assignments must be reviewed before production use
- The ERC-4337 `EntryPoint` at `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` is a well-audited reference implementation

---

## License

[MIT](LICENSE) © 2026 ClawdHQ
