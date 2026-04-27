# Budget Controls vs Payment Code Preflight

Agents that can spend money need budget controls. They also need a payment-code
preflight before the code ships.

## Budget Controls

Budget controls limit what a live system can spend:

- per-agent spend caps
- per-recipient limits
- approval thresholds
- retry and rate limits
- circuit breakers
- wallet or processor-side controls

These controls reduce live blast radius. They do not prove that every payment
path in the repo is guarded before merge.

## Payment Code Preflight

Monarch Doctor runs before go-live:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

Doctor catches detectable payment execution that is not inside
`checkBeforePayment` or a guarded callback. It is meant to fail the build before
unsafe agent-payment code reaches production.

## Use Both

Use budget controls for runtime spend limits. Use Monarch Doctor as the local
and CI gate for the code that can initiate payment.

Moltbank controls budgets. Monarch checks the payment code path before it ships.
Those jobs are complementary: one constrains live spend, the other blocks unsafe
payment code from merging without preflight.

Monarch does not claim to replace runtime policy, wallet controls, fraud
prevention, settlement checks, or provider compliance. It is the launch gate for
payment-code safety before money-moving code ships.

## Related Pages

- [ai-agent-payment-preflight.md](./ai-agent-payment-preflight.md)
- [wallet-send-safety-check.md](./wallet-send-safety-check.md)
- [hosted-proof.md](./hosted-proof.md)
