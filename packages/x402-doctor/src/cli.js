#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const commands = new Set(['doctor', 'init', 'scan', 'sandbox', 'preprod', 'check', 'help']);
const firstArg = args[0];
const monarchArgs = !firstArg || firstArg.startsWith('-') || firstArg === 'help'
  ? ['doctor', ...args.filter((arg) => arg !== '--help' && arg !== '-h')]
  : commands.has(firstArg)
    ? args
    : ['doctor', ...args];
const monarchBin = process.platform === 'win32' ? 'monarch.cmd' : 'monarch';

const result = spawnSync(monarchBin, monarchArgs, { stdio: 'inherit' });

if (result.error) {
  console.error('x402-doctor could not start Monarch Doctor.');
  console.error('Install or run the canonical package directly: npx @monarch-shield/x402 doctor');
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 0;
}
