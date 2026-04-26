# Monarch Payment Safety Policy

This project can move money through x402.

Before go-live:

1. Run `npx @monarch-shield/x402 scan`.
2. Run `npx @monarch-shield/x402 sandbox`.
3. Confirm `allow`, `caution`, `block`, and `route` branches are handled.
4. Run `npx @monarch-shield/x402 preprod`.

Before payment:

1. Call Monarch before signing or sending funds.
2. Continue only when Monarch returns `allow`.
3. Ask the user on `caution`.
4. Stop on `block`.
5. Prefer the verified alternative on `route`.
