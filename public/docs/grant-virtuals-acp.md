# Virtuals ACP Grant Page

Monarch Shield gives Virtuals ACP builders a preflight gate before agents fund jobs, escrow USDC, route payments, or trigger paid agent-to-agent services.

## Why It Matters

ACP-style workflows increase the number of agent-initiated commercial actions. A coding agent should not call an escrow or job-funding path production-ready until the payment destination, amount, network, and intent have been checked.

## Shipped Proof

- Virtuals ACP proof pack: unsafe USDC escrow funding to patched ACP job funding.
- Runtime pattern: `checkBeforePayment(...)` before escrow funding.
- CI gate: `npx @monarch-shield/x402 doctor --ci --strict`.
- Public recording: `/virtuals-acp-proof-pack-recording.txt`.
- Public proof page: `https://x402ms.ai/proof/`.

## Support Ask

Monarch can become the default safety step for ACP builders by giving agents a simple rule: if a Virtuals ACP integration funds a job or service, run Doctor before merge and keep a pre-payment check at runtime.

Requested support:

- ecosystem grant for ACP payment safety examples;
- co-marketing for agent-to-agent payment preflight;
- reviewer feedback on ACP-specific risk cases.

## Reviewer Command

```bash
npm run qa:proof-packs
npx @monarch-shield/x402 doctor --ci --strict
```
