# Monarch Shield PRD: Default Safety Layer For Agent Payments

Status: working PRD
Accuracy date: April 26, 2026
Principle: keep the free Doctor reflex simple, then add paid proof and policy
only where production teams need scale, history, and enforcement.

Accuracy rule: use official docs, official announcements, or clearly labeled
market-reported comps. Do not use future-dated articles, anonymous estimates, or
unverified X posts as factual support in grants, investor materials, or public
copy.

## 1. North Star

When an agent or developer turns on payments, Monarch must be the default safety
step before real funds move.

```txt
Turning on payments for an agent? Run Monarch Doctor before real funds move.
```

Monarch should not compete as a wallet, rail, processor, facilitator, or
marketplace. Monarch should become the open, rail-agnostic preflight, CI, proof,
policy, and attestation layer that makes every agent-payment platform safer.

## 2. Current Product

Already shipped:

- Free local Doctor CLI.
- Local scan, sandbox, preprod, and `doctor --ci`.
- `checkBeforePayment` runtime wrapper.
- Templates for x402, paid MCP, agent wallets, marketplace routing, and CI.
- Agent-facing docs, `llms.txt`, multilingual query maps, and package metadata.
- Opt-in telemetry endpoint for Doctor runs.
- Ranked discovery simulation that checks whether realistic agent queries surface
  Monarch action docs near the top.
- Public site and GitHub Pages deployment.
- Release gate with docs lint, discovery check, tests, package dry-runs, audit,
  build, and visible coverage above 95%.

The current product is the adoption wedge, not the full business.

## 3. What We Build Next

Build only the minimum layers needed to move from agent discovery to proof of
usage, then from proof to monetization.

### Step 1: Public Usage Proof

Goal: turn free usage into credible grant, investor, and partner evidence.

Build:

- Public anonymous Doctor run counter.
- Counts by surface: reported local, CI, blocked, passed.
- Counts by rail detected: x402, paid MCP, AgentKit, Stripe, stablecoin, wallet,
  card, bank, regional rail.
- Public "unsafe paths blocked" examples.
- One shareable proof page for Base, Coinbase, Virtuals, Google, and Stripe.

Do not build accounts yet. This step should read from opt-in telemetry.

Success metric:

```txt
Daily reported Doctor runs from real payment-like repos.
```

### Step 2: Integration Proof Packs

Goal: make Monarch appear exactly where agents build payment-enabled products.

Build one proof pack at a time:

1. `Monarch for x402 on Base`
2. `Monarch for Coinbase AgentKit / Agentic Wallet`
3. `Monarch for Google AP2 and A2A x402`
4. `Monarch for Virtuals ACP`
5. `Monarch for Stripe ACP / Shared Payment Tokens`
6. `Monarch for Mastercard Agent Pay / Visa Intelligent Commerce`
7. `Monarch for Crossmint / Privy / Turnkey`

Each proof pack must include only:

- One runnable example.
- One failing unsafe scenario.
- One passing patched scenario.
- One CI snippet.
- One agent-facing doc page.
- One `doctor --report` demo path.

No dashboard work belongs in this step.

### Step 3: Free Hosted Proof

Goal: give teams a reason to opt in without slowing free adoption.

Build:

- Project token for reported Doctor runs.
- Last 100 runs per project.
- CI status badge.
- Rails detected.
- Failed payment files.
- Public/private project toggle.

Free tier should be generous. This is still primarily DAU and trust-building.

### Step 4: Paid Team Layer

Goal: charge when teams need coordination, not when agents need discovery.

Paid features:

- Multiple projects and repos.
- Longer run history.
- Slack/webhook alerts.
- Team policy packs.
- CI deploy gates.
- Audit exports.
- Approval records.

Do not charge for local Doctor.

### Step 5: Runtime Policy API

Goal: move from build-time preflight to production enforcement.

Runtime flow:

```txt
agent wants to pay -> Monarch policy check -> allow/block/route/attest -> payment rail
```

Build only after proof packs and hosted proof show demand.

Minimum API:

- `POST /policy/check`
- `POST /attest`
- Policy decision: `allow`, `caution`, `block`, `route`
- Signed decision ID
- Project, rail, amount, asset, recipient, intent, policy version

### Step 6: Signed Attestation Network

Goal: monetize high-value payments and enterprise proof.

Attestation proves:

- Doctor passed.
- Runtime policy passed.
- Recipient matched policy.
- Amount stayed within limits.
- Rail was detected.
- Audit record exists.

