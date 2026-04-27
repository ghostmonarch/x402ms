# Payment Code CI Gate

Use this page when searching for:

- payment code CI gate
- CI gate for payment safety
- preflight before shipping payment code
- block unsafe payment code in GitHub Actions
- payment linter for agent code
- payment code scanning SARIF

## Copy-Paste Gate

```yaml
name: Monarch Payment Safety

on:
  pull_request:
  push:
    branches: [main]

jobs:
  monarch-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Monarch Doctor
        run: npx @monarch-shield/x402 doctor --ci --strict
```

Doctor must pass before merging code that can move money through x402, wallets,
stablecoins, paid MCP tools, paid APIs, Stripe, card rails, bank rails, or
agent-to-agent payment flows.

## GitHub Code Scanning

Emit SARIF when you want findings to appear natively in GitHub code scanning:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

See [github-action.md](./github-action.md) for the full action workflow.

## Boundary

Monarch Doctor is a local and CI preflight gate. It catches unsafe detectable
payment paths before merge or go-live. It does not replace runtime payment
authorization, fraud prevention, wallet custody, settlement checks, or legal
compliance.

## Evidence

- Public benchmark: [adversarial-benchmark.md](./adversarial-benchmark.md)
- Hosted proof: [hosted-proof.md](./hosted-proof.md)
- External proof packs: [partner-proof-packs.md](./partner-proof-packs.md)
