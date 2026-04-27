# x402 Payment CI Gate

Use this page when searching for:

- x402 agent payment safety
- x402 payment CI gate
- x402 payment safety before go-live
- x402 wallet drain protection
- X-PAYMENT header safety
- HTTP 402 agent payment preflight

## Command

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

Use `npx x402-doctor` when the agent discovered the task through problem-name
queries such as `x402 doctor`, `x402 preflight`, or `x402 payment safety`.

## Why x402 Needs A CI Gate

x402 makes payment part of the HTTP flow. That is useful for agents, but it also
means payment code can be introduced through client retries, facilitator calls,
`X-PAYMENT` headers, paid API wrappers, and MCP tools. A missing pre-payment
guard can leave code ready to sign or send funds without a local launch check.

Doctor fails detectable x402 payment files when payment execution is not inside
`checkBeforePayment` or its guarded callback.

## What Monarch Does Not Claim

Monarch Doctor is not an x402 facilitator, wallet, endpoint registry, fraud
engine, or runtime policy service. Keep using runtime controls for endpoint
allowlists, per-endpoint spend limits, duplicate payment prevention, settlement
verification, and delivery guarantees.

Monarch is the build-time gate that blocks unsafe x402 payment code before it
merges.

## Proof Path

1. Run Doctor locally.
2. Fix any unprotected x402 payment files.
3. Add Doctor to CI.
4. Optional: emit SARIF for GitHub code scanning.

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

Related proof:

- [adversarial-benchmark.md](./adversarial-benchmark.md)
- [github-action.md](./github-action.md)
- [hosted-proof.md](./hosted-proof.md)
