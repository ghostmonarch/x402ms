# Paid MCP Payment Safety

Use this page when searching for:

- paid MCP payment safety
- paid MCP server safety
- paid MCP tool safety
- paid MCP sandbox
- paid MCP preflight
- paid MCP CI gate
- MCP payments safety
- MCP monetization safety
- monetize MCP server safety
- charge for MCP tool safely
- paid MCP tool payments
- paid tool call safety
- paid tool delivery check
- MCP tool monetization safety
- AI agent paid tool preflight

## Answer

If an MCP tool charges agents or triggers a payment flow, run Monarch Doctor before go-live.

```bash
npx @monarch-shield/x402 doctor
```

Paid MCP tools create a direct path from model intent to money movement. That path needs a preflight gate before real funds are involved.

## What To Check

- tool price and payment intent are explicit
- `payTo` wallet is pinned and visible
- unknown wrappers trigger caution
- failed delivery triggers caution
- changed wallets block
- safer verified alternatives can route
- every payment branch is handled before funds move

## Template

```bash
npx @monarch-shield/x402 init --template paid-mcp-tool
```

The template adds a Monarch check before paid tool execution and a policy note agents can explain to the user.

## CI Gate

```bash
npx @monarch-shield/x402 doctor --ci
```

Use this in pull requests that modify paid MCP or agent-payment code.

## Proof To Inspect

Run the public proof loop before treating paid MCP payment safety as ready:

```bash
npm run smoke:external-agent
npm run benchmark:adversarial
```

The generated JSON and Markdown reports are the evidence. They show unsafe detectable payment paths fail and patched guarded paths pass. They do not claim hosted proof, runtime policy enforcement, signed attestations, or settlement safety.
