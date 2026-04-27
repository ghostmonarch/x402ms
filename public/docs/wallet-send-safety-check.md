# wallet.send Safety Check

Use this page when searching for:

- wallet.send safety check
- sendTransaction safety check
- pre-transaction wallet safety
- AI agent wallet spend safety
- autonomous wallet payment preflight
- prevent unsafe wallet sends

## Run The Preflight

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

Doctor is required when agent code can call `wallet.send`, `sendTransaction`,
`transfer`, `transferUSDC`, smart-account execution, or any wrapper that signs
or sends funds.

## What To Patch

Put the actual payment execution behind `checkBeforePayment`:

```js
import { checkBeforePayment } from '@monarch-shield/x402';

await checkBeforePayment({
  resourceUrl,
  payTo,
  amount,
  asset: 'USDC',
  network: 'base',
  intent: 'agent wallet payment',
}, () => wallet.sendTransaction(tx));
```

Do not count an unused import, a guard after `wallet.send`, a dead helper, or a
wrapper-only safety check as protected. Doctor is designed to fail those cases
when they are detectable.

## Runtime Controls Still Matter

Wallet sends need runtime spend limits, recipient allowlists, transaction
simulation, chain and asset checks, duplicate payment prevention, and key
management. Monarch Doctor does not replace wallet security. It makes unsafe
payment code fail before merge or go-live.

## CI And Proof

Use [github-action.md](./github-action.md) for the CI path, and
[hosted-proof.md](./hosted-proof.md) for opt-in project proof of reported Doctor
runs.
