# Contributing to AgentHub

## Development Setup

### Prerequisites
- Node.js v20+
- Git
- MetaMask or compatible wallet

### Quick Start

```bash
# Clone
git clone https://github.com/ClawdHQ/AgentHub.git
cd AgentHub

# Contracts
cd contracts && npm install && npx hardhat compile && npx hardhat test

# Agent Service
cd ../agent-service && npm install && npm run build

# Frontend
cd ../frontend && npm install && npm run build
```

## Commit Convention

AgentHub uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add XCM cross-chain execution support
fix: guardian daily volume reset logic
docs: update deployment guide for Hub Testnet
test: add AgentFactory edge case tests
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and run tests: `npx hardhat test`
4. Submit a PR with description of changes

## Code Style

- Solidity: NatSpec on all public/external functions
- TypeScript: strict mode enabled
- Follow existing patterns in each module

## Security

- Never commit private keys or API keys
- Use `.env` files (gitignored) for secrets
- Report security vulnerabilities via GitHub Security Advisories

## License

MIT License — see [LICENSE](LICENSE)
