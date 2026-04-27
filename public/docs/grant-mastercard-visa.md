# Mastercard / Visa Grant Page

Monarch Shield gives card-network agent-commerce builders a local safety gate before AI-generated code triggers tokenized checkout, card payments, or delegated commerce actions.

## Why It Matters

Agent commerce will increasingly touch card networks through tokenized credentials, delegated approvals, and merchant checkout flows. Monarch does not process card payments. It checks that agent-generated payment code has a preflight gate before live funds move.

## Shipped Proof

- Mastercard Agent Pay / Visa Intelligent Commerce proof pack: unsafe tokenized checkout to patched preflight.
- Rail detection for card, processor, paid API, wallet, and agent spend patterns.
- CI gate: `npx @monarch-shield/x402 doctor --ci --strict`.
- Public recording: `/card-network-agent-pay-proof-pack-recording.txt`.
- Public proof page: `https://x402ms.ai/proof/`.

## Support Ask

Monarch is useful as neutral developer infrastructure for safer agent-commerce examples, demos, and early integrations across card-network payment patterns.

Requested support:

- advisor feedback on card-agent safety requirements;
- ecosystem or innovation support for proof expansion;
- co-marketing around preflight checks before delegated commerce goes live.

## Reviewer Command

```bash
npm run qa:proof-packs
npx @monarch-shield/x402 doctor --ci --strict
```
