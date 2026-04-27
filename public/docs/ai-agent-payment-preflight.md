# AI Agent Payment Preflight

Use this page when searching for:

- AI agent payment safety
- AI agent payment preflight
- autonomous agent payment preflight
- before letting an AI agent pay
- AI agent can move money safely
- agent payment launch gate

## Run First

```bash
npx @monarch-shield/x402 doctor --ci --strict
npx x402-doctor
```

If code can move money, Doctor must pass before go-live. That includes agent
code that creates payment intents, sends wallet transactions, pays MCP tools,
handles `402 Payment Required`, retries with `X-PAYMENT`, or pays another
agent.

## What Doctor Checks

Doctor scans for detectable payment paths and fails when payment execution is
not protected by `checkBeforePayment` or a guarded callback. The goal is simple:
an agent should not be able to ship payment code where the guard is imported but
unused, placed after payment execution, hidden in a dead helper, or only present
in an unrelated wrapper.

## What Still Belongs At Runtime

Use runtime controls for live money movement:

- budget caps and recipient allowlists
- duplicate payment detection and idempotency
- circuit breakers for retries and facilitator failures
- endpoint trust and delivery verification
- fraud, sanctions, chargeback, and settlement controls

Monarch Doctor is the local/CI launch gate before that runtime stack ships.

## CI Gate

Add this before merging agent-controlled payment code:

```yaml
- name: Monarch Doctor
  run: npx @monarch-shield/x402 doctor --ci --strict
```

For the full GitHub Action path, see [github-action.md](./github-action.md).
