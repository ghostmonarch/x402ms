# Monarch Doctor Run Receiver

Cloudflare Worker for opt-in `doctor --report` DAU proof.

It accepts anonymous Doctor run metadata only. It rejects payload keys that look like source code, file paths, wallet addresses, endpoint URLs, payment amounts, API keys, tokens, or secrets.

## Endpoints

- `POST /doctor-run`: accepts anonymous Doctor run metadata
- `POST /discovery-event`: accepts anonymous discovery/A-B metadata
- `GET /health`: public health check
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
- `sandboxPassed`
- `projectHash`
- `timestamp`

Never send source code, wallet addresses, endpoint URLs, payment amounts, API keys, file names, or file paths.

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
