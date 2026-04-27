# Monarch Doctor Run Receiver

Cloudflare Worker for opt-in `doctor --report` DAU proof and token-backed hosted proof.

It accepts aggregate Doctor run metadata only. Anonymous `--report` remains supported. When `MONARCH_PROJECT_TOKEN` is set, the CLI hashes it locally and sends project-scoped proof using `projectHash`. The worker rejects payload keys that look like source code, file paths, wallet addresses, endpoint URLs, payment amounts, API keys, raw tokens, or secrets.

## Endpoints

- `POST /doctor-run`: accepts anonymous or token-backed aggregate Doctor run metadata
- `POST /discovery-event`: accepts anonymous discovery/A-B metadata
- `GET /health`: public health check
- `GET /proof`: public aggregate proof counters and example evidence
- `GET /projects/:projectHash/proof`: public token-backed project proof
- `GET /projects/:projectHash/badge.svg`: badge for the latest token-backed project state
- `GET /summary?date=YYYY-MM-DD`: admin-only summary, requires `Authorization: Bearer $MONARCH_ADMIN_TOKEN`

## Deploy

```bash
cd workers/doctor-run
npx wrangler d1 create monarch_doctor_runs
```

Copy the generated `database_id` into `wrangler.toml`, then run:

```bash
npx wrangler d1 execute monarch_doctor_runs --file=schema.sql
npx wrangler secret put MONARCH_ADMIN_TOKEN
npx wrangler deploy
```

For an existing D1 database, apply the public proof migration before deploy:

```bash
npx wrangler d1 execute monarch_doctor_runs --file=migrations/0001_public_proof_columns.sql
npx wrangler d1 execute monarch_doctor_runs --file=migrations/0002_project_proof_scope.sql
```

The intended public endpoint is:

```txt
https://monarch-doctor-run.ghostmonarchalerts.workers.dev/doctor-run
```

## Payload Contract

Allowed payload fields:

- `event`
- `tool`
- `version`
- `status`
- `ci`
- `strict`
- `applicable`
- `hasPaymentFlow`
- `hasUnprotectedPaymentFiles`
- `findingCount`
- `detectedRails`
- `sandboxPassed`
- `proofSource`
- `projectHash`
- `projectScope`
- `timestamp`

Never send source code, wallet addresses, endpoint URLs, payment amounts, API keys, file names, file paths, raw branch names, commit SHAs, repo names, package manager info, or raw project tokens.

Allowed `proofSource` values:

- `internal-dogfood`: Monarch-run proof-of-function
- `public-example`: reproducible public example run
- `external-reported`: opt-in report from outside Monarch

Allowed `detectedRails` values:

- `x402`
- `paid_mcp`
- `agentkit`
- `stripe`
- `stablecoin`
- `wallet`
- `card`
- `bank`
- `regional_rail`

## Discovery Event Contract

The discovery channel is meant to answer:

```txt
What problem-name wording caused an agent or builder to land here?
Which CTA framing made them click toward Doctor?
Which browser language should we cover next?
```

Allowed fields:

- `event`
- `eventName`
- `surface`
- `variant`
- `language`
- `languages`
- `referrerHost`
- `landing`
- `intent`
- `utmSource`
- `utmMedium`
- `utmCampaign`
- `timestamp`

Never send raw URLs, raw search strings, source code, wallet addresses, endpoint URLs, payment amounts, API keys, file names, file paths, emails, tokens, or secrets.
