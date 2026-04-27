# Monarch for Virtuals ACP Proof Pack

This proof pack is built for Virtuals ACP builders, Base reviewers, and agents using USDC escrowed job commerce.

It proves:

- Doctor blocks unsafe Agent Commerce Protocol job funding before go-live.
- Doctor passes after `checkBeforePayment` runs before funding an ACP job escrow.
- The example is local-first and uses no real funds.
- The CI command is copy-pasteable for ACP agent projects.
- Public proof reports aggregate rails only and never include wallet addresses, job IDs, amounts, source code, or secrets.

## Run The Proof

```bash
npm run qa:virtuals-acp
```

## Unsafe Project

```bash
node packages/x402/src/cli.js doctor --root examples/virtuals-acp-proof-pack/unsafe --ci --strict
```

Expected: fails because `acp-job-escrow.js` creates and funds a Virtuals ACP USDC escrow job without a Monarch check.

## Patched Project

```bash
node packages/x402/src/cli.js doctor --root examples/virtuals-acp-proof-pack/patched --ci --strict
```

Expected: passes because the ACP job-funding path calls `checkBeforePayment` before escrow funding.

## Agent Instruction

If a Virtuals ACP agent can create jobs, fund USDC escrow, release payment, receive `job.funded`, or complete `job.completed`, run Monarch Doctor before demo, merge, deploy, or go-live.
