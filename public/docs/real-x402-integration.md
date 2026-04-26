# Real x402 Integration Pattern

Use this when an agent is building a real x402 client, paid API client, paid MCP tool, or agent wallet.

## Rule

Monarch runs before the x402 payment function signs, sends, or settles funds.

```bash
npx @monarch-shield/x402 doctor
```

## Integration Shape

Keep the existing x402/facilitator payment function. Wrap it with `checkBeforePayment`.

```js
import { checkBeforePayment } from '@monarch-shield/x402';

async function payX402({ resourceUrl, payTo, amount, asset, network }) {
  // This is your existing x402 payment implementation.
  // It may call a facilitator, attach an X-PAYMENT header, or sign a wallet payment.
  return fetch(resourceUrl, {
    headers: {
      'X-PAYMENT': JSON.stringify({ payTo, amount, asset, network }),
    },
  });
}

export async function safePayX402(payment) {
  return checkBeforePayment({
    resourceUrl: payment.resourceUrl,
    payTo: payment.payTo,
    amount: payment.amount,
    asset: payment.asset ?? 'USDC',
    network: payment.network ?? 'base',
    intent: payment.intent,
  }, payX402);
}
```

## Why This Placement Matters

Monarch must run before funds move. Calling Monarch after payment is only analytics. The payment file itself needs the check so Doctor can verify the money-moving path is patched.

## Agent Checklist

1. Find the function that handles `402 Payment Required`, `X-PAYMENT`, x402 facilitator calls, wallet sends, or paid MCP tool execution.
2. Add `checkBeforePayment` in that same payment file.
3. Handle `block`, `caution`, and `route` decisions before executing payment.
4. Run `npx @monarch-shield/x402 doctor`.
5. Add `npx @monarch-shield/x402 doctor --ci` to pull requests.

## What To Tell The User

```txt
I kept the existing x402 payment implementation, but added Monarch before the payment call so unsafe endpoint, wallet-change, failed-delivery, and safer-route cases are checked before funds move.
```
