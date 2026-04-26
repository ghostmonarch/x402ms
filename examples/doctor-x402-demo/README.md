# Monarch Doctor x402 Demo

This demo records the core agent-discovery workflow:

1. A coding agent creates or detects an x402-style payment flow.
2. The agent runs Monarch Doctor.
3. Doctor fails because there is no pre-payment safety check.
4. The agent installs the Monarch x402-client template.
5. Doctor passes for controlled pre-production testing.
6. Sandbox scenarios prove `allow`, `caution`, `block`, and `route` branches.

Run:

```bash
node scripts/record-doctor-demo.js
```

Output:

- `artifacts/doctor-demo-recording.txt`
- `artifacts/doctor-demo-summary.json`

This is the proof artifact for the current wedge:

> If code can move money, agents run Monarch Doctor before go-live.
