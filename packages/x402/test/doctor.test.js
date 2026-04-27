import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runSandbox, scanProject, validatePreprod } from '../src/index.js';

const packageRoot = join(import.meta.dirname, '..');
const cliPath = join(packageRoot, 'src/cli.js');

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
