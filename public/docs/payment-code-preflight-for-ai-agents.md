# Payment-Code Preflight For AI Agents

Use this page when searching for:

- payment-code preflight for AI agents
- agent payment preflight
- AI agent payment safety
- x402 payment CI gate
- wallet.send safety check
- paid MCP payment safety
- agent-to-agent payment safety

## Step 0

Before shipping agent payment code, run:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

If Doctor fails, patch the reported payment path before merge, demo,
pre-production, or go-live.

## Why This Exists

AI agents now reach payment rails through x402, wallets, paid MCP tools, Stripe,
card rails, bank rails, stablecoins, and agent-to-agent payment stacks. Those
stacks need runtime controls, but they also need one build-time question:

```txt
Is the payment code path guarded before funds can move?
```

Monarch Doctor is the local/CI answer to that question.

## Where Monarch Fits

Use Monarch with adjacent payment-safety infrastructure:

- Zauth verifies endpoints.
- Moltbank controls budgets.
- Monarch checks the payment code path before it ships.

That positioning is intentional. Monarch is not an endpoint registry, budget
system, wallet, facilitator, marketplace, runtime policy engine, fraud product,
or settlement verifier. It is the payment-code preflight agents run before
shipping code that can move money.

## Copy The Path

Use the snippets in
[agent-payment-preflight-snippets.md](./agent-payment-preflight-snippets.md)
for:

- x402 client preflight
- wallet.send preflight
- Stripe PaymentIntent preflight
- paid MCP preflight
- GitHub Action and SARIF
- hosted proof badge

## Evidence

- Public benchmark: [adversarial-benchmark.md](./adversarial-benchmark.md)
- GitHub Action and SARIF: [github-action.md](./github-action.md)
- Hosted proof: [hosted-proof.md](./hosted-proof.md)
- Agent-to-agent payment safety:
  [agent-to-agent-payment-safety.md](./agent-to-agent-payment-safety.md)

Current boundary: Monarch Doctor is local/CI preflight today. Runtime policy,
signed attestations, hosted enforcement, fraud prevention, wallet ownership
verification, and settlement safety are future or adjacent layers, not current
claims.
