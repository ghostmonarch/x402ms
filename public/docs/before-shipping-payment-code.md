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
