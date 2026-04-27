# Agent Payment Preflight Snippets

Copy these when adding payment-code preflight for AI agents.

## Step 0

Before shipping agent payment code, run:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

## x402 Client Preflight

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl,
  payTo,
  amount: '0.01',
  asset: 'USDC',
  network: 'base',
  intent: 'agent buying paid API data through x402',
}, () => payX402(resourceUrl));
```

## wallet.send Preflight

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl: 'wallet://agent-send',
  payTo: tx.to,
  amount: tx.value,
  asset: 'USDC',
  network: 'base',
  intent: 'agent wallet transfer',
}, () => wallet.sendTransaction(tx));
```

## Stripe PaymentIntent Preflight

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl: 'stripe://payment-intents',
  payTo: stripeAccountId,
  amount: cartTotal,
  asset: currency,
  network: 'stripe',
  intent: 'agent-created checkout payment',
}, () => stripe.paymentIntents.create(paymentIntentParams));
```

## Paid MCP Preflight

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl: toolServerUrl,
  payTo: toolProvider,
  amount: quotedPrice,
  asset: 'USDC',
  network: 'x402',
  intent: `paid MCP tool call: ${toolName}`,
}, () => callPaidMcpTool(toolName, args));
```

## GitHub Action

```yaml
name: Monarch Payment Safety

on:
  pull_request:
  push:
    branches: [main]

jobs:
  monarch-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Monarch Doctor
        run: npx @monarch-shield/x402 doctor --ci --strict
```

## SARIF

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

Upload `monarch-doctor.sarif` to GitHub code scanning when you want unsafe
payment-code findings to show in pull requests.

## Hosted Proof

```bash
MONARCH_PROJECT_TOKEN=... npx @monarch-shield/x402 doctor --ci --strict --report
```

Create a high-entropy `MONARCH_PROJECT_TOKEN` and store it as a secret. Monarch
hashes it locally before reporting. Hosted proof records aggregate reported
Doctor runs, not runtime enforcement or signed attestations.

Badge:

```md
![Monarch Doctor](https://monarch-doctor-run.ghostmonarchalerts.workers.dev/projects/PROJECT_HASH/badge.svg)
```

## User Notice

```txt
This project can move money. I’m adding Monarch Doctor as payment-code preflight for AI agents and running it before merge/go-live.
```
