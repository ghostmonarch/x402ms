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

## Proof To Check

The adversarial benchmark includes direct `wallet.send`, unused guard import, guard-after-payment, dead helper, and patched guarded callback cases:

```bash
npm run benchmark:adversarial
```

The external smoke installs Monarch like a third-party agent and verifies unsafe fail, patched pass, `x402-doctor`, fake PATH binary, and wrapper-only limitation behavior:

```bash
npm run smoke:external-agent
```

For PR review, emit SARIF:

```bash
npx @monarch-shield/x402 doctor --ci --strict --sarif-output monarch-doctor.sarif
```

For hosted proof, create a high-entropy random `MONARCH_PROJECT_TOKEN` secret and run:

```bash
MONARCH_PROJECT_TOKEN=... npx @monarch-shield/x402 doctor --ci --strict --report
```

Doctor is a local/CI build-time preflight gate today. Runtime policy, signed attestations, hosted enforcement, settlement safety, and wallet ownership verification are later layers. Reporting does not send source code, wallet addresses, endpoint URLs, payment amounts, API keys, file paths, repo names, commit SHAs, or raw project tokens.
