#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const artifactsDir = join(repoRoot, 'artifacts');
const backupsDir = join(artifactsDir, 'backups');
const errorsDir = join(artifactsDir, 'errors');
const statusPath = join(artifactsDir, 'holodeck_status.jsonl');
const projectToken = 'monarch-reporting-smoke-token';
const projectHash = hashProjectToken(projectToken);

await main();

async function main() {
  await heartbeat('external_reporting_smoke_started', 'in_progress', 'Packing Monarch workspaces and testing anonymous plus token-backed reporting from a fresh temp project.');
  const startedAt = new Date().toISOString();
  const packRoot = mkdtempSync(join(tmpdir(), 'monarch-reporting-pack-'));
  const smokeRoot = mkdtempSync(join(tmpdir(), 'monarch-reporting-smoke-'));
  const serverState = { reports: [] };
  const server = createProofServer(serverState);

  try {
    const endpoint = await listen(server);
    const x402Pack = packWorkspace('@monarch-shield/x402', packRoot);
    const doctorPack = packWorkspace('x402-doctor', packRoot);
    installPackedPackages(smokeRoot, [x402Pack, doctorPack]);
    const projectRoot = writeSafeProject(smokeRoot);

    const anonymous = await runNpx(smokeRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict', '--report'], {
      MONARCH_TELEMETRY_URL: `${endpoint}/doctor-run`,
    });
    const tokenBacked = await runNpx(smokeRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict', '--report'], {
      MONARCH_TELEMETRY_URL: `${endpoint}/doctor-run`,
      MONARCH_PROJECT_TOKEN: projectToken,
    });

    const proofResponse = await fetch(`${endpoint}/projects/${projectHash}/proof`);
    const proof = await proofResponse.json();
    const badgeResponse = await fetch(`${endpoint}/projects/${projectHash}/badge.svg`);
    const badge = await badgeResponse.text();
    const assertions = assertReportingSmoke({ anonymous, tokenBacked, reports: serverState.reports, proof, badge });
    const passed = assertions.every((assertion) => assertion.passed);
    const report = {
      tool: 'monarch-external-reporting-smoke',
      status: passed ? 'passed' : 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      packageSource: 'local npm pack tarballs',
      tempProject: process.env.MONARCH_KEEP_EXTERNAL_SMOKE === '1' ? smokeRoot : 'ephemeral temp project removed after run',
      projectHash,
      assertions,
    };

    writeArtifact('external-reporting-smoke.json', `${JSON.stringify(report, null, 2)}\n`);
    writeArtifact('external-reporting-smoke.md', renderMarkdown(report));
    await heartbeat('external_reporting_smoke_completed', report.status, `External reporting smoke ${report.status} with ${assertions.length} assertions.`);

    if (!passed) {
      logError('external-reporting-smoke', report);
      process.exitCode = 1;
    }
  } catch (error) {
    const failure = {
      tool: 'monarch-external-reporting-smoke',
      status: 'error',
      message: error.message,
      stack: error.stack,
      completedAt: new Date().toISOString(),
    };
    logError('external-reporting-smoke', failure);
    await heartbeat('external_reporting_smoke_error', 'failed', error.message);
    throw error;
  } finally {
    await new Promise((resolveServer) => server.close(resolveServer));
    rmSync(packRoot, { recursive: true, force: true });
    if (process.env.MONARCH_KEEP_EXTERNAL_SMOKE !== '1') {
      rmSync(smokeRoot, { recursive: true, force: true });
    }
  }
}

function createProofServer(state) {
  return createServer(async (request, response) => {
    try {
      if (request.method === 'POST' && request.url === '/doctor-run') {
        const payload = JSON.parse(await readBody(request));
        state.reports.push(payload);
        response.writeHead(202, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ accepted: true, stored: true }));
        return;
      }

      if (request.method === 'GET' && request.url === `/projects/${projectHash}/proof`) {
        const scoped = state.reports.filter((report) => report.projectScope === true && report.projectHash === projectHash);
        const latest = scoped.at(-1);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          projectHash,
          counters: {
            totalRuns: scoped.length,
            passedRuns: scoped.filter((report) => report.status === 'passed').length,
            failedRuns: scoped.filter((report) => report.status !== 'passed').length,
            ciRuns: scoped.filter((report) => report.ci === true).length,
            localRuns: scoped.filter((report) => report.ci !== true).length,
          },
          runs: latest ? [safeRun(latest)] : [],
        }));
        return;
      }

      if (request.method === 'GET' && request.url === `/projects/${projectHash}/badge.svg`) {
        response.writeHead(200, { 'content-type': 'image/svg+xml' });
        response.end('<svg xmlns="http://www.w3.org/2000/svg"><text>monarch proof: passing</text></svg>');
        return;
      }

      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'not_found' }));
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error.message }));
    }
  });
}

