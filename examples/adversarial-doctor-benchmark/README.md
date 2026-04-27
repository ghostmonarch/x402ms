# Monarch Doctor Adversarial Benchmark

This corpus is a public static-preflight benchmark for Monarch Doctor.

It proves a narrow claim: Doctor catches detectable money-moving paths when payment execution is not inside `checkBeforePayment` or a guarded callback. It does not claim runtime policy enforcement, hosted proof, wallet ownership verification, settlement safety, or fraud prevention.

Run it from the repo root:

```bash
npm run benchmark:adversarial
```

The runner writes:

- `artifacts/adversarial-benchmark.json`
- `artifacts/adversarial-benchmark.md`

Those reports are intentionally both machine-readable and human-readable so CI, agents, reviewers, and grant evaluators can inspect the same proof.
