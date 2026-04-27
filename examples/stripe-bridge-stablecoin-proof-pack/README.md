# Monarch for Stripe ACP / Bridge Stablecoin Flows Proof Pack

This proof pack is built for Stripe Agentic Commerce Protocol, Shared Payment Token, stablecoin, Bridge, and x402 machine-payment reviewers.

It proves:

- Doctor blocks unsafe agentic checkout and stablecoin settlement code before go-live.
- Doctor passes after `checkBeforePayment` runs before completing checkout or triggering stablecoin movement.
- The example is local-first and uses no real funds.
- The CI command is copy-pasteable for Stripe ACP, Bridge, and stablecoin-payment projects.
- Public proof reports aggregate rails only and never include payment tokens, endpoint URLs, source code, customer data, wallet addresses, amounts, or secrets.

## Run The Proof

```bash
npm run qa:stripe-bridge
```

## Unsafe Project

```bash
node packages/x402/src/cli.js doctor --root examples/stripe-bridge-stablecoin-proof-pack/unsafe --ci --strict
```

Expected: fails because `agentic-checkout-stablecoin.js` completes an ACP checkout and Bridge-style stablecoin flow without a Monarch check.

## Patched Project

```bash
node packages/x402/src/cli.js doctor --root examples/stripe-bridge-stablecoin-proof-pack/patched --ci --strict
```

Expected: passes because checkout completion and stablecoin movement call `checkBeforePayment` first.

## Agent Instruction

If a Stripe ACP or Bridge stablecoin project can complete checkout, process `PaymentData`, use a shared payment token, create a PaymentIntent, or settle USDC through a stablecoin rail, run Monarch Doctor before demo, merge, deploy, or go-live.
