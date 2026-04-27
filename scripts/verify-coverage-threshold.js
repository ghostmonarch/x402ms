#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const artifactsDir = join(repoRoot, 'artifacts');
const backupsDir = join(artifactsDir, 'backups');
const errorsDir = join(artifactsDir, 'errors');
const statusPath = join(artifactsDir, 'holodeck_status.jsonl');
const threshold = Number(process.argv[2] ?? '90');

await main();

async function main() {
  await heartbeat('coverage_threshold_started', 'in_progress', `Running coverage with ${threshold}% minimum line coverage.`);
  const result = spawnSync('npm', ['run', 'test:coverage', '--workspace', '@monarch-shield/x402'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const output = `${result.stdout}\n${result.stderr}`;
  const lineCoverage = parseLineCoverage(output);
  const passed = result.status === 0 && lineCoverage >= threshold;
  const report = {
    tool: 'monarch-coverage-threshold',
    status: passed ? 'passed' : 'failed',
    threshold,
    lineCoverage,
    commandExitCode: result.status,
    completedAt: new Date().toISOString(),
  };

  writeArtifact('coverage-threshold.json', `${JSON.stringify(report, null, 2)}\n`);
  await heartbeat('coverage_threshold_completed', report.status, `Line coverage ${lineCoverage}% with threshold ${threshold}%.`);
  process.stdout.write(output);
  console.log(`Coverage threshold: ${lineCoverage}% line coverage, required ${threshold}%.`);

  if (!passed) {
    logError('coverage-threshold', { ...report, output });
    process.exitCode = 1;
  }
}

function parseLineCoverage(output) {
  const match = output.match(/# all files\s+\|\s+([0-9.]+)\s+\|/);
  if (!match) {
    throw new Error('Could not parse all-files line coverage from Node test output.');
  }
  return Number(match[1]);
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

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
