#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = new URL('..', import.meta.url).pathname;
const artifactsDir = join(repoRoot, 'artifacts');
const publicDir = join(repoRoot, 'public');
const unsafeRoot = join(repoRoot, 'examples/base-x402-proof-pack/unsafe');
const patchedRoot = join(repoRoot, 'examples/base-x402-proof-pack/patched');
const cliPath = join(repoRoot, 'packages/x402/src/cli.js');
const recordingPath = join(artifactsDir, 'base-x402-proof-pack-recording.txt');
const summaryPath = join(artifactsDir, 'base-x402-proof-pack-summary.json');
const publicRecordingPath = join(publicDir, 'base-x402-proof-pack-recording.txt');
const publicSummaryPath = join(publicDir, 'base-x402-proof-pack-summary.json');

const transcript = [];
const results = [];

function record(line = '') {
  transcript.push(line);
}

function displayArg(arg) {
  return arg.startsWith(repoRoot) ? arg.replace(repoRoot, '') : arg;
}

function publicOutput(output) {
  return output.replaceAll(repoRoot, '');
}

function runStep(label, args, cwd, expectedExit) {
  record(`## ${label}`);
  record(`$ node ${[cliPath, ...args].map(displayArg).join(' ')}`);

  try {
    const output = execFileSync('node', [cliPath, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (output.trim()) record(publicOutput(output.trimEnd()));
    results.push({ label, status: 0 });

    if (expectedExit !== 0) {
      throw new Error(`Expected exit ${expectedExit}, got 0`);
    }
  } catch (error) {
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';
    const status = error.status ?? 1;

    if (stdout.trim()) record(publicOutput(stdout.trimEnd()));
    if (stderr.trim()) record(publicOutput(stderr.trimEnd()));
    results.push({ label, status });

    if (status !== expectedExit) {
      throw new Error(`Expected exit ${expectedExit}, got ${status}`);
    }
  }

  record('');
}

mkdirSync(artifactsDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

record('# Monarch for x402 on Base Proof Pack');
record('# Scenario: Base USDC x402 payment code is blocked until Monarch runs before X-PAYMENT.');
record('');

runStep('Unsafe Base x402 project fails Doctor', ['doctor', '--root', unsafeRoot, '--ci', '--strict'], repoRoot, 1);
runStep('Patched Base x402 project passes Doctor', ['doctor', '--root', patchedRoot, '--ci', '--strict'], repoRoot, 0);
runStep('Sandbox proves unsafe payment branches', ['sandbox'], repoRoot, 0);

const recording = `${transcript.join('\n')}\n`;
const summary = JSON.stringify({
  demo: 'monarch-for-x402-on-base-proof-pack',
  status: 'passed',
  publicProofUrl: 'https://x402ms.ai/proof/',
  recordingPath: 'public/base-x402-proof-pack-recording.txt',
  examples: {
    unsafe: 'examples/base-x402-proof-pack/unsafe',
    patched: 'examples/base-x402-proof-pack/patched',
  },
  proves: [
    'Doctor blocks x402/Base USDC code without a Monarch pre-payment check',
    'Doctor passes after checkBeforePayment wraps the Base x402 payment path',
    'The patched example keeps Monarch before X-PAYMENT creation and payment execution',
    'CI can enforce Doctor with --ci --strict',
    'Sandbox covers allow/caution/block/route branches without real funds',
  ],
  results,
}, null, 2);

writeFileSync(recordingPath, recording);
writeFileSync(summaryPath, summary);
writeFileSync(publicRecordingPath, recording);
writeFileSync(publicSummaryPath, summary);

console.log(`Wrote ${recordingPath}`);
console.log(`Wrote ${summaryPath}`);
console.log(`Wrote ${publicRecordingPath}`);
console.log(`Wrote ${publicSummaryPath}`);
