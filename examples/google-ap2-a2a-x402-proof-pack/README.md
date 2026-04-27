# Monarch for Google AP2 and A2A x402 Proof Pack

This proof pack is built for AP2, A2A, x402, and agent-commerce reviewers.

It proves:

- Doctor blocks unsafe AP2 / A2A x402 payment handling before go-live.
- Doctor passes after `checkBeforePayment` runs before an A2A x402 payment payload is submitted.
- The example is local-first and uses no real funds.
- The CI command is copy-pasteable for AP2 and A2A x402 agent projects.
- Public proof reports aggregate rails only and never include mandates, payment payloads, endpoint URLs, source code, or secrets.

## Run The Proof

```bash
npm run qa:google-ap2-a2a-x402
```

## Unsafe Project

```bash
node packages/x402/src/cli.js doctor --root examples/google-ap2-a2a-x402-proof-pack/unsafe --ci --strict
```

Expected: fails because `ap2-a2a-x402-payment.js` submits an A2A x402 payment payload for an AP2 mandate without a Monarch check.

## Patched Project

```bash
node packages/x402/src/cli.js doctor --root examples/google-ap2-a2a-x402-proof-pack/patched --ci --strict
```

Expected: passes because the AP2 / A2A x402 payment path calls `checkBeforePayment` first.

## Agent Instruction

If an AP2 or A2A agent can create a `CartMandate`, submit a `PaymentMandate`, handle `x402.payment.required`, attach `x402.payment.payload`, or request the A2A x402 extension, run Monarch Doctor before demo, merge, deploy, or go-live.
