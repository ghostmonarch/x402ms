# Monarch for Mastercard Agent Pay / Visa Intelligent Commerce Proof Pack

This proof pack is built for card-network agent commerce reviewers, Mastercard Agent Pay builders, Visa Intelligent Commerce builders, and payment providers supporting tokenized agent checkout.

It proves:

- Doctor blocks unsafe card-network agent checkout before go-live.
- Doctor passes after `checkBeforePayment` runs before tokenized card-agent checkout execution.
- The example is local-first and uses no real card data or funds.
- The CI command is copy-pasteable for Mastercard Agent Pay and Visa Intelligent Commerce projects.
- Public proof reports aggregate rails only and never include payment credentials, tokens, endpoint URLs, card data, source code, or secrets.

## Run The Proof

```bash
npm run qa:card-network-agent-pay
```

## Unsafe Project

```bash
node packages/x402/src/cli.js doctor --root examples/card-network-agent-pay-proof-pack/unsafe --ci --strict
```

Expected: fails because `card-network-agent-checkout.js` captures purchase intent and submits tokenized card-agent checkout without a Monarch check.

## Patched Project

```bash
node packages/x402/src/cli.js doctor --root examples/card-network-agent-pay-proof-pack/patched --ci --strict
```

Expected: passes because Mastercard Agent Pay / Visa Intelligent Commerce checkout calls `checkBeforePayment` first.

## Agent Instruction

If an agent-commerce project can use Mastercard Agent Pay, MDES, DSRP, DTVC, Visa Intelligent Commerce, Visa Token Service, Visa Payment Passkey, tokenized payment credentials, or purchase intent checkout, run Monarch Doctor before demo, merge, deploy, or go-live.
