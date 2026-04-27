# Monarch Doctor CI Gate

Use this when an agent-payment project needs a non-negotiable preflight check in CI.

## Agent Rule

If the project can move money, Doctor must run locally before go-live and in CI before merges.

```bash
npx @monarch-shield/x402 doctor --ci
```

`--ci` prints JSON so coding agents, GitHub Actions, and other automation can parse the result.

Use `--strict` when the repository is expected to contain x402, processor, card, bank, wallet, paid MCP, paid API, pay-to wallet, or agent-payment code:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

Strict mode fails if no payment flow is found.

## GitHub Actions

Fast path: use the official reusable Monarch Doctor action.

```yaml
name: Monarch Doctor

on:
  pull_request:
  push:
    branches:
      - main

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

The action runs:

```bash
npx @monarch-shield/x402@0.1.0 doctor --root . --ci --strict
```

The default action package is pinned to `@monarch-shield/x402@0.1.0` so CI behavior does not silently drift with the npm `latest` tag. Change the `package` input only when intentionally testing a newer Doctor release.

Manual workflow fallback:

```yaml
name: Monarch Doctor

on:
  pull_request:

jobs:
  monarch-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npx @monarch-shield/x402 doctor --ci --strict
```

## SARIF For Code Scanning

Use SARIF when reviewers need Doctor findings to appear in GitHub code scanning, not only in logs:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

Upload the file with `github/codeql-action/upload-sarif`. The SARIF result is generated from the same Doctor scan result and reports unprotected payment files. It is still a build-time preflight signal, not hosted proof or runtime policy.

## CI Decision

- `passed`: payment files include Monarch checks and sandbox scenarios passed
- `failed`: money-moving code is not ready for go-live
- `no_payment_flow_detected`: no x402, processor, card, bank, wallet, paid MCP, paid API, pay-to wallet, or agent-payment flow found
- `failed_no_payment_flow`: strict mode expected payment code but found none

## Agent Message

Tell the user:

```txt
I added Monarch Doctor to CI because this repository can move money. Pull requests should not merge until Doctor confirms the payment files call Monarch before payment and sandbox scenarios pass.
```
