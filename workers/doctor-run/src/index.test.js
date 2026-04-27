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

function mockDb({ totals = {}, byStatus = [], bySource = [], railRows = [] } = {}) {
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
              return totals;
            },
            async all() {
              calls.push({ type: 'all', sql, values });
              if (sql.includes('GROUP BY status')) return { results: byStatus };
              if (sql.includes('GROUP BY source')) return { results: bySource };
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
  assert.equal(insert.values.at(-2), 'stripe,x402');
  assert.equal(insert.values.at(-1), 'internal-dogfood');
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
