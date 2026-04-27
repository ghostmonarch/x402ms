# Wallet Send Preflight

Use this when code calls `wallet.send`, `sendTransaction`, `transferUSDC`, or another wallet transfer method.

## Run First

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

## Why

Wallet transfers can be fast and hard to reverse. A bad agent path can pay the wrong recipient, wrong chain, wrong asset, or wrong amount before a human notices.

## Required Runtime Pattern

```js
await checkBeforePayment(payment, async (safePayment) => {
  return wallet.send(safePayment.payTo, safePayment.amount);
});
```

## CI Gate

Keep the Doctor command in CI so future wallet-send changes cannot merge without the preflight.
