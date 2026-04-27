#!/usr/bin/env node
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const artifactsDir = join(repoRoot, 'artifacts');
const backupsDir = join(artifactsDir, 'backups');
const errorsDir = join(artifactsDir, 'errors');
const statusPath = join(artifactsDir, 'holodeck_status.jsonl');

const cases = [
  {
    id: 'unsafe-wallet-send',
    title: 'Unsafe wallet send fails',
    expectedStatus: 'failed',
    expectedExitCode: 1,
    limitation: null,
    files: {
      'pay.js': `
        export async function payAgent(wallet, payment) {
          return wallet.send(payment.payTo, payment.amount);
        }
      `,
    },
  },
  {
    id: 'patched-check-before-payment',
    title: 'Patched payment path passes',
    expectedStatus: 'passed',
    expectedExitCode: 0,
    limitation: null,
    files: {
      'pay.js': `
        import { checkBeforePayment } from '@monarch-shield/x402';

        export async function payAgent(wallet, payment) {
          return checkBeforePayment(payment, async (safePayment) => {
            return wallet.send(safePayment.payTo, safePayment.amount);
          });
        }
      `,
    },
  },
  {
    id: 'unused-check-import',
    title: 'Unused Monarch import fails',
    expectedStatus: 'failed',
    expectedExitCode: 1,
    limitation: null,
    files: {
      'pay.js': `
        import { checkBeforePayment } from '@monarch-shield/x402';

        export async function payAgent(wallet, payment) {
          return wallet.send(payment.payTo, payment.amount);
        }
      `,
    },
  },
  {
    id: 'guard-after-payment',
    title: 'Guard after payment fails',
    expectedStatus: 'failed',
    expectedExitCode: 1,
    limitation: null,
    files: {
      'pay.js': `
        import { checkBeforePayment } from '@monarch-shield/x402';

        export async function payAgent(wallet, payment) {
          const receipt = await wallet.send(payment.payTo, payment.amount);
          await checkBeforePayment(payment);
          return receipt;
        }
      `,
    },
  },
  {
    id: 'dead-helper',
    title: 'Dead guarded helper fails',
    expectedStatus: 'failed',
    expectedExitCode: 1,
    limitation: null,
    files: {
      'pay.js': `
        import { checkBeforePayment } from '@monarch-shield/x402';

        async function guardedButUnused(wallet, payment) {
          return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
        }

        export async function payAgent(wallet, payment) {
          return wallet.send(payment.payTo, payment.amount);
        }
      `,
    },
  },
  {
    id: 'wrapper-only-safety',
    title: 'Wrapper-only guarded helper passes with static limitation',
    expectedStatus: 'passed',
    expectedExitCode: 0,
    limitation: 'Doctor verifies that the sink is inside a detectable guarded helper in the same scanned project. It does not prove runtime policy, wallet ownership, or every caller-supplied payment field.',
    files: {
      'pay.js': `
        import { checkBeforePayment } from '@monarch-shield/x402';

        async function guardedSend(wallet, payment) {
          return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
        }

        export async function payAgent(wallet, payment) {
          return guardedSend(wallet, payment);
        }
      `,
    },
  },
];

await main();

