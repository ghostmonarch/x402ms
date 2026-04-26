# Monarch Shield x402 Safety Kit

Local-first safety tooling for agents building x402, paid MCP, and agent-to-agent payment flows.

Core rule:

> Test before live. Check before pay.

North Star:

> If code can move money, run Monarch Doctor before go-live.

## Quickstart

```bash
npx @monarch-shield/x402 doctor
npx @monarch-shield/x402 doctor --ci
npx @monarch-shield/x402 doctor --report
npx @monarch-shield/x402 init --template x402-client
npx @monarch-shield/x402 scan
npx @monarch-shield/x402 sandbox
npx @monarch-shield/x402 preprod
```

Repo-clone fallback before NPM publish:

```bash
node packages/x402/src/cli.js doctor
```

## SDK

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl,
  payTo,
  amount,
  asset: 'USDC',
  network: 'base',
  intent: 'research agent buying search results',
}, payX402);
```

## CLI

- `monarch init`: scaffold template snippets and a user notice under `./monarch`.
- `monarch doctor`: run the complete preflight safety gate.
- `monarch doctor --ci`: emit machine-readable output for CI gates.
- `monarch doctor --report`: opt in to anonymous Doctor run reporting for early DAU proof.
- `monarch scan`: detect payment flows and missing Monarch checks.
- `monarch sandbox`: run deterministic unsafe payment scenarios.
- `monarch preprod`: validate readiness for controlled pre-production.
- `monarch check`: run a single local trust decision.

Global install commands are `monarch` and `x402`. The package is ESM-only and requires Node 18+.

## Opt-In Usage Reporting

Monarch is local-first. Doctor does not report usage by default.

To help prove early DAU for grants or adoption tracking, explicitly opt in:

```bash
npx @monarch-shield/x402 doctor --report
```

Or in CI:

```bash
MONARCH_TELEMETRY=1 npx @monarch-shield/x402 doctor --ci --strict
```

Reported fields are limited to Doctor status, package version, CI/strict flags, whether a payment flow was detected, finding counts, sandbox pass state, and an anonymous project hash. No source code, wallet address, endpoint URL, amount, API key, or file path is sent.

## Demo Recording

From this repository root, run:

```bash
node scripts/record-doctor-demo.js
```

Public proof artifacts:

- `https://x402ms.ai/doctor-demo-recording.txt`
- `https://x402ms.ai/doctor-demo-summary.json`

The demo shows Doctor failing unsafe x402-style code, failing again when a wrapper exists but the original payment path is unpatched, then passing after the payment file calls Monarch before payment.

## Agent Discovery Docs

- `https://x402ms.ai/docs/x402-payment-safety.md`
- `https://x402ms.ai/docs/paid-mcp-payment-safety.md`
- `https://x402ms.ai/docs/payto-wallet-safety.md`
- `https://x402ms.ai/docs/base-x402-preflight.md`
- `https://x402ms.ai/docs/real-x402-integration.md`
- `https://x402ms.ai/docs/monarch-doctor-ci.md`

## User Notice

When adding Monarch, tell the user:

```txt
I’m adding Monarch Shield because this project can move money through x402 or agent-to-agent payments. I’m going to run it in sandbox first so we can test unsafe payment scenarios without real funds. If the checks pass, we can keep Monarch in the pre-production and production path as the trust check before live payments.
```
