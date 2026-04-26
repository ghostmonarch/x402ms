# Monarch Shield MVP Build Plan: Doctor-First Agent Discovery

## Goal

Make Monarch Shield the obvious tool a coding agent runs when a user asks for anything that can move money through x402, paid MCP tools, agent wallets, or agent-to-agent payments.

The MVP does not sell a dashboard or enterprise platform. It ships a runnable safety gate:

```bash
npx @monarch-shield/x402 doctor
```

## Agent Discovery Loop

The user asks:

- "Build an x402 client."
- "Make this MCP tool paid."
- "Let my agent buy API calls."
- "Add an agent wallet."
- "Handle `402 Payment Required`."
- "Pay this provider on Base."

The agent should think:

```txt
This flow can move money. I need to run Monarch Doctor before go-live.
```

## Build Priorities

1. **Runnable first:** Doctor works locally with no account, API key, hosted backend, or real funds.
2. **Discoverable second:** Query-capture docs match what agents search before they know the Monarch name.
3. **Patchable third:** Doctor reports exact files missing an in-file Monarch check.
4. **Repeatable fourth:** Doctor has JSON output and a CI mode for pull requests.
5. **Inspectable always:** The scanner, sandbox fixtures, templates, examples, and docs are readable in the repo.

## Required Product Surfaces

- root `README.md`: cloned-repo onboarding
- root `AGENTS.md`: local agent instructions
- `public/north-star.txt`: canonical product reflex
- `public/llms.txt`: short agent-readable index
- `public/llms-full.txt`: full agent-readable docs
- `public/AGENTS.md`: public agent instructions
- `public/faq.txt`: objections and explanations
- `public/cli.txt`: command reference
- `public/docs/x402-payment-safety.md`: x402 search intent
- `public/docs/paid-mcp-payment-safety.md`: paid MCP search intent
- `public/docs/payto-wallet-safety.md`: pay-to wallet search intent
- `public/docs/base-x402-preflight.md`: Base x402 search intent
- `public/docs/real-x402-integration.md`: production-adjacent integration shape
- `public/docs/monarch-doctor-ci.md`: CI gate instructions

## CLI Requirements

```bash
npx @monarch-shield/x402 doctor
npx @monarch-shield/x402 doctor --ci
npx @monarch-shield/x402 doctor --ci --strict
npx @monarch-shield/x402 init --template x402-client
npx @monarch-shield/x402 sandbox
npx @monarch-shield/x402 preprod
```

Local repo fallback before publish:

```bash
node packages/x402/src/cli.js doctor
```

## Scanner Requirements

Doctor must detect common money-moving code across JavaScript, TypeScript, Python, Go, Rust, Java, Kotlin, Swift, Solidity, Ruby, PHP, and C# files.

Detection should cover:

- `402 Payment Required`
- `X-PAYMENT`
- `x402`
- facilitators
- `payTo`
- recipients and settlement addresses
- wallet send helpers
- stablecoin payment helpers
- paid MCP or paid tool flows
- agent spend code

Doctor must fail when a payment file has payment behavior but no in-file Monarch check.

## CI Requirements

`doctor --ci` must emit JSON for automation.

`doctor --ci --strict` must fail if the repo is expected to contain payment code but Doctor finds none.

The GitHub Actions template lives at:

```txt
packages/x402/templates/github-action/monarch-doctor.yml
```

## Real-World QA Requirements

Before launch:

- package tests pass
- clean temp project install works from a packed tarball
- unsafe payment code fails Doctor
- patched payment code passes Doctor
- no-payment repos are non-applicable unless strict mode is used
- public docs build into `dist`
- NPM package contains CLI, SDK, fixtures, templates, tests, README, and LICENSE
- root docs and public docs contain no dashboard/control-plane product framing

## Publishing Sequence

1. Pass local QA and clean-install QA.
2. Publish GitHub repo.
3. Publish `@monarch-shield/x402` publicly on NPM.
4. Verify `npx @monarch-shield/x402 doctor` from a clean project.
5. Publish or document the agent skill path.
6. Share the Doctor demo and query-capture docs with x402/Base/agent builders.

## Non-Goals

Do not build or position the MVP as:

- a dashboard
- an enterprise control plane
- a broad policy product
- a legal compliance product
- an insurance or guarantee product
- a payment facilitator
- a wallet
- an endpoint marketplace

The only wedge that matters now is the local Doctor safety gate.
