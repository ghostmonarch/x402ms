import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBeforePayment, checkPayment, evaluatePayment, runSandbox, scanProject, validatePreprod } from '../src/index.js';

const packageRoot = join(import.meta.dirname, '..');
const cliPath = join(packageRoot, 'src/cli.js');
const repoRoot = join(packageRoot, '..', '..');

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? packageRoot,
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
    encoding: 'utf8',
  });
}

function withTempProject(files, assertion) {
  const root = mkdtempSync(join(tmpdir(), 'monarch-test-'));

  try {
    for (const [file, content] of Object.entries(files)) {
      mkdirSync(join(root, file, '..'), { recursive: true });
      writeFileSync(join(root, file), content);
    }

    assertion(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('sandbox scenarios match expected decisions', () => {
  assert.equal(runSandbox().every((scenario) => scenario.passed), true);
});

test('evaluatePayment covers local risk decisions outside the default sandbox', () => {
  const knownBad = evaluatePayment({ knownBadEndpoint: true });
  const priceHigh = evaluatePayment({ priceSanity: 'high' });

  assert.equal(knownBad.decision, 'block');
  assert.equal(knownBad.status, 'known_risky_endpoint');
  assert.equal(priceHigh.decision, 'caution');
  assert.equal(priceHigh.status, 'price_anomaly');
});

test('checkBeforePayment blocks, cautions, routes, and allows payment callbacks', async () => {
  let blockedCallbackCalled = false;
  let blockedError;

  try {
    await checkBeforePayment({ knownBadEndpoint: true }, async () => {
      blockedCallbackCalled = true;
    });
  } catch (error) {
    blockedError = error;
  }

  assert.equal(blockedCallbackCalled, false);
  assert.match(blockedError.message, /Monarch blocked this payment/);
  assert.equal(blockedError.monarch.decision, 'block');

  const caution = await checkBeforePayment({ providerStatus: 'unknown_wrapper' }, async () => 'paid');
  assert.equal(caution.requiresUserApproval, true);
  assert.equal(caution.monarch.decision, 'caution');

  const routed = await checkBeforePayment({
    resourceUrl: 'https://risky.example/x402',
    verifiedAlternative: 'https://safe.example/x402',
  }, async (payment) => ({
    resourceUrl: payment.resourceUrl,
    decision: payment.monarch.decision,
  }));
  assert.deepEqual(routed, {
    resourceUrl: 'https://safe.example/x402',
    decision: 'route',
  });

  const allowed = await checkBeforePayment({ resourceUrl: 'https://safe.example/x402' }, async (payment) => ({
    resourceUrl: payment.resourceUrl,
    decision: payment.monarch.decision,
  }));
  assert.deepEqual(allowed, {
    resourceUrl: 'https://safe.example/x402',
    decision: 'allow',
  });

  const noCallback = await checkBeforePayment({ resourceUrl: 'https://safe.example/x402' });
  assert.equal(noCallback.decision, 'allow');
});

test('checkPayment uses hosted policy API when configured', async () => {
  const originalUrl = process.env.MONARCH_API_URL;
  const originalKey = process.env.MONARCH_API_KEY;
  const originalFetch = globalThis.fetch;
  const calls = [];

  process.env.MONARCH_API_URL = 'https://policy.example';
  process.env.MONARCH_API_KEY = 'test-key';
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { decision: 'allow', status: 'hosted_policy_passed' };
      },
    };
  };

  try {
    const result = await checkPayment({ amount: '1.00', asset: 'USDC' });

    assert.deepEqual(result, { decision: 'allow', status: 'hosted_policy_passed' });
    assert.equal(calls[0].url, 'https://policy.example/check-payment');
    assert.equal(calls[0].options.headers.authorization, 'Bearer test-key');
    assert.equal(calls[0].options.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), { amount: '1.00', asset: 'USDC' });
  } finally {
    if (originalUrl === undefined) {
      delete process.env.MONARCH_API_URL;
    } else {
      process.env.MONARCH_API_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.MONARCH_API_KEY;
    } else {
      process.env.MONARCH_API_KEY = originalKey;
    }

    globalThis.fetch = originalFetch;
  }
});

test('checkPayment surfaces hosted policy failures', async () => {
  const originalUrl = process.env.MONARCH_API_URL;
  const originalKey = process.env.MONARCH_API_KEY;
  const originalFetch = globalThis.fetch;

  process.env.MONARCH_API_URL = 'https://policy.example';
  process.env.MONARCH_API_KEY = 'test-key';
  globalThis.fetch = async () => ({ ok: false, status: 503 });

  try {
    await assert.rejects(
      () => checkPayment({ amount: '1.00', asset: 'USDC' }),
      /Monarch hosted check failed with 503/,
    );
  } finally {
    if (originalUrl === undefined) {
      delete process.env.MONARCH_API_URL;
    } else {
      process.env.MONARCH_API_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.MONARCH_API_KEY;
    } else {
      process.env.MONARCH_API_KEY = originalKey;
    }

    globalThis.fetch = originalFetch;
  }
});

