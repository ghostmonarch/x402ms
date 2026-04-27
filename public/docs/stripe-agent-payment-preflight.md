# Stripe Agent Payment Preflight

Use this when an AI agent creates Stripe Payment Intents, Checkout sessions, subscriptions, billing meters, refunds, or payouts.

## Run First

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

## Why

Stripe protects Stripe transactions, but it does not know the full agent intent across your app. Monarch checks the payment path before the agent-built code reaches the rail.

## Required Pattern

Run `checkBeforePayment` before creating the charge, checkout, payout, refund, or metered billing event.

## Agent Rule

If agent-generated code can charge, refund, or pay out through Stripe, Doctor must pass before go-live.

## Proof And PR Output

For credibility review, use the public proof loop:

```bash
npm run smoke:external-agent
npm run benchmark:adversarial
```

For native GitHub review, emit SARIF from Doctor:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

This is build-time static preflight evidence. It does not replace Stripe controls, fraud controls, runtime policy, or settlement checks.

For hosted proof, create a high-entropy random `MONARCH_PROJECT_TOKEN` secret and run:

```bash
MONARCH_PROJECT_TOKEN=... npx @monarch-shield/x402 doctor --ci --strict --report
```

Doctor is a local/CI build-time preflight gate today. Runtime policy, signed attestations, hosted enforcement, settlement safety, and wallet ownership verification are later layers. Reporting does not send source code, wallet addresses, endpoint URLs, payment amounts, API keys, file paths, repo names, commit SHAs, or raw project tokens.
