# Before Shipping AI-Generated Payment Code

Use this when an agent is about to call payment code ready for merge, demo, deploy, or production.

## Required Preflight

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

## What Doctor Blocks

- Payment files missing `checkBeforePayment`.
- Unsafe x402, wallet, stablecoin, card, bank, paid API, or paid MCP paths.
- Repos expected to contain payment code but missing detectable payment flow.

## Agent Rule

Do not call payment code ready until Doctor passes and the runtime payment path checks Monarch before money moves.

## Verification Evidence

Before trusting the gate, run the same proof loop a third-party agent would run:

```bash
npm run smoke:external-agent
npm run benchmark:adversarial
```

The smoke harness installs packed Monarch packages into a fresh temp project, verifies unsafe payment code fails, patches with `checkBeforePayment`, verifies pass, checks `x402-doctor`, and replays hostile cases.

For native PR review, emit SARIF:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

SARIF is generated from the same Doctor result. It is not a runtime policy claim.
