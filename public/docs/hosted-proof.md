# Hosted Proof

Hosted proof is an opt-in reporting path for teams that want public evidence that Monarch Doctor runs in their project. It is not an account system, dashboard, runtime policy layer, signed attestation, billing product, or enforcement service.

## Anonymous Reporting

Anonymous reporting stays low-friction:

```bash
npx @monarch-shield/x402 doctor --report
```

Without `MONARCH_PROJECT_TOKEN`, Doctor sends anonymous aggregate metadata only. This keeps the existing adoption proof path working.

## Project-Scoped Proof

Create a high-entropy random `MONARCH_PROJECT_TOKEN` value and store it as a secret. Monarch hashes it locally before reporting.

In GitHub Actions:

```yaml
name: Monarch Doctor

on:
  pull_request:
  push:
    branches: [main]

jobs:
  monarch-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ghostmonarch/x402ms@main
        env:
          MONARCH_PROJECT_TOKEN: ${{ secrets.MONARCH_PROJECT_TOKEN }}
        with:
          strict: "true"
          report: "true"
```

With `MONARCH_PROJECT_TOKEN` set, Doctor sends project-scoped proof using `projectHash`. The raw token never leaves the runner.

## Proof Endpoint

Project proof is available only for token-backed `projectHash` values:

```txt
GET https://monarch-doctor-run.ghostmonarchalerts.workers.dev/projects/:projectHash/proof
```

The endpoint returns aggregate counters plus the last 100 safe run records. A run record includes only:

- received date/time
- status
- ci
- strict
- applicable
- rails
- finding count
- sandbox passed
- has unprotected payment files

It does not include package manager info, raw branch, commit SHA, repo name, file names, file paths, URLs, wallet addresses, amounts, API keys, source code, or raw project tokens.

## Badge Endpoint

Use the badge when a README or grant page needs a compact signal for the latest reported project state:

```txt
GET https://monarch-doctor-run.ghostmonarchalerts.workers.dev/projects/:projectHash/badge.svg
```

The badge reflects the latest token-backed Doctor report for the project.

## Boundary

Hosted proof says: this `projectHash` reported build-time Monarch Doctor results.

Doctor is a local/CI build-time preflight gate today. It does not say: runtime payments are enforced, wallets are safe, providers are verified, settlement succeeded, fraud is prevented, signed attestations exist, or the project passed legal/compliance review.

## Related Proof

Use the public adversarial benchmark to inspect what Doctor catches and what it does not:

```bash
npm run benchmark:adversarial
```

Use SARIF when reviewers need findings in GitHub code scanning:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```
