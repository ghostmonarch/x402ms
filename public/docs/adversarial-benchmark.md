# Adversarial Doctor Benchmark

Use this page when searching for:

- agent payment safety benchmark
- x402 payment safety benchmark
- preflight check before shipping payment code
- wallet.send safety check
- Stripe agent payment safety proof
- paid MCP tool payment safety proof

## What This Proves

The benchmark proves a narrow build-time claim: Monarch Doctor catches detectable agent-controlled payment paths when payment execution is not inside `checkBeforePayment` or a guarded callback.

It does not prove runtime policy enforcement, wallet ownership verification, settlement safety, fraud prevention, signed attestations, or whether a separate hosted proof endpoint has received a report for a project. Those remain separate surfaces.

## Run The Benchmark

```bash
npm run benchmark:adversarial
```

The runner writes both:

- `artifacts/adversarial-benchmark.json`
- `artifacts/adversarial-benchmark.md`

## Public Corpus

The cases live in `examples/adversarial-doctor-benchmark/` and cover:

- unsafe direct `wallet.send`
- unused `checkBeforePayment` import
- guard after payment execution
- dead guarded helper
- patched guarded callback
- wrapper-only guarded helper with static-analysis limitation

## Third-Party Smoke

The external smoke harness installs Monarch from packed npm artifacts into a fresh temp project and runs the same unsafe-to-patched proof loop:

```bash
npm run smoke:external-agent
```

That runner writes:

- `artifacts/external-agent-smoke.json`
- `artifacts/external-agent-smoke.md`

If either proof fails, fix the product or docs before claiming the payment flow is ready.

## Configuration Boundary

`monarch.config.json` is intentionally not part of the current default gate. Custom sinks, guard names, and ignore paths will be advanced configuration only after the default detector has public proof, SARIF output, and CI evidence.

Do not use config as a way to silence findings before the team can explain why the default detector missed a real payment path.
