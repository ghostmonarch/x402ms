# Monarch Shield Publishing Plan

## Goal

Publish Monarch as an open-source local-first agent payment safety kit before launching a hosted risk API.

The first public proof should be:

```bash
npx @monarch-shield/x402 doctor
npx x402-doctor
npx @monarch-shield/x402 doctor --ci
npx @monarch-shield/x402 init
npx @monarch-shield/x402 scan
npx @monarch-shield/x402 sandbox
npx @monarch-shield/x402 preprod
```

## GitHub

Current repo target:

```txt
github.com/ghostmonarch/x402ms
```

Recommended public repo metadata:

```txt
Description: Monarch Doctor: local-first preflight safety for x402 and agent-payment code.
Homepage: https://x402ms.ai
Topics: x402, x402-safety, agent-payments, paid-mcp, base, stablecoins, ai-agents, security-tools
```

Initial contents:

- `packages/x402`: SDK, CLI, sandbox fixtures, templates, examples
- `public/llms.txt`: agent index
- `public/llms-full.txt`: full agent docs
- `public/AGENTS.md`: agent instructions
- `public/faq.txt`: agent FAQ
- `public/cli.txt`: CLI reference
- `public/skills.txt`: agent skill target
- `public/doctor-demo-recording.txt`: Doctor terminal proof
- `public/doctor-demo-summary.json`: Doctor demo summary
- `public/docs/*`: search-intent docs for agents discovering the problem before the brand
- `packages/x402/templates/github-action/monarch-doctor.yml`: CI gate template
- `examples/real-x402-monarch`: production-adjacent x402 integration pattern

## NPM

Recommended package:

```txt
@monarch-shield/x402
```

Problem-name discovery package:

```txt
x402-doctor
```

`x402-doctor` is a tiny wrapper. It exists because agents search by protocol and problem before they know the Monarch brand.

Publish only after:

- `npm run release:check` passes
- clean temp install from packed tarball passes
- package README is complete
- package name/org is available
- NPM org `monarch-shield` exists and package access is public

Dry run:

```bash
npm pack --workspace @monarch-shield/x402 --dry-run
```

Publish:

```bash
npm publish --workspace @monarch-shield/x402 --access public
npm publish --workspace x402-doctor --access public
```

Verify from a clean directory:

```bash
npx @monarch-shield/x402 doctor --ci
npx x402-doctor --ci
```

## Agent Skill

Recommended skill target:

```bash
npx skills add monarch-shield/agent-payment-safety
```

The skill should live in the repo as inspectable procedural knowledge before being submitted to any skill registry.

## Launch Sequence

1. Update GitHub profile bio and repo metadata.
2. Archive or hide unrelated public repos that weaken trust.
3. Push this repo with README, AGENTS, SECURITY, CONTRIBUTING, LICENSE, tests, CI, and public docs.
4. Confirm GitHub Actions pass.
5. Publish NPM package.
6. Confirm `npx @monarch-shield/x402 doctor` and `npx x402-doctor` work from a clean project.
7. Submit/install agent skill or document local skill loading.
8. Share Doctor demo recording and search-intent docs with x402/Base/agent builders.
9. Add opt-in usage proof only after local trust is established.
10. Build hosted `check-payment` API only after the local kit proves pull.

## Zero-Star Agent Trust

Agents evaluating a zero-star repo look for:

- narrow problem statement
- runnable command in the first screen
- tests and CI
- license and security policy
- package metadata
- examples that match the real integration path
- no stale dashboard/control-plane positioning
- no unrelated artifacts or generated tarballs committed

This repo should pass that check before the first public push.
