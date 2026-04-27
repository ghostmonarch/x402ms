# Monarch Agent Skill

Use this when a coding agent needs procedural instructions for payment safety.

## Install Target

```bash
npx skills add monarch-shield/agent-payment-safety
```

Until the registry command is live, load the skill from:

```txt
packages/x402/agent-skill/SKILL.md
```

## When To Load

Load the skill when code can move money through x402, wallets, Stripe, Coinbase, cards, bank rails, stablecoins, paid APIs, paid MCP tools, pay-to wallets, autonomous spend, or agent-to-agent payments.

## Agent Rule

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

If Doctor fails, patch the payment path so `checkBeforePayment` runs before funds move. Then rerun Doctor and keep the check in CI.