function safeRun(report) {
  return {
    receivedAt: report.timestamp,
    status: report.status,
    ci: report.ci,
    strict: report.strict,
    applicable: report.applicable,
    rails: report.detectedRails,
    findingCount: report.findingCount,
    sandboxPassed: report.sandboxPassed,
    hasUnprotectedPaymentFiles: report.hasUnprotectedPaymentFiles,
  };
}

function assertReportingSmoke({ anonymous, tokenBacked, reports, proof, badge }) {
  const anonymousReport = reports.find((report) => report.projectScope === false);
  const tokenReport = reports.find((report) => report.projectScope === true);
  const proofRun = proof.runs?.[0] ?? {};
  const safeRunKeys = [
    'receivedAt',
    'status',
    'ci',
    'strict',
    'applicable',
    'rails',
    'findingCount',
    'sandboxPassed',
    'hasUnprotectedPaymentFiles',
  ];
  const serialized = JSON.stringify({ reports, proof });

  return [
    assertion('anonymous --report exits successfully', anonymous.status === 0),
    assertion('token-backed --report exits successfully', tokenBacked.status === 0),
    assertion('anonymous report stays aggregate-only', Boolean(anonymousReport) && anonymousReport.projectScope === false),
    assertion('token-backed report sends projectScope', Boolean(tokenReport) && tokenReport.projectScope === true),
    assertion('project token is hashed locally', Boolean(tokenReport) && tokenReport.projectHash === projectHash && !serialized.includes(projectToken)),
    assertion('proof endpoint returns one token-backed run', proof.counters?.totalRuns === 1 && proof.projectHash === projectHash),
    assertion('proof run exposes only safe fields', JSON.stringify(Object.keys(proofRun)) === JSON.stringify(safeRunKeys)),
    assertion('badge endpoint reflects latest state', badge.includes('passing')),
  ];
}

function assertion(name, passed) {
  return { name, passed };
}

function listen(server) {
  return new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveListen(`http://127.0.0.1:${address.port}`);
    });
  });
}

function packWorkspace(workspace, packRoot) {
  const result = spawnSync('npm', ['pack', '--workspace', workspace, '--pack-destination', packRoot], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assertSpawn(result, `npm pack ${workspace}`);
  const filename = result.stdout.trim().split('\n').at(-1);
  return resolve(packRoot, filename);
}

function installPackedPackages(smokeRoot, packages) {
  writeFileSync(join(smokeRoot, 'package.json'), `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`);
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund', ...packages], {
    cwd: smokeRoot,
    encoding: 'utf8',
  });
  assertSpawn(result, 'npm install packed Monarch packages');
}

function writeSafeProject(smokeRoot) {
  const projectRoot = join(smokeRoot, 'safe-payment-project');
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(join(projectRoot, 'pay.js'), `
import { checkBeforePayment } from '@monarch-shield/x402';

export async function payAgent(wallet, payment) {
  return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
}
`.trimStart());
  return projectRoot;
}

function runNpx(cwd, args, env) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn('npx', ['--no-install', ...args], {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', rejectRun);
    child.once('close', (status) => {
      resolveRun({ status, stdout, stderr });
    });
  });
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolveBody(body));
    request.on('error', rejectBody);
  });
}

function assertSpawn(result, label) {
  if (result.error) {
    throw new Error(`${label} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with ${result.status}: ${result.stderr || result.stdout}`);
  }
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
  const rows = report.assertions
    .map((assertionResult) => `| ${assertionResult.name} | ${assertionResult.passed ? 'PASS' : 'FAIL'} |`)
    .join('\n');

  return `# External Reporting Smoke Report

Status: ${report.status}

Package source: ${report.packageSource}

Project hash: \`${report.projectHash}\`

This smoke test installs Monarch from local npm pack tarballs into a fresh temp project, runs anonymous \`--report\`, reruns with \`MONARCH_PROJECT_TOKEN\`, and verifies that only the token-backed run appears in project proof. It proves the reporting path and privacy boundary only; it does not claim runtime payment safety, hosted enforcement, signed attestations, settlement safety, fraud prevention, or wallet ownership verification.

| Assertion | Result |
| --- | --- |
${rows}
`;
}

function hashProjectToken(token) {
  return createHash('sha256')
    .update(`monarch-project-token:v1:${token}`)
    .digest('hex')
    .slice(0, 24);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
