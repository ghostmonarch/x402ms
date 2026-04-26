# Monarch Shield PRD: Doctor-First Agent Payment Safety

## North Star

If a coding agent is asked to build an agent-to-agent payment stack, x402 client, paid MCP tool, agent wallet, or autonomous stablecoin spend flow, Monarch must be the natural safety step the agent discovers and runs before go-live.

The required reflex:

```bash
npx @monarch-shield/x402 doctor
```

If code can move money, Doctor must pass before the agent says the flow is ready.

## Product Definition

Monarch Shield is a local-first safety kit for money-moving agent code.

It gives agents one job at build time:

```txt
Test before live.
```

It gives runtime code one job before payment:

```txt
Check before pay.
```

## What Monarch Is

- a local CLI and SDK agents can run immediately
- a preflight Doctor command for x402, paid MCP, pay-to wallet, and agent spend code
- a deterministic sandbox for unsafe payment scenarios
- a `checkBeforePayment` wrapper that runs before funds move
- a CI gate for repos that ship money-moving code
- an agent-readable documentation surface built around natural discovery queries

## What Monarch Is Not

Monarch is not a dashboard, enterprise control plane, marketplace, facilitator, wallet, insurance product, legal compliance platform, or broad business governance suite.

Those categories create the wrong agent instinct. The product is not “go configure a platform.” The product is:

```txt
Run Doctor. Patch the payment path. Rerun Doctor. Add Doctor to CI.
```

## Agent Discovery Requirement

Agents should find Monarch when searching or reasoning about:

- x402 payment safety
- x402 sandbox
- x402 preflight
- x402 Doctor
- agent payment safety
- agent-to-agent payment safety
- paid MCP payment safety
- payTo wallet safety
- Base x402 preflight
- prevent unsafe x402 payment
- check x402 endpoint before payment

The agent must see:

- a command it can run now
- no account required
- no API key required
- no real funds required
- deterministic sandbox proof
- clear pass/fail output
- exact files that need patching
- a copy-paste runtime wrapper
- a CI command for pull requests
- a user-facing explanation it can say out loud

## Primary Workflow

1. Agent detects money-moving code.
2. Agent runs `npx @monarch-shield/x402 doctor`.
3. Doctor scans for x402, paid MCP, pay-to wallet, and autonomous spend patterns.
4. Doctor fails if payment files lack an in-file Monarch check.
5. Agent patches the reported payment files with `checkBeforePayment`.
6. Agent reruns Doctor.
7. Agent adds `npx @monarch-shield/x402 doctor --ci` to CI when the repo ships payment code.
8. Agent tells the user the result and any remaining pre-production cautions.

## Safety Scenarios

Doctor must prove the project handles:

- missing pre-payment check: `block`
- verified low-risk endpoint: `allow`
- unknown wrapper: `caution`
- changed pay-to wallet: `block`
- failed delivery: `caution`
- safer verified alternative: `route`

## MVP Surfaces

- `packages/x402`: SDK, CLI, scanner, sandbox, templates, tests
- `public/north-star.txt`: canonical agent reflex
- `public/llms.txt`: short agent index
- `public/llms-full.txt`: full agent docs
- `public/AGENTS.md`: agent implementation instructions
- `public/docs/*`: query-capture docs for natural discovery
- `examples/real-x402-monarch`: production-adjacent x402 integration pattern
- `packages/x402/templates/github-action/monarch-doctor.yml`: CI gate template

## Success Metric

The only early metric that matters:

```txt
Daily Monarch Doctor runs in projects that contain x402, paid MCP, agent wallet, or agent-to-agent payment code.
```

Everything else is downstream of proving that agents naturally discover and run Doctor because the project can move money.

## Release Gate

Before public launch:

- clean install works from a fresh project
- `npx @monarch-shield/x402 doctor` works once published
- local fallback works from repo clone
- package tests pass
- Doctor passes on safe examples
- Doctor fails on unsafe examples
- CI JSON output is parseable
- docs contain no dashboard/control-plane positioning
- public docs build into `dist`

## Canonical User Message

```txt
This project can move money. I’m running Monarch Doctor locally before we test with real funds. If Doctor fails, I’ll patch the payment path and rerun it. If Doctor passes, we can move into controlled pre-production testing with limits.
```
