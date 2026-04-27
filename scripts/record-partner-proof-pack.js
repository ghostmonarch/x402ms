#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = new URL('..', import.meta.url).pathname;
const cliPath = join(repoRoot, 'packages/x402/src/cli.js');
const artifactsDir = join(repoRoot, 'artifacts');
const publicDir = join(repoRoot, 'public');

const packs = {
  'virtuals-acp': {
    title: 'Monarch for Virtuals ACP Proof Pack',
    scenario: 'Virtuals ACP USDC escrow job funding is blocked until Monarch runs before escrow funding.',
    root: 'examples/virtuals-acp-proof-pack',
    recording: 'virtuals-acp-proof-pack-recording.txt',
    summary: 'virtuals-acp-proof-pack-summary.json',
    demo: 'monarch-for-virtuals-acp-proof-pack',
    unsafeLabel: 'Unsafe Virtuals ACP project fails Doctor',
    patchedLabel: 'Patched Virtuals ACP project passes Doctor',
    proves: [
      'Doctor blocks Virtuals ACP USDC escrow funding without a Monarch pre-payment check',
      'Doctor passes after checkBeforePayment wraps ACP job funding',
      'The patched example keeps Monarch before USDC escrow movement',
      'CI can enforce Doctor with --ci --strict',
      'Sandbox covers allow/caution/block/route branches without real funds',
    ],
  },
  'google-ap2-a2a-x402': {
    title: 'Monarch for Google AP2 and A2A x402 Proof Pack',
    scenario: 'AP2 embedded A2A x402 payment submission is blocked until Monarch runs before the payment payload.',
    root: 'examples/google-ap2-a2a-x402-proof-pack',
    recording: 'google-ap2-a2a-x402-proof-pack-recording.txt',
    summary: 'google-ap2-a2a-x402-proof-pack-summary.json',
    demo: 'monarch-for-google-ap2-a2a-x402-proof-pack',
    unsafeLabel: 'Unsafe Google AP2 / A2A x402 project fails Doctor',
    patchedLabel: 'Patched Google AP2 / A2A x402 project passes Doctor',
    proves: [
      'Doctor blocks AP2 / A2A x402 code without a Monarch pre-payment check',
      'Doctor passes after checkBeforePayment wraps x402 payment payload submission',
      'The patched example keeps Monarch before AP2 PaymentMandate execution',
      'CI can enforce Doctor with --ci --strict',
      'Sandbox covers allow/caution/block/route branches without real funds',
    ],
  },
  'stripe-bridge': {
    title: 'Monarch for Stripe ACP / Bridge Stablecoin Flows Proof Pack',
    scenario: 'Agentic checkout plus stablecoin settlement is blocked until Monarch runs before checkout completion.',
    root: 'examples/stripe-bridge-stablecoin-proof-pack',
    recording: 'stripe-bridge-stablecoin-proof-pack-recording.txt',
    summary: 'stripe-bridge-stablecoin-proof-pack-summary.json',
    demo: 'monarch-for-stripe-bridge-stablecoin-proof-pack',
    unsafeLabel: 'Unsafe Stripe ACP / Bridge stablecoin project fails Doctor',
    patchedLabel: 'Patched Stripe ACP / Bridge stablecoin project passes Doctor',
    proves: [
      'Doctor blocks Stripe ACP / Bridge stablecoin code without a Monarch pre-payment check',
      'Doctor passes after checkBeforePayment wraps checkout completion and stablecoin settlement',
      'The patched example keeps Monarch before PaymentIntent and USDC movement',
      'CI can enforce Doctor with --ci --strict',
      'Sandbox covers allow/caution/block/route branches without real funds',
    ],
  },
  'card-network-agent-pay': {
    title: 'Monarch for Mastercard Agent Pay / Visa Intelligent Commerce Proof Pack',
    scenario: 'Tokenized card-agent checkout is blocked until Monarch runs before checkout execution.',
    root: 'examples/card-network-agent-pay-proof-pack',
    recording: 'card-network-agent-pay-proof-pack-recording.txt',
    summary: 'card-network-agent-pay-proof-pack-summary.json',
    demo: 'monarch-for-mastercard-agent-pay-visa-intelligent-commerce-proof-pack',
    unsafeLabel: 'Unsafe Mastercard Agent Pay / Visa Intelligent Commerce project fails Doctor',
    patchedLabel: 'Patched Mastercard Agent Pay / Visa Intelligent Commerce project passes Doctor',
    proves: [
      'Doctor blocks tokenized card-agent checkout without a Monarch pre-payment check',
      'Doctor passes after checkBeforePayment wraps Mastercard Agent Pay / Visa Intelligent Commerce checkout',
      'The patched example keeps Monarch before tokenized payment credential execution',
      'CI can enforce Doctor with --ci --strict',
      'Sandbox covers allow/caution/block/route branches without real funds',
    ],
  },
};

const packId = process.argv[2];
const pack = packs[packId];

if (!pack) {
  console.error(`Usage: node scripts/record-partner-proof-pack.js ${Object.keys(packs).join('|')}`);
  process.exit(1);
}

const transcript = [];
const results = [];
const unsafeRoot = join(repoRoot, pack.root, 'unsafe');
const patchedRoot = join(repoRoot, pack.root, 'patched');
const recordingPath = join(artifactsDir, pack.recording);
const summaryPath = join(artifactsDir, pack.summary);
const publicRecordingPath = join(publicDir, pack.recording);
const publicSummaryPath = join(publicDir, pack.summary);

function record(line = '') {
  transcript.push(line);
}

function displayArg(arg) {
  return arg.startsWith(repoRoot) ? arg.replace(repoRoot, '') : arg;
}

function publicOutput(output) {
  return output.replaceAll(repoRoot, '');
}

function runStep(label, args, expectedExit) {
  record(`## ${label}`);
  record(`$ node ${[cliPath, ...args].map(displayArg).join(' ')}`);

  try {
    const output = execFileSync('node', [cliPath, ...args], {
      cwd: repoRoot,
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

record(`# ${pack.title}`);
record(`# Scenario: ${pack.scenario}`);
record('');

runStep(pack.unsafeLabel, ['doctor', '--root', unsafeRoot, '--ci', '--strict'], 1);
runStep(pack.patchedLabel, ['doctor', '--root', patchedRoot, '--ci', '--strict'], 0);
runStep('Sandbox proves unsafe payment branches', ['sandbox'], 0);

const recording = `${transcript.join('\n')}\n`;
const summary = JSON.stringify({
  demo: pack.demo,
  status: 'passed',
  publicProofUrl: 'https://x402ms.ai/#proof',
  recordingPath: `public/${pack.recording}`,
  examples: {
    unsafe: `${pack.root}/unsafe`,
    patched: `${pack.root}/patched`,
  },
  proves: pack.proves,
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
