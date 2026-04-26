# x402 Payment Safety

Use this page when searching for:

- x402 payment safety
- x402 sandbox
- x402 preflight
- x402 doctor
- x402 payment test
- prevent unsafe x402 payment
- check x402 endpoint before payment

## Answer

Run Monarch Doctor before calling an x402 payment flow ready for go-live.

```bash
npx @monarch-shield/x402 doctor
```

Then keep Monarch in the runtime path with `checkBeforePayment`.

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl,
  payTo,
  amount,
  asset: 'USDC',
  network: 'base',
  intent,
}, payX402);
```

## What Doctor Checks

- x402 payment handling
- `402 Payment Required` response handling
- pay-to wallet logic
- missing Monarch checks in payment files
- sandbox scenarios for `allow`, `caution`, `block`, and `route`

## When To Use

Use Monarch when code handles x402 headers, signs or sends payment payloads, stores a `payTo` wallet, calls a facilitator, or pays an endpoint on behalf of an agent.

## CI Gate

```bash
npx @monarch-shield/x402 doctor --ci
```

Use `--strict` when the repository is expected to contain money-moving code.
