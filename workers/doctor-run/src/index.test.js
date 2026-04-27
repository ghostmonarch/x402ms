import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

function doctorPayload(overrides = {}) {
  return {
    event: 'doctor_run',
    tool: 'monarch-doctor',
    version: '0.1.0',
    status: 'failed',
    ci: false,
    strict: false,
    applicable: true,
    hasPaymentFlow: true,
    hasUnprotectedPaymentFiles: true,
    findingCount: 2,
    detectedRails: ['stripe', 'x402'],
    sandboxPassed: true,
    proofSource: 'internal-dogfood',
    projectHash: 'abcdefabcdefabcdefabcdef',
    timestamp: '2026-04-26T18:00:00.000Z',
    ...overrides,
  };
}

function jsonRequest(path, payload) {
  return new Request(`https://worker.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function mockDb({ totals = {}, byStatus = [], bySource = [], railRows = [], projectRuns = [], latest = null } = {}) {
  const calls = [];

  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              calls.push({ type: 'run', sql, values });
              return { success: true };
            },
            async first() {
              calls.push({ type: 'first', sql, values });
              if (sql.includes('ORDER BY received_at DESC')) return latest;
              return totals;
            },
            async all() {
              calls.push({ type: 'all', sql, values });
              if (sql.includes('GROUP BY status')) return { results: byStatus };
              if (sql.includes('GROUP BY source')) return { results: bySource };
              if (sql.includes('ORDER BY received_at DESC')) return { results: projectRuns };
              return { results: railRows };
            },
          };
        },
      };
    },
  };
}

test('public proof endpoint returns labeled empty counters without DB', async () => {
  const response = await worker.fetch(new Request('https://worker.example/proof'), {});
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.stored, false);
  assert.equal(payload.counters.publicExampleRuns, 8);
  assert.equal(payload.counters.internalDogfoodRuns, 0);
  assert.equal(payload.counters.externalReportedRuns, 0);
  assert.match(payload.interpretation.internalDogfood, /proof-of-function/);
});

test('doctor run accepts aggregate proof source and detected rails', async () => {
  const DB = mockDb();
  const response = await worker.fetch(jsonRequest('/doctor-run', doctorPayload()), { DB });
  const payload = await response.json();
  const insert = DB.calls.find((call) => call.type === 'run');

  assert.equal(response.status, 202);
  assert.deepEqual(payload, { accepted: true, stored: true });
  assert.equal(insert.values.at(-3), 'stripe,x402');
  assert.equal(insert.values.at(-2), 'internal-dogfood');
  assert.equal(insert.values.at(-1), 0);
});

test('public proof endpoint aggregates runs, sources, and rails', async () => {
  const DB = mockDb({
    totals: {
      total_runs: 4,
      unique_projects: 2,
      internal_dogfood_runs: 1,
      reported_public_example_runs: 1,
      external_reported_runs: 2,
      ci_runs: 1,
      reported_local_runs: 3,
      passed_runs: 2,
      blocked_or_failed_runs: 2,
      unsafe_paths_blocked: 2,
    },
    byStatus: [{ status: 'failed', runs: 2 }],
    bySource: [{ source: 'external-reported', runs: 2 }],
    railRows: [{ detected_rails: 'stripe,x402' }, { detected_rails: 'x402,wallet' }],
  });

  const response = await worker.fetch(new Request('https://worker.example/proof?date=2026-04-26'), { DB });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.date, '2026-04-26');
  assert.equal(payload.counters.totalRuns, 4);
  assert.equal(payload.counters.publicExampleRuns, 9);
  assert.deepEqual(payload.byRail, [
    { rail: 'x402', runs: 2 },
    { rail: 'stripe', runs: 1 },
    { rail: 'wallet', runs: 1 },
  ]);
});

test('doctor run rejects invalid proof rails', async () => {
  const response = await worker.fetch(jsonRequest('/doctor-run', doctorPayload({
    detectedRails: ['raw_wallet_address'],
  })), { DB: mockDb() });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'invalid_detected_rail_raw_wallet_address');
});

test('doctor run stores token-backed project scope without raw token fields', async () => {
  const DB = mockDb();
  const response = await worker.fetch(jsonRequest('/doctor-run', doctorPayload({
    projectScope: true,
  })), { DB });
  const insert = DB.calls.find((call) => call.type === 'run');

  assert.equal(response.status, 202);
  assert.equal(insert.values.at(-1), 1);
});

test('doctor run rejects token-shaped payload fields', async () => {
  const response = await worker.fetch(jsonRequest('/doctor-run', doctorPayload({
    projectToken: 'secret-token',
  })), { DB: mockDb() });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.error, 'sensitive_field_projectToken');
});

test('project proof endpoint returns only privacy-safe fields for token-backed runs', async () => {
  const DB = mockDb({
    totals: {
      total_runs: 2,
      passed_runs: 1,
      failed_runs: 1,
      ci_runs: 1,
      local_runs: 1,
      unsafe_paths_blocked: 1,
      sandbox_passed_runs: 1,
    },
    railRows: [{ detected_rails: 'x402,wallet' }],
    projectRuns: [{
      received_at: '2026-04-27T12:00:00.000Z',
      status: 'failed',
      ci: 1,
      strict: 1,
      applicable: 1,
      detected_rails: 'x402,wallet',
      finding_count: 2,
      sandbox_passed: 1,
      has_unprotected_payment_files: 1,
    }],
  });

  const response = await worker.fetch(new Request('https://worker.example/projects/abcdefabcdefabcdefabcdef/proof'), { DB });
  const payload = await response.json();
  const run = payload.runs[0];

  assert.equal(response.status, 200);
  assert.equal(payload.scope, 'token-backed-project-proof');
  assert.equal(payload.counters.totalRuns, 2);
  assert.deepEqual(Object.keys(run), [
    'receivedAt',
    'status',
    'ci',
    'strict',
    'applicable',
    'rails',
    'findingCount',
    'sandboxPassed',
    'hasUnprotectedPaymentFiles',
  ]);
  assert.equal(run.hasUnprotectedPaymentFiles, true);
  assert.equal(Object.hasOwn(run, 'commitSha'), false);
  assert.equal(Object.hasOwn(run, 'repoName'), false);
  assert.equal(Object.hasOwn(run, 'fileNames'), false);
  assert.equal(Object.hasOwn(run, 'urls'), false);
});

test('project badge reflects latest token-backed project state', async () => {
  const passing = await worker.fetch(new Request('https://worker.example/projects/abcdefabcdefabcdefabcdef/badge.svg'), {
    DB: mockDb({ latest: { status: 'passed', sandbox_passed: 1, has_unprotected_payment_files: 0 } }),
  });
  const passingSvg = await passing.text();

  assert.equal(passing.status, 200);
  assert.match(passingSvg, /monarch proof/);
  assert.match(passingSvg, /passing/);

  const missing = await worker.fetch(new Request('https://worker.example/projects/abcdefabcdefabcdefabcdef/badge.svg'), {
    DB: mockDb({ latest: null }),
  });
  const missingSvg = await missing.text();

  assert.equal(missing.status, 200);
  assert.match(missingSvg, /no runs/);
});
