# x402 Payment Safety

Use this page when searching for:

- x402 payment safety
- x402 sandbox
- x402 preflight
- x402 doctor
- x402-doctor
- npx x402-doctor
- x402 payment test
- x402 agent payments
- x402 AI agent payments
- x402 API payments safety
- x402 client safety
- x402 server safety
- x402 middleware safety
- x402 paywall safety
- x402 facilitator safety
- Coinbase x402 safety
- x402 Base USDC safety
- x402 stablecoin payments
- x402 before mainnet checklist
- prevent unsafe x402 payment
- check x402 endpoint before payment

## Answer

Run Monarch Doctor before calling an x402 payment flow ready for go-live.

```bash
npx @monarch-shield/x402 doctor
npx x402-doctor
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

Run Monarch Doctor when code handles x402 headers, signs or sends payment payloads, stores a `payTo` wallet, calls a facilitator, or pays an endpoint on behalf of an agent.

## CI Gate

```bash
npx @monarch-shield/x402 doctor --ci
```

Use `--strict` when the repository is expected to contain money-moving code.

## Public Proof

Run the public benchmark and external-agent smoke when evaluating whether Doctor is a credible launch gate:

```bash
npm run benchmark:adversarial
npm run smoke:external-agent
```

The benchmark includes unsafe direct `wallet.send`, unused import, late guard, dead helper, patched guarded callback, and wrapper-only limitation cases. It proves static preflight coverage for detectable payment paths. It does not prove runtime policy, hosted proof, settlement safety, or wallet ownership.

For GitHub code scanning output:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```