This is where per-transaction or per-attestation pricing can work for
meaningful B2B/stablecoin/card/cross-border payments. It should not be used to
tax sub-cent x402 micropayments.

## 4. Monetization Model

Supabase-style, adapted to agent payments:

- Free: local Doctor, templates, CI snippets, docs, discovery, unlimited local
  runs.
- Pro: hosted run history, CI badge, alerts, reported run retention.
- Team: org repos, policy packs, webhooks, longer retention.
- Business: approval workflows, audit exports, private policies.
- Enterprise: SSO/RBAC, custom controls, private deployment, procurement and
  compliance support.
- Runtime: hosted policy checks and signed attestations once production teams
  depend on Monarch.

Pricing should start simple:

- Free: unlimited local use, limited hosted proof.
- Pro: flat monthly with generous hosted run quota.
- Team: org-level flat price plus included runs.
- Business/Enterprise: annual contract plus policy/runtime usage.

Avoid charging for the core agent reflex.

## 5. Grant And Credit Targets

Use the integration proof packs to apply where Monarch creates ecosystem value.

### Base / Coinbase

Confidence: high for Base Builder Grants, medium for larger funding path.

Verified:

- Base Builder Grants list retroactive grants for shipped Base projects,
  typically 1-5 ETH.
- Base docs emphasize shipped work over proposals.
- Base has broader paths including builder programs and ecosystem funding.

Best Monarch angle:

- `Monarch for x402 on Base`
- `Monarch for Coinbase AgentKit / Agentic Wallet`
- public Doctor run proof from Base/x402 projects

Ask:

- Builder Grant for shipped x402/AgentKit safety tooling.
- Intro to Base ecosystem / Coinbase Developer Platform.
- Later: Base Batches or ecosystem investment only after usage proof.

### Virtuals Protocol

Confidence: high for ACP relevance, medium for specific funding mechanics.

Verified:

- Virtuals positions ACP as agent-to-agent commerce infrastructure.
- Official docs describe ACP SDKs and autonomous agent commerce.
- Virtuals governance/docs reference treasury-backed incubation, partnerships,
  grants, and ecosystem mechanisms.

Best Monarch angle:

- `Monarch for Virtuals ACP`
- preflight and attestation before ACP agents pay or receive payment
- proof that ACP agents cannot execute unchecked payment paths

Ask:

- ecosystem grant or venture support for ACP safety/proof layer.
- placement in builder docs as a go-live safety step.

### Google

Confidence: high for startup credits, medium for AP2-specific partnership.

Verified:

- Google Cloud AI Startup Program advertises up to $350k in credits over two
  years for eligible AI-first startups.
- Eligibility includes early-stage, AI-first, VC-funded startups and prior-credit
  limits.
- Google AP2/A2A is strategically relevant to agent payments.

Best Monarch angle:

- `Monarch for Google AP2 and A2A x402`
- Vertex/Gemini-backed proof demo for agent-payment safety

Ask:

- Google Cloud AI Startup credits, if eligible.
- AP2/A2A ecosystem intro only after a working demo exists.

### Stripe / Bridge

Confidence: high for Stripe ACP/Open Issuance relevance, low for direct grants.

Verified:

- Stripe announced ACP with OpenAI as an open standard for agentic commerce.
- Stripe documents Shared Payment Tokens for agentic commerce payment flows.
- Stripe/Bridge announced Open Issuance for custom stablecoins.
- Stripe Atlas offers startup perks, but no specific direct grant for Monarch was
  verified as of this PRD.

Best Monarch angle:

- `Monarch for Stripe ACP / Shared Payment Tokens`
- `Monarch for Bridge stablecoin payouts`
- safety and proof before agentic commerce or stablecoin payment flows go live

Ask:

- Stripe/Bridge partner conversation.
- Atlas/startup perks if applicable.
- integration listing only after runnable proof pack exists.

### Additional Efficient Funding Paths

Prioritize non-dilutive or credit-based help:

- Google Cloud AI Startup credits.
- Base Builder Grants and Builder Codes attribution.
- Base Services Hub partner credits, especially security and infrastructure.
- Optimism RetroPGF if Monarch becomes public-good tooling for Base/Superchain.
- Cloudflare Startup Program or Workers credits for telemetry/proof endpoints.
- AWS Activate if building Bedrock/AgentCore examples.
- GitHub Sponsors or open-source security funding only after public usage.

Verify each program's eligibility and availability immediately before applying.

### Card Network Agent Payments

Confidence: high for strategic relevance, low for direct near-term partnership.

