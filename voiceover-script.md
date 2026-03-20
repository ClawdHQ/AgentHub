# AgentHub Demo Voiceover Script

## Goal

Use this script for a polished 4-minute hackathon walkthrough of the AgentHub frontend.

## Recording setup

- Start with the browser already open on the homepage.
- Keep a wallet connected to Polkadot Hub Testnet before recording.
- If live deployment is slow, keep Blockscout open in another tab as backup proof.
- Keep the cursor movements deliberate and slow enough for viewers to follow.

## 4-minute run of show

### 0:00 - 0:25 | Hook + homepage

**On screen**
- Open the homepage.
- Pause on the hero section and stats bar.

**Voiceover**

"This is AgentHub, a trust-minimized platform for AI-powered DeFi agents on Polkadot Hub. The idea is simple: I describe a strategy in plain English, the app converts it into an on-chain policy, and the deployed agent can only operate inside those guardrails. The headline here is our core product philosophy: the AI drives, but the Guardian holds the brakes."

### 0:25 - 0:50 | Live dashboard

**On screen**
- Scroll slightly to show the stats bar and the live agents section.
- Hover over one of the agent cards if available.

**Voiceover**

"The dashboard gives an immediate view into the live protocol state. We surface total agents, estimated TVL, protocol coverage, and recently deployed agents directly from on-chain events. So this is not a static mockup dashboard; it reflects what has actually been deployed to Polkadot Hub Testnet."

### 0:50 - 1:10 | Wallet + navigation

**On screen**
- Move to the header.
- Briefly point at the wallet button and the Governance nav item.
- Click `Launch Agent`.

**Voiceover**

"At the top, users can connect a wallet with RainbowKit, move between the dashboard and governance, and jump straight into agent creation. I’ll open the new-agent flow now."

### 1:10 - 1:45 | Step 1: describe the strategy

**On screen**
- On the new agent page, click `Open Agent Wizard`.
- In step one, paste or type a strategy like: `Stake DOT conservatively, never more than 1 DOT per transaction, maximum 5 DOT per day.`
- Click `Parse with AI`.

**Voiceover**

"This is the core user experience. Instead of asking the user to manually assemble risk parameters, AgentHub starts from natural language. Here I’m describing a conservative staking strategy, including transaction-level and daily limits. When I submit this, the app sends the strategy to our server route, which uses Gemini 2.5 Flash Lite through OpenRouter to generate a structured policy."

### 1:45 - 2:10 | Step 2: policy review

**On screen**
- Pause on the policy review step.
- Point to risk tier, max single transaction, max daily volume, and XCM status.

**Voiceover**

"Now the strategy has been translated into explicit guardrails. The user can review the risk tier, spending limits, allowed protocol scope, and whether cross-chain execution is enabled. This is important because AgentHub is designed to make AI behavior auditable and constrained before deployment, not after something goes wrong."

### 2:10 - 2:35 | Step 3 and 4: configure and deploy

**On screen**
- Continue to configuration.
- Enter an AI signer address.
- Move to the review step.
- Click `Deploy Agent`.
- If a transaction is already deployed, show the pending status, tx hash link, or the redirected agent page.

**Voiceover**

"In the next step, I provide the AI signer that will authorize future actions for the agent. Then I review the final deployment summary and submit the transaction. The frontend now predicts the resulting agent address, tracks the transaction state, and gives a fallback path even if RPC receipt confirmation is slower than the explorer."

### 2:35 - 3:00 | Agent detail page

**On screen**
- Show the redirected agent page or open an existing agent card from the homepage.
- Pause on Guardian Status and Activity.

**Voiceover**

"After deployment, each agent gets its own detail page. This page is the foundation for observability: Guardian status, recent activity, and eventually deeper operational analytics. Even at this stage, the frontend makes the smart account feel like a product surface rather than just a contract address."

### 3:00 - 3:25 | Governance page

**On screen**
- Click into `Governance`.
- Scroll the proposals list.

**Voiceover**

"AgentHub also includes a governance interface. Token holders can review proposals and participate in protocol-level changes. That matters because the risk system itself should be governable over time, whether that means updating policy parameters, approving new protocols, or evolving the guardrail model as the ecosystem matures."

### 3:25 - 3:50 | Why this matters

**On screen**
- Return to the homepage hero section.
- Slowly scroll through live agents again.

**Voiceover**

"What makes AgentHub compelling is the combination of usability and safety. Users get an interface that feels like chatting with an intelligent product, but underneath that experience is a smart-contract-enforced policy layer on Polkadot Hub. So the AI is useful, but it is never unconstrained."

### 3:50 - 4:00 | Close

**On screen**
- End on the homepage with the AgentHub wordmark visible.

**Voiceover**

"That is AgentHub: natural-language strategy creation, on-chain guardrails, live deployment on Polkadot Hub, and a governance layer for long-term evolution. Thank you for watching."

## Backup lines if something stalls live

- "If the RPC is slow, I can still verify the deployment immediately through the explorer link."
- "The important point here is that the UI maps directly to an on-chain agent deployment, not just a mock submission."
- "This live dashboard updates from chain reads and recent deployment events."
