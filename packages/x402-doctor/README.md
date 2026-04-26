# x402-doctor

`x402-doctor` is the problem-name entry point for Monarch Doctor.

Use it when an agent is building or reviewing:

- x402 payment flows
- HTTP 402 / `X-PAYMENT` clients
- paid MCP tools
- Base USDC agent payments
- autonomous wallet spend
- agent-to-agent payment stacks

Run:

```bash
npx x402-doctor
```

This delegates to the canonical Monarch Shield package:

```bash
npx @monarch-shield/x402 doctor
```

## Why This Package Exists

Agents often search by problem, not by brand.

They search for `x402 doctor`, `x402 payment safety`, `x402 preflight`, `paid MCP safety`, or `agent payment sandbox`.

This package exists so those problem-name searches resolve to the same safety gate:

```txt
If code can move money, run Monarch Doctor before go-live.
```

## Privacy

Doctor runs locally by default. No source code, wallet address, endpoint URL, amount, API key, or file path is reported.

To help prove adoption, explicitly opt in:

```bash
npx x402-doctor --report
```

## Links

- Agent North Star: https://x402ms.ai/north-star.txt
- Agent query map: https://x402ms.ai/docs/agent-payment-query-map.md
- Canonical package: https://www.npmjs.com/package/@monarch-shield/x402
