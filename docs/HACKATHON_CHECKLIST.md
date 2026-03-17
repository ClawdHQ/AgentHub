# AgentHub Hackathon Checklist

## Bare Minimum Requirements
- [x] MIT License — LICENSE file present
- [x] Non-commercial codebase declared in README
- [x] <70% similarity to existing repos (original ERC-4337 + OZ composition)
- [ ] All team members verified on Polkadot Official Discord
- [ ] Valid commit history Mar 1–20 2026 (see CONTRIBUTING.md)

## Winner Criteria
- [ ] Polkadot wallet with on-chain identity (openguild.wtf guide)
- [x] GitHub README with full documentation
- [x] Next.js dashboard — responsive, dark mode, Tailwind
- [ ] Demo video: agent creation → strategy execution → guardian block → unpause vote
- [ ] Hosted: Vercel (frontend) + Railway (agent-service) + Hub Testnet (contracts)
- [x] Local dev guide in README
- [x] Roadmap (Phase 1/2/3) in README

## OpenZeppelin Bounty
- [x] AccessControl: risk tiers as financial policy enforcement
- [x] Pausable: two-tier AI-triggered system (softPause + hardPause)
- [x] Governor: propose() scoped to governableContracts only
- [x] TimelockController: 24h delay, scoped executor role
- [x] ERC20Votes: AHT governance token with delegation
- [x] Non-trivial usage table in README
- [ ] Deployed to Polkadot Hub Testnet

## Test Coverage
- [x] GuardianPolicy: 22 tests
- [x] AgentAccount: 8 tests
- [x] AgentFactory: 7 tests
- [x] Total: 37 tests, 100% passing
