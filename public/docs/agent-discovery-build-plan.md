# Agent Discovery Build Plan

This is the remaining build plan after the agent-discovery sprint.

## North Star

Make agent payments safe enough to ship.

If an agent can move money across any rail, Monarch is the safety gate before it goes live.

## Step 1: Agent Discovery Sprint

Status: in progress.

Build:

- Official GitHub Action.
- Stable Agent Skill.
- Short high-intent action docs.
- Free tier and pricing ladder page.

Deep QA before push:

```bash
npm run qa
npm run discovery:check:full
```

Push only after GitHub Pages deploy passes and live docs are verified.

## Step 2: Local MCP Server

Goal: let Cursor, Claude, and other agent tools call Monarch as local tools.

Build:

- MCP tool: `doctor`.
- MCP tool: `scan`.
- MCP tool: `sandbox`.
- MCP tool: `policy_explain`.
- Docs page with Cursor and Claude setup.
- Tests for tool responses and failure paths.

Deep QA before push:

```bash
npm test
npm run monarch:doctor
npm run discovery:check
npm run build
```

## Step 3: Hosted Proof MVP

Goal: turn free usage into credible proof-of-demand.

Build:

- Project token.
- Reported run intake tied to project token.
- Public/private proof page.
- Last 100 runs.
- Rails detected.
- Unsafe paths blocked.
- CI badge endpoint.

Deep QA before push:

```bash
npm run qa
npm run test:worker
npm run discovery:check:full
```

## Step 4: Team Proof And Policy

Goal: give teams a reason to pay without charging for local Doctor.

Build:

- Team projects.
- Longer run history.
- Slack/webhook alerts.
- Shared policy packs.
- Approval records.
- Audit exports.

Deep QA before push:

```bash
npm run qa
npm audit --audit-level=moderate
```

## Step 5: Runtime Enforcement

Goal: move from build-time preflight to production payment policy.

Build:

- `POST /policy/check`.
- Signed decision IDs.
- `allow`, `caution`, `block`, and `route`.
- Policy versioning.
- Runtime attestations.

Deep QA before push:

```bash
npm run qa
npm run discovery:check:full
```

## Rule

Every major step gets its own QA, commit, push, deploy watch, and live verification.