async function main() {
  await heartbeat('external_agent_smoke_started', 'in_progress', 'Packing Monarch workspaces and creating third-party temp project.');
  const startedAt = new Date().toISOString();
  const packRoot = mkdtempSync(join(tmpdir(), 'monarch-pack-'));
  const smokeRoot = mkdtempSync(join(tmpdir(), 'monarch-external-smoke-'));

  try {
    const x402Pack = packWorkspace('@monarch-shield/x402', packRoot);
    const doctorPack = packWorkspace('x402-doctor', packRoot);
    installPackedPackages(smokeRoot, [x402Pack, doctorPack]);

    const results = [];
    for (const smokeCase of cases) {
      const result = runSmokeCase(smokeRoot, smokeCase);
      results.push(result);
      await heartbeat('external_agent_smoke_case', result.passed ? 'completed' : 'failed', `${smokeCase.id}: expected ${smokeCase.expectedStatus}, got ${result.actualStatus}`);
    }

    results.push(runProblemNameAlias(smokeRoot, x402Pack));
    results.push(runFakePathAlias(smokeRoot));

    const passed = results.every((result) => result.passed);
    const report = {
      tool: 'monarch-external-agent-smoke',
      status: passed ? 'passed' : 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      packageSource: 'local npm pack tarballs',
      tempProject: process.env.MONARCH_KEEP_EXTERNAL_SMOKE === '1' ? smokeRoot : 'ephemeral temp project removed after run',
      results,
    };

    writeArtifact('external-agent-smoke.json', `${JSON.stringify(report, null, 2)}\n`);
    writeArtifact('external-agent-smoke.md', renderMarkdown(report));
    await heartbeat('external_agent_smoke_completed', report.status, `External packaged smoke ${report.status} with ${results.length} checks.`);

    if (!passed) {
      logError('external-agent-smoke', report);
      process.exitCode = 1;
    }
  } catch (error) {
    const failure = {
      tool: 'monarch-external-agent-smoke',
      status: 'error',
      message: error.message,
      stack: error.stack,
      completedAt: new Date().toISOString(),
    };
    logError('external-agent-smoke', failure);
    await heartbeat('external_agent_smoke_error', 'failed', error.message);
    throw error;
  } finally {
    rmSync(packRoot, { recursive: true, force: true });
    if (process.env.MONARCH_KEEP_EXTERNAL_SMOKE !== '1') {
      rmSync(smokeRoot, { recursive: true, force: true });
    }
  }
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

function runSmokeCase(smokeRoot, smokeCase) {
  const projectRoot = join(smokeRoot, 'cases', smokeCase.id);
  for (const [file, content] of Object.entries(smokeCase.files)) {
    const target = join(projectRoot, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, trimTemplate(content));
  }

  const result = runNpx(smokeRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict']);
  const payload = parseDoctorJson(result.stdout);
  const status = payload?.status ?? 'invalid_json';
  const passed = result.status === smokeCase.expectedExitCode && status === smokeCase.expectedStatus;

  return {
    id: smokeCase.id,
    title: smokeCase.title,
    command: 'npx --no-install x402 doctor --root <case> --ci --strict',
    expectedStatus: smokeCase.expectedStatus,
    actualStatus: status,
    expectedExitCode: smokeCase.expectedExitCode,
    actualExitCode: result.status,
    passed,
    limitation: smokeCase.limitation,
    unprotectedPaymentFiles: payload?.unprotectedPaymentFiles ?? [],
    stderr: result.stderr.trim(),
  };
}

function runProblemNameAlias(smokeRoot, x402Pack) {
  const projectRoot = join(smokeRoot, 'alias-case');
  writeCaseFile(projectRoot, `
    import { checkBeforePayment } from '@monarch-shield/x402';

    export async function payAgent(wallet, payment) {
      return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
    }
  `);

  const result = runNpx(smokeRoot, ['x402-doctor', '--root', projectRoot, '--ci', '--strict']);
  const payload = parseDoctorJson(result.stdout);

  return {
    id: 'x402-doctor-alias',
    title: 'Problem-name x402-doctor alias passes patched project',
    command: 'npx --no-install x402-doctor --root <case> --ci --strict',
    expectedStatus: 'passed',
    actualStatus: payload?.status ?? 'invalid_json',
    expectedExitCode: 0,
    actualExitCode: result.status,
    passed: result.status === 0 && payload?.status === 'passed',
    packageSource: x402Pack,
    stderr: result.stderr.trim(),
  };
}

function runFakePathAlias(smokeRoot) {
  const projectRoot = join(smokeRoot, 'fake-path-case');
  const fakeBin = join(smokeRoot, 'fake-bin');
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(join(fakeBin, 'monarch'), '#!/usr/bin/env bash\necho "fake monarch should not run" >&2\nexit 77\n');
  chmodSync(join(fakeBin, 'monarch'), 0o755);
  writeCaseFile(projectRoot, `
    import { checkBeforePayment } from '@monarch-shield/x402';

    export async function payAgent(wallet, payment) {
      return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
    }
  `);

  const result = spawnSync('npx', ['--no-install', 'x402-doctor', '--root', projectRoot, '--ci', '--strict'], {
    cwd: smokeRoot,
    env: {
      ...process.env,
      PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
    },
    encoding: 'utf8',
  });
  const payload = parseDoctorJson(result.stdout);

  return {
    id: 'fake-path-monarch',
    title: 'x402-doctor ignores fake monarch earlier on PATH',
    command: 'PATH=<fake-bin> npx --no-install x402-doctor --root <case> --ci --strict',
    expectedStatus: 'passed',
    actualStatus: payload?.status ?? 'invalid_json',
    expectedExitCode: 0,
    actualExitCode: result.status,
    passed: result.status === 0 && payload?.status === 'passed' && !result.stderr.includes('fake monarch should not run'),
    stderr: result.stderr.trim(),
  };
}

function runNpx(cwd, args) {
  return spawnSync('npx', ['--no-install', ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function writeCaseFile(projectRoot, content) {
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(join(projectRoot, 'pay.js'), trimTemplate(content));
}

function parseDoctorJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
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
  const rows = report.results
    .map((result) => `| ${result.id} | ${result.expectedStatus} | ${result.actualStatus} | ${result.actualExitCode} | ${result.passed ? 'PASS' : 'FAIL'} | ${result.limitation ?? ''} |`)
    .join('\n');

  return `# External Agent Smoke Report

Status: ${report.status}

Package source: ${report.packageSource}

This smoke test installs Monarch from local npm pack tarballs into a fresh temp project and runs Doctor as an outside agent would. It proves the build-time preflight behavior only; it does not claim runtime policy enforcement, hosted proof, settlement safety, fraud prevention, or wallet ownership verification.

| Case | Expected | Actual | Exit | Result | Limitation |
| --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function trimTemplate(value) {
  return `${value.trim()}\n`;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
