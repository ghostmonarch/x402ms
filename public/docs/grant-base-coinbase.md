# Base / Coinbase Grant Page

Monarch Shield gives Base and Coinbase AgentKit builders a local preflight gate before an AI agent signs wallet payments, submits x402 payloads, or moves USDC.

## Why It Matters

Base and Coinbase are becoming default surfaces for agent wallets, x402 payments, and stablecoin commerce. The risk is not only fraud after launch. The earlier risk is AI-generated payment code going live without a deterministic safety check.

## Shipped Proof

- Base x402 proof pack: unsafe x402 payment path to patched Base USDC preflight.
- Coinbase AgentKit proof pack: unsafe AgentKit / Agentic Wallet spend to patched `checkBeforePayment`.
- CI gate: `npx @monarch-shield/x402 doctor --ci --strict`.
- Public proof page: `https://x402ms.ai/proof/`.
- Agent docs: `/docs/monarch-for-base-x402.html` and `/docs/monarch-for-coinbase-agentkit.html`.

## Support Ask

Monarch is grant-relevant because it helps Base and Coinbase builders ship safer agent-payment examples, demos, hackathon submissions, and production integrations without replacing wallets or payment primitives.

Requested support:

- builder grant for proof pack expansion;
- marketing support for agent payment safety docs;
- advisor help on Base x402, AgentKit, and agentic wallet roadmap alignment.

## Reviewer Command

```bash
npm run qa:proof-packs
npx @monarch-shield/x402 doctor --ci --strict
```
