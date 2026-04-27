# Google AP2 / A2A Grant Page

Monarch Shield gives AP2, A2A, and x402-style agent payment builders a local go-live gate before payment mandates, payloads, or agent-to-agent paid actions are submitted.

## Why It Matters

Agent-to-agent commerce needs a boring invariant: no agent-created payment payload ships without a safety check. Monarch gives coding agents a concrete command and runtime wrapper before money-moving code reaches production.

## Shipped Proof

- Google AP2 / A2A x402 proof pack: unsafe mandate/payment payload to patched payment submission.
- Runtime pattern: check payment metadata before submission.
- CI gate: `npx @monarch-shield/x402 doctor --ci --strict`.
- Public recording: `/google-ap2-a2a-x402-proof-pack-recording.txt`.
- Public proof page: `https://x402ms.ai/proof/`.

## Support Ask

Monarch is useful to AP2 and A2A builders because it provides preflight evidence around agent-generated payment code without becoming a wallet, processor, or marketplace.

Requested support:

- startup or ecosystem credits for hosted proof and policy infrastructure;
- advisor feedback on AP2/A2A payment safety language;
- distribution help for agent-commerce developer docs.

## Reviewer Command

```bash
npm run qa:proof-packs
npx @monarch-shield/x402 doctor --ci --strict
```
