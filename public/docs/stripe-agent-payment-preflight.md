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
