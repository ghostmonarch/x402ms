# Paid MCP Payment Preflight

Use this page when searching for:

- paid MCP payment preflight
- paid MCP tool safety
- MCP server monetization safety
- paid tool call safety
- agent pays MCP tool safely
- MCP payment CI gate

## Required Gate

```bash
npx @monarch-shield/x402 doctor --ci --strict
npx x402-doctor
```

Run Doctor before shipping a paid MCP server, paid MCP client, metered tool, or
agent action that can charge money, spend wallet funds, or trigger a paid API.

## Why Paid MCP Needs Preflight

Paid tools can be reached through agent loops, prompt injection, retries,
tool-poisoning, or changed tool metadata. A tool call that costs money should
not be considered production-ready until payment execution is guarded and CI
keeps it guarded.

Doctor checks for paid MCP, paid API, x402, wallet, and agent-payment code. It
fails when detectable payment execution is unprotected.

## What To Keep Separate

MCP authentication, OAuth, endpoint registry trust, budget controls, provider
status, delivery verification, and runtime approval flows still matter. Monarch
Doctor is the build-time payment-code gate, not a runtime MCP marketplace or
hosted policy engine.

## Proof

- Benchmark: [adversarial-benchmark.md](./adversarial-benchmark.md)
- CI and SARIF: [github-action.md](./github-action.md)
- Hosted proof: [hosted-proof.md](./hosted-proof.md)
- Related doc: [paid-api-mcp-preflight.md](./paid-api-mcp-preflight.md)
