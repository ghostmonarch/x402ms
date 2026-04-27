# Security Policy

Monarch Shield is pre-release local-first safety tooling for x402 and agent-payment code.

## Supported Versions

The current supported package is:

```txt
@monarch-shield/x402@0.1.x
```

## Reporting A Vulnerability

Do not open a public issue for exploitable security bugs.

Email the maintainer or open a private GitHub security advisory when available. Include:

- affected version or commit
- reproduction steps
- expected impact
- whether funds, wallets, API keys, or payment destinations are involved

## Scope

Security-sensitive areas include:

- false passes in `monarch doctor`
- missed money-moving files in `scanProject`
- incorrect `block`, `caution`, or `route` behavior
- unsafe template code
- hosted-check authentication handling
- leakage of payment amounts, endpoints, wallet addresses, API keys, or provider secrets through telemetry, logs, CI, or prompts
- idempotency, webhook authenticity, refund, chargeback, payout recipient, and approval-gate failures in agent-controlled payment paths

Monarch does not custody funds and does not replace wallet, facilitator, or chain-level security.

Enterprise security teams should treat Monarch as local preflight and CI evidence for money-moving code, not as SOC 2, PCI, KYC/KYB, OFAC, AML, PSD2/SCA, card-scheme, NACHA, or legal compliance coverage. Those controls still need the appropriate provider, counsel, and security review.