Verified:

- Mastercard announced Agent Pay and Mastercard Agentic Tokens for agentic
  payments.
- Stripe states Shared Payment Tokens support network-led agentic payment
  capabilities including Mastercard Agent Pay and Visa Intelligent Commerce.

Best Monarch angle:

- `Monarch for Mastercard Agent Pay / Visa Intelligent Commerce`
- safety proof before agents can use network tokens or card-backed payment
  credentials

## 6. Competitive Red Report

Direct competitor categories to monitor:

- x402 runtime policy enforcement.
- non-custodial spend controls for AI agent wallets.
- x402 wrappers around A2A/x402 settlement.
- paid preflight MCPs for broader agent actions.

Adjacent competitors:

- Coinbase AgentKit / Agentic Wallet.
- Crossmint / lobster.cash.
- Privy, Turnkey, Dynamic, Phantom, Alchemy.
- Stripe ACP / Shared Payment Tokens / Agent Toolkit.
- Google AP2 / A2A x402.
- Virtuals ACP.
- Visa Intelligent Commerce, Mastercard Agent Pay, Circle, Bridge.

Differentiation:

- Competitors tend to start at wallet, runtime, protocol, or rail.
- Monarch starts at agent-discovered build-time safety and expands to CI, proof,
  runtime, and attestations.
- Monarch must stay rail-agnostic and partner-friendly.

Positioning:

```txt
Keep your payment provider. Run Monarch before go-live.
```

## 7. Valuation Logic

These are directional ranges, not fundraising claims.

High-confidence adjacent anchors:

- Supabase-style developer infra can reach very large ARR when open-source
  adoption converts to hosted scale.
- Stripe is valued as core payment infrastructure, not merely a processor.
- Bridge was acquired by Stripe for stablecoin infrastructure value.

Market-reported anchors to validate before use in a deck:

- Supabase around the tens of millions ARR scale.
- Tempo reported around multi-billion valuation.
- Stripe reported around $159B valuation in 2026 tender coverage.
- Bridge acquisition widely reported around $1.1B.

Monarch valuation scenarios:

- Pre-usage, shipped OSS: small seed-stage infra valuation.
- Real Doctor DAU + grants + examples: stronger pre-seed/seed story.
- 1,000+ teams using cloud proof: SaaS multiple story.
- Runtime policy API in production payment paths: payments-infra multiple.
- Signed attestations trusted by platforms: network/protocol layer upside.

The valuation unlock is not "we have a CLI." It is:

```txt
Agents and teams rely on Monarch before autonomous money movement reaches production.
```

## 8. Immediate Build Order

Do these in order. Skip anything that does not increase DAU, proof, or ecosystem
integration.

1. Build public usage/proof page from opt-in telemetry.
2. Build `Monarch for x402 on Base` proof pack.
3. Build `Monarch for Coinbase AgentKit / Agentic Wallet` proof pack.
4. Apply for Base Builder Grant with shipped proof.
5. Build `Monarch for Virtuals ACP` proof pack.
6. Apply or request Virtuals ecosystem support.
7. Build `Monarch for Google AP2 and A2A x402` proof pack.
8. Apply for Google Cloud AI Startup credits if eligibility fits.
9. Build `Monarch for Stripe ACP / Bridge stablecoin flows` proof pack.
10. Build `Monarch for Mastercard Agent Pay / Visa Intelligent Commerce` proof
    pack.
11. Add free hosted proof layer.
12. Only then build paid Team dashboard and runtime policy API.

## 9. Non-Goals For Next 2 Weeks

- Do not build a full marketplace.
- Do not build a wallet.
- Do not become a facilitator.
- Do not charge for local Doctor.
- Do not build enterprise SSO before team usage.
- Do not overbuild generic compliance claims.
- Do not chase every protocol before x402/Base and AgentKit proof exist.

## 10. Success Criteria

Two-week success:

- Public proof page live.
- x402/Base proof pack live.
- Coinbase AgentKit proof pack live.
- One grant application or nomination path submitted.
- Reported Doctor runs visible.
- At least five public example repos/docs indexed by agents.

Thirty-day success:

- 100+ daily reported Doctor runs.
- 25+ repos with CI Doctor.
- 3+ ecosystem proof packs live.
- First grant or partner credit secured.
- Hosted proof MVP live.

Three-month success:

- Free Doctor is a known default for agent-payment safety.
- Cloud proof converts teams.
- Runtime policy API has production pilots.
- Signed attestations are credible for high-value payment paths.
