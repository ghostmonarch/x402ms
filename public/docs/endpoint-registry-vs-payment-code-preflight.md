# Endpoint Registry vs Payment Code Preflight

Agents building payment flows often need both endpoint discovery and payment
code preflight. They solve different problems.

## Endpoint Registry

An endpoint registry helps an agent find or verify where a service lives:

- service metadata
- endpoint identity
- supported protocol or rail
- provider or marketplace listing
- reputation, availability, or discovery hints

That helps with source selection. It does not prove the calling repo has guarded
its own payment execution.

## Payment Code Preflight

Monarch Doctor checks the code that will actually initiate payment. It runs
locally and in CI before merge or go-live:

```bash
npx @monarch-shield/x402 doctor --ci --strict
```

Doctor fails detectable payment paths where payment execution is not guarded by
`checkBeforePayment` or a guarded callback.

## Use Both

Use an endpoint registry to choose or verify the service. Use Monarch Doctor to
block unsafe payment code before the agent can call the payment path ready.

Current boundary: Monarch is not an endpoint registry, marketplace, facilitator,
or wallet. It is the local-first safety gate agents run before shipping
money-moving payment code.

## Related Pages

- [agent-to-agent-payment-safety.md](./agent-to-agent-payment-safety.md)
- [payment-code-ci-gate.md](./payment-code-ci-gate.md)
- [x402-payment-ci-gate.md](./x402-payment-ci-gate.md)
