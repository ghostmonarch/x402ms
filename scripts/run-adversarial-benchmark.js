#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const benchmarkRoot = join(repoRoot, 'examples/adversarial-doctor-benchmark');
const manifestPath = join(benchmarkRoot, 'manifest.json');
const artifactsDir = join(repoRoot, 'artifacts');
const backupsDir = join(artifactsDir, 'backups');
const errorsDir = join(artifactsDir, 'errors');
const statusPath = join(artifactsDir, 'holodeck_status.jsonl');
const cliPath = join(repoRoot, 'packages/x402/src/cli.js');

await main();

async function main() {
  await heartbeat('adversarial_benchmark_started', 'in_progress', 'Running public Doctor benchmark corpus.');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const startedAt = new Date().toISOString();

  try {
    const results = [];
    for (const benchmarkCase of manifest.cases) {
      const result = runCase(benchmarkCase);
      results.push(result);
      await heartbeat('adversarial_benchmark_case', result.passed ? 'completed' : 'failed', `${benchmarkCase.id}: expected ${benchmarkCase.expectedStatus}, got ${result.actualStatus}`);
    }

    const passed = results.every((result) => result.passed);
    const report = {
      tool: 'monarch-adversarial-benchmark',
      status: passed ? 'passed' : 'failed',
      claim: manifest.claim,
      nonClaims: manifest.nonClaims,
      startedAt,
      completedAt: new Date().toISOString(),
      results,
    };

    writeArtifact('adversarial-benchmark.json', `${JSON.stringify(report, null, 2)}\n`);
    writeArtifact('adversarial-benchmark.md', renderMarkdown(report));
    await heartbeat('adversarial_benchmark_completed', report.status, `Adversarial benchmark ${report.status} with ${results.length} cases.`);

    if (!passed) {
      logError('adversarial-benchmark', report);
      process.exitCode = 1;
    }
  } catch (error) {
    const failure = {
      tool: 'monarch-adversarial-benchmark',
      status: 'error',
      message: error.message,
      stack: error.stack,
      completedAt: new Date().toISOString(),
    };
    logError('adversarial-benchmark', failure);
    await heartbeat('adversarial_benchmark_error', 'failed', error.message);
    throw error;
  }
}

function runCase(benchmarkCase) {
  const root = join(benchmarkRoot, benchmarkCase.root);
  const result = spawnSync(process.execPath, [cliPath, 'doctor', '--root', root, '--ci', '--strict'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const payload = parseDoctorJson(result.stdout);
  const actualStatus = payload?.status ?? 'invalid_json';
  const actualUnprotected = payload?.unprotectedPaymentFiles ?? [];
  const expectedUnprotected = benchmarkCase.expectedUnprotectedPaymentFiles ?? [];
  const passed = result.status === benchmarkCase.expectedExitCode
    && actualStatus === benchmarkCase.expectedStatus
    && sameList(actualUnprotected, expectedUnprotected);

  return {
    id: benchmarkCase.id,
    title: benchmarkCase.title,
    root: benchmarkCase.root,
    rationale: benchmarkCase.rationale,
    expectedStatus: benchmarkCase.expectedStatus,
    actualStatus,
    expectedExitCode: benchmarkCase.expectedExitCode,
    actualExitCode: result.status,
    expectedUnprotectedPaymentFiles: expectedUnprotected,
    actualUnprotectedPaymentFiles: actualUnprotected,
    passed,
    limitation: benchmarkCase.limitation ?? null,
    stderr: result.stderr.trim(),
  };
}

function parseDoctorJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function sameList(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function writeArtifact(filename, content) {
  mkdirSync(artifactsDir, { recursive: true });
  mkdirSync(backupsDir, { recursive: true });
  const target = join(artifactsDir, filename);
  if (existsSync(target)) {
    copyFileSync(target, join(backupsDir, `${filename}.${timestamp()}.bak`));
  }
  writeFileSync(target, content);
}

function logError(name, payload) {
  mkdirSync(errorsDir, { recursive: true });
  writeFileSync(join(errorsDir, `${name}-${timestamp()}.json`), `${JSON.stringify(payload, null, 2)}\n`);
}

async function heartbeat(event, status, detail) {
  mkdirSync(artifactsDir, { recursive: true });
  await appendFile(statusPath, `${JSON.stringify({
    ts: new Date().toISOString(),
    agent: 'GPT-5.5',
    event,
    status,
    detail,
  })}\n`);
}

function renderMarkdown(report) {
  const rows = report.results
    .map((result) => `| ${result.id} | ${result.expectedStatus} | ${result.actualStatus} | ${result.actualExitCode} | ${result.passed ? 'PASS' : 'FAIL'} | ${result.limitation ?? ''} |`)
    .join('\n');

  return `# Monarch Doctor Adversarial Benchmark

Status: ${report.status}

Claim: ${report.claim}

Non-claims:
${report.nonClaims.map((claim) => `- ${claim}`).join('\n')}

| Case | Expected | Actual | Exit | Result | Limitation |
| --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
