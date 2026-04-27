# Stripe / Bridge Grant Page

Monarch Shield gives agent-commerce builders a preflight gate before AI-generated code creates checkouts, charges cards, initiates payouts, or settles with stablecoins.

## Why It Matters

Stripe and Bridge represent two sides of the same agent-commerce problem: agents can now assemble fiat checkout and stablecoin settlement flows quickly. Monarch makes the safety step explicit before that code goes live.

## Shipped Proof

- Stripe ACP / Bridge proof pack: unsafe checkout and settlement flow to patched preflight.
- Rail detection for Stripe, stablecoin, wallet, card, and paid API patterns.
- CI gate: `npx @monarch-shield/x402 doctor --ci --strict`.
- Public recording: `/stripe-bridge-stablecoin-proof-pack-recording.txt`.
- Public proof page: `https://x402ms.ai/proof/`.

## Support Ask

Monarch can help Stripe/Bridge-style builders reduce unsafe demo and production patterns by making Doctor the standard local gate before payment code merges.

Requested support:

- startup credits or partner feedback for hosted proof infrastructure;
- review of stablecoin settlement risk cases;
- marketing support around safe agent checkout examples.

## Reviewer Command

```bash
npm run qa:proof-packs
npx @monarch-shield/x402 doctor --ci --strict
```
