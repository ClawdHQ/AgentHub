# AgentHub Deployment Guide

## Prerequisites

- Node.js v20+
- DOT for gas on Polkadot Hub Testnet
- Funded wallet (get testnet DOT from https://faucet.polkadot.io)

## Network Details

| Property | Value |
|----------|-------|
| Network Name | Polkadot Hub Testnet |
| Chain ID | 420420421 |
| RPC URL | https://testnet-passet-hub-eth-rpc.polkadot.io |
| Block Explorer | https://blockscout-passet-hub.parity-testnet.parity.io |
| Native Token | DOT (18 decimals) |
| Faucet | https://faucet.polkadot.io |

## Deploy Smart Contracts

```bash
cd contracts
cp .env.example .env
# Edit .env with your PRIVATE_KEY
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network polkadot-hub-testnet
```

Deployment addresses are written to `deployments/hub-testnet.json`.

## Verify Contracts (Blockscout)

```bash
npx hardhat verify --network polkadot-hub-testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Deploy Agent Service (Railway)

```bash
cd agent-service
cp .env.example .env
# Fill in all values from deployments/hub-testnet.json
npm install
npm run build
# Deploy to Railway: railway up
```

## Deploy Frontend (Vercel)

```bash
cd frontend
cp .env.example .env.local
# Fill in contract addresses from deployments/hub-testnet.json
npm install
npm run build
# Deploy: vercel --prod
```

## Post-Deployment Checklist

- [ ] EntryPoint v0.6 verified at 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
- [ ] GuardianPolicy WATCHER_ROLE granted to agent service wallet
- [ ] AgentFactory AGENT_OWNER_ROLE granted on GuardianPolicy
- [ ] AgentRegistry FACTORY_ROLE granted to AgentFactory
- [ ] AgentHubGovernor PROPOSER_ROLE granted on Timelock
- [ ] Frontend environment variables updated with contract addresses
- [ ] Subgraph deployed and indexed
