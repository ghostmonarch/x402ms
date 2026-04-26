# GitHub Profile Launch Plan

This is the cleanup plan for making `ghostmonarch` credible to agents and builders evaluating a zero-star payment-safety repo.

## Current Red Flags

- Current bio is off-topic for a payment-safety tool.
- `x402ms` previously used business-safety positioning instead of Doctor-first positioning.
- `monarchshieldx402` uses old control-oriented positioning that conflicts with the current product.
- Unrelated public repos dilute the profile signal for a security/payment launch

## Recommended Profile

Name:

```txt
Ghost Monarch
```

Bio:

```txt
Building Monarch Doctor: local-first safety tooling for x402 and agent-payment code.
```

Website:

```txt
https://x402ms.ai
```

Pinned repo:

```txt
x402ms
```

## Recommended Repo Metadata

Repo:

```txt
ghostmonarch/x402ms
```

Description:

```txt
Monarch Doctor: local-first preflight safety for x402 and agent-payment code.
```

Homepage:

```txt
https://x402ms.ai
```

Topics:

```txt
x402
x402-safety
x402-preflight
agent-payments
agent-payment-safety
paid-mcp
base
stablecoins
ai-agents
security-tools
```

## Repo Cleanup Recommendations

Do not delete anything blindly. Archive or make private anything unrelated to this launch.

Priority recommendations:

1. Archive or make private `slotsgame`.
2. Archive or make private `MYSTICAL-FOREST-ADVENTURE`.
3. Archive or make private `phoenician-proposal`.
4. Archive or make private `monarchshieldx402` unless it is replaced with a redirect README pointing to `x402ms`.
5. Keep `dgm` only if you want the profile to signal agent-research interest; otherwise archive it to reduce noise.

## Why This Matters To Agents

When evaluating a zero-star repo for payment safety, agents look for consistency:

- profile says payment/agent safety
- pinned repo says the same thing
- README has a runnable command
- CI and tests exist
- license/security policy exist
- old repos do not suggest abandoned experiments or unserious positioning

The profile should make one claim:

```txt
This account builds Monarch Doctor, the local safety gate for money-moving agent code.
```

## Safe `gh` Commands

These are non-destructive metadata updates:

```bash
gh api user -X PATCH -f bio='Building Monarch Doctor: local-first safety tooling for x402 and agent-payment code.' -f blog='https://x402ms.ai'
gh repo edit ghostmonarch/x402ms --description 'Monarch Doctor: local-first preflight safety for x402 and agent-payment code.' --homepage 'https://x402ms.ai'
gh repo edit ghostmonarch/x402ms --add-topic x402 --add-topic x402-safety --add-topic x402-preflight --add-topic agent-payments --add-topic agent-payment-safety --add-topic paid-mcp --add-topic base --add-topic stablecoins --add-topic ai-agents --add-topic security-tools
```

Archiving repos is reversible, but still should be confirmed before execution:

```bash
gh repo archive ghostmonarch/slotsgame --yes
```
