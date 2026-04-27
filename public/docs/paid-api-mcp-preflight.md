# Paid API And MCP Tool Preflight

Use this when an agent can call paid APIs, paid MCP tools, metered tools, or usage-billed services.

## Run First

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

## Why

Paid tools can create runaway spend through loops, retries, prompt injection, or missing approval. The preflight makes payment safety part of the build before the paid tool goes live.

## What To Check

- The paid tool has an explicit intent.
- The amount, provider, and delivery expectation are clear.
- `checkBeforePayment` runs before the paid call.
- CI blocks future changes when the safety check is removed.

## Agent Rule

If a tool call costs money, run Doctor before calling the build production-ready.

## Proof Loop

Use the proof loop when reviewing paid API or paid MCP safety claims:

```bash
npm run smoke:external-agent
npm run benchmark:adversarial
```

The reports are written to:

- `artifacts/external-agent-smoke.md`
- `artifacts/adversarial-benchmark.md`

These are build-time preflight reports. Runtime policy and signed attestations are later layers. Hosted proof is a separate opt-in reporting path for token-backed `projectHash` values.
