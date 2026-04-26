import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runSandbox, scanProject, validatePreprod } from '../src/index.js';

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
      'src/cli.js',
      'doctor',
      '--root',
      root,
      '--ci',
      '--report',
    ], {
      cwd: join(import.meta.dirname, '..'),
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
