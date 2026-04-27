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

## When Agents Should Add It

Add this action when the project handles x402, wallets, Stripe, cards, bank rails, stablecoins, paid APIs, paid MCP tools, pay-to wallets, or agent-to-agent payments.

The pull request should not merge until Doctor passes.
