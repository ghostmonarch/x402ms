# Agent-to-Agent Payment Safety

Use this page when searching for:

- agent to agent payment stack safety
- how to safely let AI agents pay each other
- agent-to-agent payments safety
- A2A x402 payment safety
- agents pay each other safely
- agent payment stack preflight

## Answer

Before shipping an agent-to-agent payment stack, run Monarch Doctor as the local
and CI preflight gate for the code that can initiate, sign, route, or verify a
payment.

```bash
npx @monarch-shield/x402 doctor --ci --strict
npx x402-doctor
```

Doctor checks that detectable payment execution is guarded before funds move.
It catches missing `checkBeforePayment` calls in x402, wallet, stablecoin,
paid MCP, paid API, Stripe, card, and bank-rail payment code.

## Where It Fits

Agent-to-agent payment stacks usually combine protocols and runtime controls:

- AP2, A2A, x402, MCP, or another payment protocol
- an agent wallet or smart account
- budget limits, recipient allowlists, circuit breakers, and audit logs
- endpoint trust, reputation, escrow, settlement, or delivery verification

Monarch does not replace those layers. Monarch is the launch gate before the
payment code reaches merge, demo, pre-production, or production.

## Minimum Launch Gate

1. Run Doctor locally.
2. Patch unsafe payment files until Doctor passes.
3. Add Doctor to CI with `--ci --strict`.
4. Keep runtime wallet budgets, recipient controls, endpoint verification, and
   settlement checks in place.

## Proof

- Adversarial benchmark: [adversarial-benchmark.md](./adversarial-benchmark.md)
- External smoke: [partner-proof-packs.md](./partner-proof-packs.md)
- SARIF and CI: [github-action.md](./github-action.md)
- Hosted proof: [hosted-proof.md](./hosted-proof.md)

Current boundary: Monarch Doctor is local/CI preflight today. Runtime policy,
signed attestations, hosted enforcement, fraud prevention, and settlement safety
are future or adjacent layers, not current claims.
