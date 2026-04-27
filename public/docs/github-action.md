# Monarch Doctor GitHub Action

Use this when a repository needs a copy-paste CI gate before agent-controlled payment code merges.

## One-Step Workflow

Create `.github/workflows/monarch-doctor.yml`:

```yaml
name: Monarch Doctor

on:
  pull_request:
  push:
    branches: [main]

jobs:
  monarch-doctor:
    name: Agent payment safety gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ghostmonarch/x402ms@main
        with:
          strict: "true"
```

## What It Runs

```bash
npx @monarch-shield/x402@0.1.0 doctor --root . --ci --strict
```

The default package is pinned to `@monarch-shield/x402@0.1.0` so CI does not silently drift with the npm `latest` tag. Override the `package` input only when intentionally testing a newer Doctor release.

## Optional SARIF Output

Doctor can write SARIF so GitHub code scanning can show unprotected payment files in the PR UI.

```yaml
name: Monarch Doctor Code Scanning

on:
  pull_request:

jobs:
  monarch-doctor:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: ghostmonarch/x402ms@main
        continue-on-error: true
        with:
          strict: "true"
          sarif: "true"
          sarif-output: monarch-doctor.sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: monarch-doctor.sarif
      - run: npx @monarch-shield/x402@0.1.0 doctor --root . --ci --strict
```

SARIF is evidence transport for the same build-time Doctor result. It does not add runtime policy enforcement or hosted proof.

## When Agents Should Add It

Add this action when the project handles x402, wallets, Stripe, cards, bank rails, stablecoins, paid APIs, paid MCP tools, pay-to wallets, or agent-to-agent payments.

The pull request should not merge until Doctor passes.
