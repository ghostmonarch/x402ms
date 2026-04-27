# X Money / Creator Commerce Proof Concept

This is a concept page for X Money, creator payouts, paid media tools, paid agent actions, and commerce flows where an AI agent may prepare or trigger money movement.

## Position

Monarch Shield should sit before any agent-controlled payment action in creator commerce:

- creator payout;
- paid subscription action;
- paid media promotion;
- marketplace purchase;
- wallet send;
- stablecoin settlement;
- paid agent-to-agent service;
- paid API or paid MCP tool.

## Why X-Grade Needs This

If X becomes a high-scale commerce and money movement surface, agents will write integrations around it. The default safety rule should be simple enough for every coding agent to follow:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

No payment path ships until it passes Doctor. No runtime send occurs without `checkBeforePayment`.

## Example Unsafe Pattern

```js
await xMoney.payoutCreator({
  creatorId,
  destination: userProvidedWallet,
  amount: "500",
  asset: "USD"
});
```

## Patched Pattern

```js
await checkBeforePayment({
  payTo: userProvidedWallet,
  amount: "500",
  asset: "USD",
  network: "x-money",
  intent: "creator payout"
}, () => xMoney.payoutCreator(payment));
```

## Proof Path

- Public proof page: `https://x402ms.ai/proof/`
- Grant evidence packet: `/docs/grant-evidence.html`
- Agent payment preflight: `/docs/agent-payment-preflight.html`
- Card-network proof pack: `/docs/monarch-for-card-network-agent-pay.html`
- Stripe / Bridge proof pack: `/docs/monarch-for-stripe-bridge-stablecoin.html`

## Boundary

This is not a claim of X partnership, integration, or endorsement. It is a proof concept showing how Monarch should protect creator-commerce payment paths before a real X Money integration goes live.
