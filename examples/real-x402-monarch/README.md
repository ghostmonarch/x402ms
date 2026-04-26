# Real x402 + Monarch Pattern

This example shows where Monarch belongs in a production x402-style client.

Monarch does not replace the x402 payment implementation. It runs before that implementation so the agent can block, caution, or route before funds move.

The example imports `@monarch-shield/x402`, which is the copy-paste shape for real projects. In this monorepo, run `npm install` at the root first so the workspace package is linked locally.

## Run The Gate

From the project root:

```bash
npx @monarch-shield/x402 doctor --root examples/real-x402-monarch
```

## CI Gate

```bash
npx @monarch-shield/x402 doctor --root examples/real-x402-monarch --ci --strict
```

## Agent Rule

If a file sends an `X-PAYMENT` header, handles `402 Payment Required`, stores a `payTo` wallet, or calls a facilitator, the Monarch check belongs in that same payment path before payment execution.