test('Doctor fails payment files without Monarch checks', () => {
  withTempProject({
    'pay.js': `
      export async function payX402(resourceUrl, payTo) {
        return fetch(resourceUrl, { headers: { 'X-PAYMENT': JSON.stringify({ payTo }) } });
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, false);
    assert.deepEqual(result.scan.unprotectedPaymentFiles, ['pay.js']);
  });
});

test('Doctor passes payment files with in-file Monarch checks', () => {
  withTempProject({
    'pay.js': `
      import { checkBeforePayment } from '@monarch-shield/x402';
      export async function safePayX402(payment) {
        return checkBeforePayment(payment, () => fetch(payment.resourceUrl, {
          headers: { 'X-PAYMENT': JSON.stringify({ payTo: payment.payTo }) }
        }));
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, true);
    assert.deepEqual(result.scan.unprotectedPaymentFiles, []);
  });
});

test('scan detects non-JavaScript payment code', () => {
  withTempProject({
    'wallet.rs': `
      fn pay() {
        let payTo = "0x123";
        wallet.send(payTo);
      }
    `,
  }, (root) => {
    const result = scanProject(root);

    assert.equal(result.hasPaymentFlow, true);
    assert.deepEqual(result.unprotectedPaymentFiles, ['wallet.rs']);
  });
});

test('no payment flow is not applicable and ready by default', () => {
  withTempProject({
    'index.js': 'export const hello = "world";',
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, false);
    assert.equal(result.ready, true);
  });
});

test('scan handles missing roots and mixed protected payment files', () => {
  const missing = scanProject(join(tmpdir(), 'missing-monarch-project'));

  assert.equal(missing.hasPaymentFlow, false);
  assert.deepEqual(missing.findings, []);

  withTempProject({
    'safe.js': `
      import { checkBeforePayment } from '@monarch-shield/x402';
      export const pay = (payment) => checkBeforePayment(payment, () => wallet.send(payment.payTo));
    `,
    'unsafe.js': 'export const charge = (stripe, request) => stripe.paymentIntents.create(request);',
    'node_modules/pkg/pay.js': 'export const ignored = (wallet, payTo) => wallet.send(payTo);',
  }, (root) => {
    const result = scanProject(root);

    assert.equal(result.hasPaymentFlow, true);
    assert.equal(result.hasMonarchCheck, true);
    assert.deepEqual(result.unprotectedPaymentFiles, ['unsafe.js']);
    assert.match(result.recommendation, /unsafe\.js/);
    assert.equal(result.findings.some((finding) => finding.file.includes('node_modules')), false);
  });
});

test('scan ignores telemetry receiver validation fields', () => {
  withTempProject({
    'workers/doctor-run/src/index.js': `
      const SENSITIVE_KEYS = ['payTo', 'resourceUrl', 'amount', 'wallet', 'endpoint'];
      export default { fetch() { return Response.json({ accepted: true }); } };
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, false);
    assert.equal(result.ready, true);
  });
});

test('scan ignores generated docs build script payment vocabulary', () => {
  withTempProject({
    'scripts/generate-doc-html.js': `
      const docs = ['x402 payment safety', 'Base USDC', 'Stripe checkout', 'Visa Intelligent Commerce'];
      console.log(docs.join('\\n'));
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, false);
    assert.equal(result.ready, true);
  });
});

test('scan ignores discovery intent strings without payment execution', () => {
  withTempProject({
    'src/main.js': `
      const intentMap = {
        '/docs/x402-payment-safety.md': 'x402-payment-safety',
        '/docs/payto-wallet-safety.md': 'payto-wallet-safety',
        '/docs/paid-mcp-payment-safety.md': 'paid-mcp-safety'
      };

      fetch('https://monarch-doctor-run.ghostmonarchalerts.workers.dev/discovery-event', {
        method: 'POST',
        body: JSON.stringify({ event: 'discovery_event', intent: intentMap.location })
      });
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, false);
    assert.equal(result.ready, true);
  });
});

test('scan still detects x402 header strings in payment code', () => {
  withTempProject({
    'pay.js': `
      export async function pay(resourceUrl, payment) {
        return fetch(resourceUrl, { headers: { 'X-PAYMENT': payment } });
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, false);
  });
});

