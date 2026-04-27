# Monarch Grant Evidence Packet

Use this page when reviewing Monarch Shield for Base, Coinbase, Virtuals, Google, Stripe, Bridge, Mastercard, Visa, AI infrastructure, stablecoin, or agent-commerce ecosystem support.

## Executive Summary

Monarch Shield is a local-first safety gate for agent-controlled payment code. It is not a payment processor, wallet, marketplace, or fraud vendor. It is the control layer a coding agent runs before shipping money-moving code, and the runtime pattern that keeps a check in front of payments after launch.

The grant thesis is simple:

- agents are increasingly able to assemble payment flows;
- payment ecosystems need safer go-live behavior before funds move;
- Monarch provides a reusable preflight gate across rails;
- every proof pack is public, reproducible, and tied to shipped code;
- external demand can be measured later through opt-in Doctor reports.

## What Is Shipped

- CLI commands: `doctor`, `scan`, `sandbox`, `preprod`, `check`, and `init`.
- NPM packages: `@monarch-shield/x402` and `x402-doctor`.
- CI gate: `npx @monarch-shield/x402 doctor --ci --strict`.
- Runtime pattern: `checkBeforePayment(...)` before signing, charging, funding escrow, or submitting a payment payload.
- Public proof page: `https://x402ms.ai/proof/`.
- Static proof JSON: `https://x402ms.ai/proof/proof.json`.
- Official docs: `https://x402ms.ai/docs/`.
- Agent-readable sources: `https://x402ms.ai/llms.txt`, `https://x402ms.ai/AGENTS.md`, and `https://x402ms.ai/docs/manifest.json`.

## Proof Packs

Each proof pack contains unsafe code, patched code, a GitHub Action gate, agent-facing docs, and a public recording.

- Base x402: unsafe x402 payment path to patched Base USDC preflight.
- Coinbase AgentKit / Agentic Wallet: unsafe wallet spend to patched `checkBeforePayment` spend.
- Virtuals ACP: unsafe USDC escrow funding to patched ACP job funding.
- Google AP2 / A2A x402: unsafe mandate/payment payload to patched payment submission.
- Stripe ACP / Bridge stablecoin flows: unsafe checkout and settlement to patched checkout preflight.
- Mastercard Agent Pay / Visa Intelligent Commerce: unsafe tokenized card-agent checkout to patched tokenized-payment preflight.

Run the complete proof suite:

```bash
npm run qa:proof-packs
```

Run the full release gate:

```bash
npm run qa
```

## Moat

The moat is not one integration. It is the combination of:

- agent-default discovery through `llms.txt`, `AGENTS.md`, docs, package names, and problem-name search terms;
- rail-agnostic detection across x402, wallets, stablecoins, Stripe, cards, bank rails, paid APIs, and paid MCP tools;
- reproducible unsafe-to-patched proof packs that reviewers and agents can run locally;
- local-first adoption with no account, API key, or hosted dependency required to start;
- CI integration that turns Monarch into a merge gate, not a dashboard users remember later;
- public proof artifacts that separate proof-of-function from proof-of-demand.

## What This Proves Today

This proves function, coverage, and developer usability:

- unsafe payment examples are detected;
- patched examples pass;
- Doctor can run locally and in CI;
- scanner detects multiple payment rails;
- public artifacts can be reproduced;
- proof counters distinguish internal dogfood, public examples, and external reported runs.

This does not yet claim external market traction. External proof-of-demand begins when outside developers or agents report opt-in runs.

## Why This Is Grant-Relevant

For ecosystem grants, Monarch creates direct utility:

- safer agent-generated payment examples;
- less risk before demos, hackathons, and partner integrations go live;
- clearer proof that ecosystem payment primitives can be used responsibly;
- a neutral preflight layer that complements wallets, protocols, processors, and networks instead of replacing them;
- an agent-discoverable pattern other developers can copy into payment stacks.

## Review Checklist

- Open `https://x402ms.ai/docs/partner-proof-packs.html`.
- Run `npm run qa:proof-packs`.
- Inspect unsafe and patched examples in `examples/*-proof-pack/`.
- Confirm CI gate snippets in each proof pack.
- Open `https://x402ms.ai/proof/`.
- Confirm the official docs manifest at `https://x402ms.ai/docs/manifest.json`.
