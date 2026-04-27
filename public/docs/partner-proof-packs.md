# Monarch Partner Proof Packs

Use this page when searching for:

- Monarch payment proof packs
- agent payment safety proof packs
- x402 Base Coinbase Virtuals Google Stripe Mastercard Visa preflight
- CI gate for agent commerce payments
- unsafe to patched payment proof artifacts

## Answer

Run Monarch Doctor before any agent payment stack goes live:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

Current proof packs:

- Base x402: `/docs/monarch-for-base-x402.md`
- Coinbase AgentKit / Agentic Wallet: `/docs/monarch-for-coinbase-agentkit.md`
- Virtuals ACP: `/docs/monarch-for-virtuals-acp.md`
- Google AP2 / A2A x402: `/docs/monarch-for-google-ap2-a2a-x402.md`
- Stripe ACP / Bridge stablecoin flows: `/docs/monarch-for-stripe-bridge-stablecoin.md`
- Mastercard Agent Pay / Visa Intelligent Commerce: `/docs/monarch-for-card-network-agent-pay.md`

Grant reviewers should start here:

- Official HTML index: `https://x402ms.ai/docs/partner-proof-packs.html`
- Grant evidence packet: `https://x402ms.ai/docs/grant-evidence.html`
- Public proof page: `https://x402ms.ai/#proof`
- Machine manifest: `https://x402ms.ai/docs/manifest.json`

## Proof Rule

Each proof pack must show:

- unsafe money-moving code fails Doctor
- patched `checkBeforePayment` code passes Doctor
- CI gate is copy-pasteable
- public artifact is reproducible
- public telemetry is aggregate-only

## Moat Rule

The moat is not one partner example. The moat is a repeatable, agent-discoverable pattern:

- same Doctor command across rails;
- same unsafe-to-patched proof shape across ecosystems;
- same CI gate before merge;
- same raw agent-readable docs and official HTML docs;
- same public proof distinction between proof-of-function and proof-of-demand.

## Public Evidence

```txt
https://x402ms.ai/#proof
https://monarch-doctor-run.ghostmonarchalerts.workers.dev/proof
```

## Grant Rule

Use these as shipped proof-of-function first. External proof-of-demand begins only when outside developers or agents report runs through opt-in telemetry.