test('scan detects Stripe payment code without Monarch checks', () => {
  withTempProject({
    'stripe-pay.js': `
      import Stripe from 'stripe';
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      export async function chargeAgent(request) {
        return stripe.paymentIntents.create({
          amount: request.amount,
          currency: 'usd',
          customer: request.customer
        });
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, false);
    assert.deepEqual(result.scan.unprotectedPaymentFiles, ['stripe-pay.js']);
  });
});

test('scan detects card and bank rail payment code without Monarch checks', () => {
  withTempProject({
    'rails.ts': `
      export async function payWithRails(client, request) {
        await client.visa.cardPayment.create(request.cardPayment);
        await client.bankTransfer.create(request.bankTransfer);
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, false);
    assert.deepEqual(result.scan.unprotectedPaymentFiles, ['rails.ts']);
  });
});

test('scan detects global and mobile payment rails without Monarch checks', () => {
  withTempProject({
    'global-rails.ts': `
      export async function payGlobally(client, request) {
        await client.plaid.transfers.create(request.transfer);
        await client.applePay.charge(request.checkout);
        await client.pixPayment.send(request.pix);
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, false);
    assert.deepEqual(result.scan.unprotectedPaymentFiles, ['global-rails.ts']);
  });
});

test('scan detects Base USDC payment identifiers without Monarch checks', () => {
  withTempProject({
    'base-usdc.ts': `
      export async function payBaseUSDC(client, request) {
        return client.baseUSDC.transfer({ chainId: 8453, to: request.recipient });
      }
    `,
  }, (root) => {
    const result = validatePreprod(root);

    assert.equal(result.applicable, true);
    assert.equal(result.ready, false);
    assert.deepEqual(result.scan.unprotectedPaymentFiles, ['base-usdc.ts']);
  });
});

function assertProofPack({ root, unsafeFile, rails }) {
  const unsafeRoot = join(repoRoot, root, 'unsafe');
  const patchedRoot = join(repoRoot, root, 'patched');
  const unsafe = validatePreprod(unsafeRoot);
  const patched = validatePreprod(patchedRoot);
  const patchedRails = new Set(patched.scan.findings.flatMap((finding) => finding.rails ?? []));

  assert.equal(unsafe.applicable, true);
  assert.equal(unsafe.ready, false);
  assert.deepEqual(unsafe.scan.unprotectedPaymentFiles, [unsafeFile]);

  assert.equal(patched.applicable, true);
  assert.equal(patched.ready, true);
  for (const rail of rails) {
    assert.equal(patchedRails.has(rail), true);
  }
}

test('Base x402 proof pack fails unsafe project and passes patched project', () => {
  assertProofPack({
    root: 'examples/base-x402-proof-pack',
    unsafeFile: 'pay-base-x402.js',
    rails: ['x402', 'stablecoin', 'wallet'],
  });
});

test('Coinbase AgentKit proof pack fails unsafe project and passes patched project', () => {
  assertProofPack({
    root: 'examples/coinbase-agentkit-proof-pack',
    unsafeFile: 'agentic-wallet-spend.js',
    rails: ['agentkit', 'wallet', 'stablecoin'],
  });
});

test('Virtuals ACP proof pack fails unsafe project and passes patched project', () => {
  assertProofPack({
    root: 'examples/virtuals-acp-proof-pack',
    unsafeFile: 'acp-job-escrow.js',
    rails: ['stablecoin', 'wallet'],
  });
});

test('Google AP2 / A2A x402 proof pack fails unsafe project and passes patched project', () => {
  assertProofPack({
    root: 'examples/google-ap2-a2a-x402-proof-pack',
    unsafeFile: 'ap2-a2a-x402-payment.js',
    rails: ['x402', 'paid_mcp', 'stablecoin'],
  });
});

test('Stripe ACP / Bridge stablecoin proof pack fails unsafe project and passes patched project', () => {
  assertProofPack({
    root: 'examples/stripe-bridge-stablecoin-proof-pack',
    unsafeFile: 'agentic-checkout-stablecoin.js',
    rails: ['stripe', 'stablecoin', 'wallet'],
  });
});

test('Mastercard Agent Pay / Visa Intelligent Commerce proof pack fails unsafe project and passes patched project', () => {
  assertProofPack({
    root: 'examples/card-network-agent-pay-proof-pack',
    unsafeFile: 'card-network-agent-checkout.js',
    rails: ['card'],
  });
});

test('Doctor report mode is non-blocking when telemetry endpoint is unavailable', () => {
  withTempProject({
    'pay.js': `
      import { checkBeforePayment } from '@monarch-shield/x402';
      export async function safePayX402(payment) {
        return checkBeforePayment(payment, () => fetch(payment.resourceUrl, {
          headers: { 'X-PAYMENT': JSON.stringify({ payTo: payment.payTo }) }
        }));
      }
    `,
  }, (root) => {
    const result = spawnSync(process.execPath, [
      cliPath,
      'doctor',
      '--root',
      root,
      '--ci',
      '--report',
    ], {
      cwd: packageRoot,
      env: {
        ...process.env,
        MONARCH_TELEMETRY_URL: 'http://127.0.0.1:9/doctor-run',
        MONARCH_PROOF_SOURCE: 'public-example',
      },
      encoding: 'utf8',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /"status": "passed"/);
  });
});

test('CLI help and unknown command paths are explicit', () => {
  const help = runCli([]);

  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  assert.match(help.stdout, /Test before live/);

  const unknown = runCli(['not-a-command']);

  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown command: not-a-command/);
  assert.match(unknown.stdout, /Usage:/);
});

test('CLI scan reports safe and unsafe project states', () => {
  withTempProject({
    'index.js': 'export const hello = "world";',
  }, (root) => {
    const result = runCli(['scan', '--root', root]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Payment flow detected: no/);
    assert.match(result.stdout, /Recommendation:/);
  });

  withTempProject({
    'pay.js': 'export const charge = (stripe, request) => stripe.paymentIntents.create(request);',
  }, (root) => {
    const result = runCli(['scan', '--root', root]);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Payment flow detected: yes/);
    assert.match(result.stdout, /Monarch check detected: no/);
  });
});

test('CLI sandbox and preprod expose pass and fail decisions', () => {
  const sandbox = runCli(['sandbox']);

  assert.equal(sandbox.status, 0);
  assert.match(sandbox.stdout, /Monarch sandbox/);
  assert.match(sandbox.stdout, /PASS missing-prepayment-check/);

  withTempProject({
    'index.js': 'export const hello = "world";',
  }, (root) => {
    const result = runCli(['preprod', '--root', root]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /No money-moving payment flow detected/);
  });

  withTempProject({
    'pay.js': 'export const pay = (wallet, payTo) => wallet.send(payTo);',
  }, (root) => {
    const result = runCli(['preprod', '--root', root]);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /FAIL monarch_before_payment/);
    assert.match(result.stdout, /Not ready for pre-production/);
  });

  withTempProject({
    'pay.js': `
      import { checkBeforePayment } from '@monarch-shield/x402';
      export const pay = (payment) => checkBeforePayment(payment, () => wallet.send(payment.payTo));
    `,
  }, (root) => {
    const result = runCli(['preprod', '--root', root]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Monarch local checks passed/);
  });
});

test('CLI doctor covers no-flow, failed, and passed text modes', () => {
  withTempProject({
    'index.js': 'export const hello = "world";',
  }, (root) => {
    const result = runCli(['doctor', '--root', root, '--strict']);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /NO PAYMENT FLOW DETECTED/);
  });

  withTempProject({
    'pay.js': 'export const pay = (wallet, payTo) => wallet.send(payTo);',
  }, (root) => {
    const result = runCli(['doctor', '--root', root]);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Status: FAILED/);
    assert.match(result.stdout, /Patch pay\.js/);
    assert.match(result.stdout, /Suggested command:/);
  });

  withTempProject({
    'pay.js': `
      import { checkBeforePayment } from '@monarch-shield/x402';
      export const pay = (payment) => checkBeforePayment(payment, () => wallet.send(payment.payTo));
    `,
  }, (root) => {
    const result = runCli(['doctor', '--root', root]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Status: PASSED/);
    assert.match(result.stdout, /Detected:/);
  });
});

test('CLI doctor JSON reports strict no-flow status', () => {
  withTempProject({
    'index.js': 'export const hello = "world";',
  }, (root) => {
    const result = runCli(['doctor', '--root', root, '--ci', '--strict']);
    const payload = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.equal(payload.status, 'failed_no_payment_flow');
    assert.equal(payload.ready, false);
    assert.match(payload.summary, /Strict mode expected money-moving code/);
  });
});

test('CLI check validates required options and prints decisions', () => {
  const missing = runCli(['check', '--resource-url', 'https://api.example.com/x402']);

  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Missing required option: --pay-to/);

  const allowed = runCli([
    'check',
    '--resource-url',
    'https://api.example.com/x402',
    '--pay-to',
    '0x123',
    '--amount',
    '0.02',
    '--asset',
    'USDC',
    '--network',
    'base',
    '--intent',
    'agent buying api data',
    '--provider-status',
    'verified',
    '--delivery-reliability',
    'high',
    '--price-sanity',
    'normal',
  ]);
  const payload = JSON.parse(allowed.stdout);

  assert.equal(allowed.status, 0);
  assert.equal(payload.decision, 'allow');
});

test('CLI init installs templates and rejects unknown templates', () => {
  withTempProject({}, (root) => {
    const result = runCli(['init', '--template', 'paid-mcp-tool'], { cwd: root });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Monarch template installed: paid-mcp-tool/);
    assert.match(result.stdout, /Next: npx @monarch-shield\/x402 doctor/);
  });

  const result = runCli(['init', '--template', 'missing-template']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Template not found: missing-template/);
});

test('CLI root option requires a value', () => {
  const result = runCli(['scan', '--root']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing value for --root/);
});
