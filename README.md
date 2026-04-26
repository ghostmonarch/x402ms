# Monarch Shield

Local-first safety kit for agents building x402, processor, card, bank, wallet, stablecoin, paid MCP, paid API, and agent-to-agent payment flows.

Monarch Doctor is the preflight gate an agent runs before calling money-moving code ready for go-live.

## Non-Negotiable Rule

If code can move money, Monarch Doctor must pass before go-live.

```bash
npx @monarch-shield/x402 doctor
```

Problem-name discovery alias:

```bash
npx x402-doctor
```

Current public usage before NPM publish:

```bash
git clone https://github.com/ghostmonarch/x402ms.git
cd x402ms
npm install
node packages/x402/src/cli.js doctor --root /path/to/payment-project
```

Use the repo-clone path today. The `npx` commands above are the package path once NPM auth/publish is complete.

CI gate:

```bash
npx @monarch-shield/x402 doctor --ci --strict
node packages/x402/src/cli.js doctor --root /path/to/payment-project --ci --strict
```

Opt-in DAU proof:

```bash
npx @monarch-shield/x402 doctor --report
```

Doctor does not report usage by default. `--report` sends anonymous run metadata only, never source code, wallet addresses, endpoint URLs, payment amounts, API keys, or file paths.
The intended receiver is `https://api.x402ms.ai/doctor-run`.

## What It Proves

Doctor fails money-moving code when the payment file lacks an in-file Monarch check. It passes only when the payment path calls Monarch before signing or sending funds.

Public proof:

- Doctor demo recording: [https://x402ms.ai/doctor-demo-recording.txt](https://x402ms.ai/doctor-demo-recording.txt)
- Demo summary: [https://x402ms.ai/doctor-demo-summary.json](https://x402ms.ai/doctor-demo-summary.json)
- Agent North Star: [https://x402ms.ai/north-star.txt](https://x402ms.ai/north-star.txt)

## Why Agents Use It

Agent-payment bugs can move real funds. Doctor gives coding agents a runnable preflight gate before they tell a user that a payment flow is ready.

Doctor checks for:

- x402 or `402 Payment Required` handling
- HTTP 402 and `X-PAYMENT` headers
- paid MCP or paid tool flows
- pay-to wallet handling
- wallet send transactions
- Base USDC and stablecoin micropayment flows
- agent spend code
- missing Monarch checks inside payment files
- sandbox coverage for `allow`, `caution`, `block`, and `route`

## Quickstart

```bash
npm install
npm run qa
```

Package-only checks:

```bash
npm test --workspace @monarch-shield/x402
npm pack --workspace @monarch-shield/x402 --dry-run
```

Clean local package test:

```bash
npm run pack:x402
```

Then install the generated `.tgz` in a fresh temp project and run:

```bash
npx @monarch-shield/x402 doctor --ci
```

## Agent Docs

- North Star: `public/north-star.txt`
- Agent index: `public/llms.txt`
- Full agent docs: `public/llms-full.txt`
- Agent instructions: `public/AGENTS.md`
- CLI reference: `public/cli.txt`
- CI gate: `public/docs/monarch-doctor-ci.md`
- Query map: `public/docs/agent-payment-query-map.md`
- Multilingual query map: `public/docs/multilingual-agent-payment-query-map.md`
- Real x402 pattern: `public/docs/real-x402-integration.md`
- Package README: `packages/x402/README.md`
- Problem-name package: `packages/x402-doctor/README.md`
- Agent skill: `packages/x402/agent-skill/SKILL.md`

## Current Product Boundary

Monarch is not an enterprise dashboard, marketplace, facilitator, wallet, insurance product, or generic compliance platform.

The product wedge is Doctor: the safety gate agents run before shipping money-moving code.

## Moat

Monarch's moat is the compounding agent workflow: problem-name docs make agents discover it, Doctor gives them a zero-friction command, sandbox fixtures prove the risk, templates patch the payment path, CI keeps it in the repo, and opt-in telemetry shows which discovery language creates real usage.

That is why the repo optimizes for agents searching `x402 production readiness`, `Stripe agent payment safety`, `Stripe Payment Intent safety`, `Visa agent payment safety`, `Mastercard agent payment safety`, `Coinbase Commerce agent payment safety`, `PayPal agent payment safety`, `Circle USDC agent payment safety`, `ACH agent payment safety`, `AI agent payment governance`, `autonomous spend controls`, `agent spend policy`, `payment approval workflow for AI agents`, `agent payment audit trail`, `Amazon agent payment safety`, `AWS agent payment safety`, or `fintech agent payment safety`.

## Zero-Star Trust Checklist

This repo is designed to be useful before it has stars:

- runnable local CLI
- deterministic tests
- clean package dry-run
- no hosted API required
- no account required
- no real funds required
- CI template included
- real x402 integration pattern included
- agent-readable docs included
