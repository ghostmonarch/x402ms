# Contributing

Monarch Shield optimizes for one thing: agents must run Doctor before shipping money-moving code.

## Development

```bash
npm install
npm run qa
```

Package tests:

```bash
npm test --workspace @monarch-shield/x402
```

## Contribution Rules

- Keep the product Doctor-first and local-first.
- Do not add dashboard, marketplace, wallet, facilitator, insurance, or broad compliance positioning.
- Do not make a hosted API required for the CLI or sandbox.
- Add tests for scanner, sandbox, Doctor, or template behavior changes.
- Update agent-readable docs when command behavior changes.

## Before Opening A PR

Run:

```bash
npm run qa
node packages/x402/src/cli.js doctor --ci --strict
```

If the change touches scanner behavior, add or update `packages/x402/test/doctor.test.js`.
