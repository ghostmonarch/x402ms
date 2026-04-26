#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = new URL('..', import.meta.url).pathname;
const demoRoot = '/tmp/monarch-doctor-demo';
const artifactsDir = join(repoRoot, 'artifacts');
const publicDir = join(repoRoot, 'public');
const recordingPath = join(artifactsDir, 'doctor-demo-recording.txt');
const summaryPath = join(artifactsDir, 'doctor-demo-summary.json');
const publicRecordingPath = join(publicDir, 'doctor-demo-recording.txt');
const publicSummaryPath = join(publicDir, 'doctor-demo-summary.json');
const cliPath = join(repoRoot, 'packages/x402/src/cli.js');

const transcript = [];

function record(line = '') {
  transcript.push(line);
}

function run(command, args, cwd, expectedExit = 0) {
  record(`$ ${[command, ...args].join(' ')}`);

  try {
    const output = execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (output.trim()) record(output.trimEnd());
    if (expectedExit !== 0) {
      throw new Error(`Expected exit ${expectedExit}, got 0`);
    }
  } catch (error) {
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';
    const status = error.status ?? 1;

    if (stdout.trim()) record(stdout.trimEnd());
    if (stderr.trim()) record(stderr.trimEnd());

    if (status !== expectedExit) {
      throw new Error(`Expected exit ${expectedExit}, got ${status}`);
    }
  }

  record('');
}

rmSync(demoRoot, { recursive: true, force: true });
mkdirSync(demoRoot, { recursive: true });
mkdirSync(artifactsDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

record('# Monarch Doctor Demo');
record('# Scenario: an agent is asked to build an x402 payment flow.');
record('# Doctor should fail unsafe code, then pass after Monarch is installed.');
record('');

writeFileSync(
  join(demoRoot, 'pay.js'),
  `// Minimal x402-style payment flow intentionally missing Monarch.\n` +
    `const payTo = "0x123";\n` +
    `const paymentHeader = "X-PAYMENT";\n` +
    `async function payEndpoint(resourceUrl) {\n` +
    `  return fetch(resourceUrl, { headers: { [paymentHeader]: payTo } });\n` +
    `}\n` +
    `export { payEndpoint };\n`,
);

record('## 1. Agent detects money-moving code and runs Doctor');
run('node', [cliPath, 'doctor'], demoRoot, 1);

record('## 2. Agent installs the Monarch x402 client template');
run('node', [cliPath, 'init', '--template', 'x402-client'], demoRoot, 0);

record('## 3. Agent reruns Doctor and sees the original payment file still needs patching');
run('node', [cliPath, 'doctor'], demoRoot, 1);

writeFileSync(
  join(demoRoot, 'pay.js'),
  `// x402-style payment flow patched to run Monarch before payment.\n` +
    `import { safePayX402 } from "./monarch/check-before-payment.js";\n\n` +
    `const payTo = "0x123";\n` +
    `const paymentHeader = "X-PAYMENT";\n\n` +
    `async function rawPayX402(payment) {\n` +
    `  return fetch(payment.resourceUrl, { headers: { [paymentHeader]: payment.payTo } });\n` +
    `}\n\n` +
    `async function payEndpoint(resourceUrl) {\n` +
    `  return safePayX402({\n` +
    `    resourceUrl,\n` +
    `    payTo,\n` +
    `    amount: "0.02",\n` +
    `    asset: "USDC",\n` +
    `    network: "base",\n` +
    `    intent: "agent buying API results"\n` +
    `  }, rawPayX402);\n` +
    `}\n\n` +
    `export { payEndpoint };\n`,
);

record('## 4. Agent patches the original payment path and reruns Doctor');
run('node', [cliPath, 'doctor'], demoRoot, 0);

record('## 5. Agent runs sandbox directly to show unsafe branches are covered');
run('node', [cliPath, 'sandbox'], demoRoot, 0);

const recording = `${transcript.join('\n')}\n`;
const summary = JSON.stringify({
    demo: 'monarch-doctor-x402-preflight',
    status: 'passed',
    recordingPath: 'public/doctor-demo-recording.txt',
    proves: [
      'Doctor fails money-moving code with no Monarch check',
      'init installs the x402-client safety harness',
      'Doctor catches that the original payment file still needs patching',
      'Doctor passes after the original payment path calls Monarch before payment',
      'sandbox scenarios cover allow/caution/block/route branches',
    ],
  }, null, 2);

writeFileSync(recordingPath, recording);
writeFileSync(summaryPath, summary);
writeFileSync(publicRecordingPath, recording);
writeFileSync(publicSummaryPath, summary);

console.log(`Wrote ${recordingPath}`);
console.log(`Wrote ${summaryPath}`);
console.log(`Wrote ${publicRecordingPath}`);
console.log(`Wrote ${publicSummaryPath}`);
