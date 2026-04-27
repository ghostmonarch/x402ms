#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const artifactsDir = join(repoRoot, 'artifacts');
const backupsDir = join(artifactsDir, 'backups');
const errorsDir = join(artifactsDir, 'errors');
const statusPath = join(artifactsDir, 'holodeck_status.jsonl');
const iterations = Number.parseInt(process.argv[2] ?? '100', 10);

const queryTests = [
  {
    query: 'how do I safely let an AI agent make payments',
    expectedPage: 'public/docs/ai-agent-payment-safety.md',
  },
  {
    query: 'x402 payment safety',
    expectedPage: 'public/docs/x402-payment-safety.md',
  },
  {
    query: 'wallet.send safety check',
    expectedPage: 'public/docs/wallet-send-preflight.md',
  },
  {
    query: 'Stripe agent payment safety',
    expectedPage: 'public/docs/stripe-agent-payment-preflight.md',
  },
  {
    query: 'paid MCP tool payment safety',
    expectedPage: 'public/docs/paid-mcp-payment-safety.md',
  },
  {
    query: 'preflight check before shipping payment code',
    expectedPage: 'public/docs/before-shipping-payment-code.md',
  },
];

const discoverySurfaces = [
  'public/llms.txt',
  'public/cli.txt',
  'public/docs/ai-agent-payment-safety.md',
  'public/docs/x402-payment-safety.md',
  'public/docs/wallet-send-preflight.md',
  'public/docs/stripe-agent-payment-preflight.md',
  'public/docs/paid-mcp-payment-safety.md',
  'public/docs/paid-api-mcp-preflight.md',
  'public/docs/before-shipping-payment-code.md',
  'public/docs/adversarial-benchmark.md',
  'public/docs/hosted-proof.md',
  'public/docs/github-action.md',
  'public/docs/monarch-doctor-ci.md',
  'public/docs/grant-evidence.md',
  'packages/x402/README.md',
  'packages/x402-doctor/README.md',
  'README.md',
].filter((path) => existsSync(join(repoRoot, path)));

const fixtureShapes = [
  {
    id: 'x402-fetch',
    title: 'x402 X-PAYMENT fetch',
    docsEntry: 'public/docs/x402-payment-safety.md',
    unsafe: `
      export async function payForResource(payment) {
        return fetch(payment.resourceUrl, {
          headers: { 'X-PAYMENT': JSON.stringify({ payTo: payment.payTo, amount: payment.amount }) }
        });
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function payForResource(payment) {
        return checkBeforePayment(payment, () => fetch(payment.resourceUrl, {
          headers: { 'X-PAYMENT': JSON.stringify({ payTo: payment.payTo, amount: payment.amount }) }
        }));
      }
    `,
  },
  {
    id: 'wallet-send',
    title: 'wallet.send payment',
    docsEntry: 'public/docs/wallet-send-preflight.md',
    unsafe: `
      export async function sendFunds(wallet, payment) {
        return wallet.send(payment.payTo, payment.amount);
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function sendFunds(wallet, payment) {
        return checkBeforePayment(payment, () => wallet.send(payment.payTo, payment.amount));
      }
    `,
  },
  {
    id: 'stripe-intent',
    title: 'Stripe PaymentIntent',
    docsEntry: 'public/docs/stripe-agent-payment-preflight.md',
    unsafe: `
      export async function chargeAgent(stripe, payment) {
        return stripe.paymentIntents.create({
          amount: payment.amount,
          currency: 'usd',
          metadata: { agent: 'research-agent' }
        });
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function chargeAgent(stripe, payment) {
        return checkBeforePayment(payment, () => stripe.paymentIntents.create({
          amount: payment.amount,
          currency: 'usd',
          metadata: { agent: 'research-agent' }
        }));
      }
    `,
  },
  {
    id: 'paid-mcp-tool',
    title: 'paid MCP tool call',
    docsEntry: 'public/docs/paid-mcp-payment-safety.md',
    unsafe: `
      export async function callPaidMcpTool(tool, payment) {
        const paidMcpToolPrice = payment.amount;
        return fetch(tool.url, {
          method: 'POST',
          headers: { 'X-PAYMENT': JSON.stringify({ payTo: payment.payTo, price: paidMcpToolPrice }) }
        });
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function callPaidMcpTool(tool, payment) {
        const paidMcpToolPrice = payment.amount;
        return checkBeforePayment(payment, () => fetch(tool.url, {
          method: 'POST',
          headers: { 'X-PAYMENT': JSON.stringify({ payTo: payment.payTo, price: paidMcpToolPrice }) }
        }));
      }
    `,
  },
  {
    id: 'agent-wallet',
    title: 'agent wallet sendTransaction',
    docsEntry: 'public/docs/wallet-send-preflight.md',
    unsafe: `
      export async function agentWalletSpend(agenticWallet, payment) {
        return agenticWallet.sendTransaction({ to: payment.payTo, value: payment.amount });
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function agentWalletSpend(agenticWallet, payment) {
        return checkBeforePayment(payment, () => agenticWallet.sendTransaction({ to: payment.payTo, value: payment.amount }));
      }
    `,
  },
  {
    id: 'card-settlement',
    title: 'card and settlement payment',
    docsEntry: 'public/docs/grant-evidence.md',
    unsafe: `
      export async function checkoutWithCard(cardNetwork, payment) {
        return cardNetwork.cardCharge({
          virtualCard: payment.virtualCard,
          purchaseIntent: payment.intent,
          settlementAddress: payment.settlementAddress
        });
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function checkoutWithCard(cardNetwork, payment) {
        return checkBeforePayment(payment, () => cardNetwork.cardCharge({
          virtualCard: payment.virtualCard,
          purchaseIntent: payment.intent,
          settlementAddress: payment.settlementAddress
        }));
      }
    `,
  },
];

await main();

async function main() {
  await heartbeat('adoption_stress_test_started', 'in_progress', `Running query stress plus ${iterations} fresh temp usability iterations.`);
  const startedAt = new Date().toISOString();
  const packRoot = mkdtempSync(join(tmpdir(), 'monarch-adoption-pack-'));
  const proofServerState = { reports: [] };
  const proofServer = createProofServer(proofServerState);

  try {
    const queryResults = runQueryStress();
    const endpoint = await listen(proofServer);
    const x402Pack = packWorkspace('@monarch-shield/x402', packRoot);
    const doctorPack = packWorkspace('x402-doctor', packRoot);
    const usabilityResults = [];

    for (let index = 0; index < iterations; index += 1) {
      const fixture = fixtureShapes[index % fixtureShapes.length];
      const result = await runUsabilityIteration({ index, fixture, x402Pack, doctorPack, endpoint });
      usabilityResults.push(result);
      await heartbeat('adoption_stress_iteration', result.passed ? 'completed' : 'failed', `${index + 1}/${iterations} ${fixture.id}: ${result.passed ? 'passed' : result.failure}`);
      if (!result.passed) break;
    }

    const report = {
      tool: 'monarch-adoption-stress-test',
      status: queryResults.every((result) => result.passed) && usabilityResults.length === iterations && usabilityResults.every((result) => result.passed) ? 'passed' : 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      iterationsRequested: iterations,
      iterationsCompleted: usabilityResults.length,
      packageSource: 'local npm pack tarballs',
      proofMode: 'local hosted-proof-compatible receiver',
      queryResults,
      usabilitySummary: summarizeUsability(usabilityResults),
      usabilityResults,
    };

    writeArtifact('adoption-stress-test.json', `${JSON.stringify(report, null, 2)}\n`);
    writeArtifact('adoption-stress-test.md', renderMarkdown(report));
    await heartbeat('adoption_stress_test_completed', report.status, `Adoption stress test ${report.status}: ${queryResults.length} queries, ${usabilityResults.length}/${iterations} usability iterations.`);

    if (report.status !== 'passed') {
      logError('adoption-stress-test', report);
      process.exitCode = 1;
    }
  } catch (error) {
    const failure = {
      tool: 'monarch-adoption-stress-test',
      status: 'error',
      message: error.message,
      stack: error.stack,
      completedAt: new Date().toISOString(),
    };
    logError('adoption-stress-test', failure);
    await heartbeat('adoption_stress_test_error', 'failed', error.message);
    throw error;
  } finally {
    await new Promise((resolveServer) => proofServer.close(resolveServer));
    rmSync(packRoot, { recursive: true, force: true });
  }
}

function runQueryStress() {
  const documents = discoverySurfaces.map((path) => {
    const text = readFileSync(join(repoRoot, path), 'utf8');
    return { path, text, lowerText: text.toLowerCase() };
  });

  return queryTests.map((test) => {
    const ranked = rankDocuments(test.query, documents);
    const expected = documents.find((document) => document.path === test.expectedPage);
    const answeringPage = ranked[0]?.document ?? expected;
    const text = answeringPage?.lowerText ?? '';
    const expectedPageAppears = ranked.slice(0, 3).some((entry) => entry.document.path === test.expectedPage);
    const expectedPageReachable = expectedPageAppears || linksToExpectedPage(answeringPage?.text ?? '', test.expectedPage);
    const linksBenchmark = text.includes('adversarial-benchmark') || text.includes('benchmark:adversarial');
    const linksProof = text.includes('/proof') || text.includes('hosted-proof') || text.includes('projecthash');
    const linksSarif = text.includes('sarif');
    const clearCommand = /npx\s+(@monarch-shield\/x402|x402-doctor).*doctor|doctor --ci|checkbeforepayment/i.test(answeringPage?.text ?? '');
    const nextAction = /run|add|patch|fix|before go-live|before merge|copy/i.test(text) && clearCommand;
    const passed = Boolean(answeringPage)
      && text.includes('monarch')
      && expectedPageReachable
      && clearCommand
      && linksBenchmark
      && linksProof
      && linksSarif
      && nextAction;

    return {
      query: test.query,
      expectedPage: test.expectedPage,
      answeringPage: answeringPage?.path ?? null,
      topPages: ranked.slice(0, 3).map((entry) => ({ path: entry.document.path, score: entry.score })),
      monarchAppears: text.includes('monarch'),
      expectedPageAppears,
      expectedPageReachable,
      clearCommand,
      linksBenchmark,
      linksProof,
      linksSarif,
      nextAction,
      passed,
    };
  });
}

function linksToExpectedPage(text, expectedPage) {
  const stem = expectedPage
    .replace(/^public\//, '')
    .replace(/\.md$/, '');
  const html = `${stem}.html`;
  return text.includes(expectedPage)
    || text.includes(stem)
    || text.includes(html)
    || text.includes(`https://x402ms.ai/${stem}`)
    || text.includes(`https://x402ms.ai/${html}`);
}

function rankDocuments(query, documents) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  return documents
    .map((document) => {
      const normalized = normalize(document.text);
      const score = tokens.reduce((sum, token) => sum + countOccurrences(normalized, token), 0)
        + (document.lowerText.includes('npx @monarch-shield/x402 doctor') ? 3 : 0)
        + (document.lowerText.includes('adversarial-benchmark') ? 2 : 0)
        + (document.lowerText.includes('sarif') ? 2 : 0)
        + (document.lowerText.includes('hosted-proof') || document.lowerText.includes('/proof') ? 2 : 0);
      return { document, score };
    })
    .sort((a, b) => b.score - a.score);
}

async function runUsabilityIteration({ index, fixture, x402Pack, doctorPack, endpoint }) {
  const tempRoot = mkdtempSync(join(tmpdir(), `monarch-adoption-${fixture.id}-`));
  const projectRoot = join(tempRoot, 'payment-project');

  try {
    installPackedPackages(tempRoot, [x402Pack, doctorPack]);
    writeCase(projectRoot, fixture.unsafe);

    const unsafe = await runNpx(tempRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict']);
    const unsafePayload = parseJson(unsafe.stdout);
    if (unsafe.status !== 1 || unsafePayload?.status !== 'failed') {
      return failedIteration(index, fixture, 'unsafe_did_not_fail', { unsafe });
    }

    writeCase(projectRoot, fixture.patched);
    const commandName = index % 5 === 0 ? 'x402-doctor' : 'x402';
    const patchedArgs = commandName === 'x402-doctor'
      ? ['x402-doctor', '--root', projectRoot, '--ci', '--strict']
      : ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict'];
    const patched = await runNpx(tempRoot, patchedArgs);
    const patchedPayload = parseJson(patched.stdout);
    if (patched.status !== 0 || patchedPayload?.status !== 'passed') {
      return failedIteration(index, fixture, 'patched_did_not_pass', { patched });
    }

    const token = randomBytes(32).toString('hex');
    const projectHash = hashProjectToken(token);
    const proofReport = await runNpx(tempRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict', '--report'], {
      MONARCH_PROJECT_TOKEN: token,
      MONARCH_TELEMETRY_URL: `${endpoint}/doctor-run`,
    });
    const proofPayload = parseJson(proofReport.stdout);
    if (proofReport.status !== 0 || proofPayload?.status !== 'passed') {
      return failedIteration(index, fixture, 'proof_report_did_not_pass', { proofReport });
    }

    const proofResponse = await fetch(`${endpoint}/projects/${projectHash}/proof`);
    const proof = await proofResponse.json();
    const badgeResponse = await fetch(`${endpoint}/projects/${projectHash}/badge.svg`);
    const badge = await badgeResponse.text();
    const allowedRunKeys = ['receivedAt', 'status', 'ci', 'strict', 'applicable', 'rails', 'findingCount', 'sandboxPassed', 'hasUnprotectedPaymentFiles'];
    const latestRunKeys = Object.keys(proof.runs?.[0] ?? {});
    const unexpectedRunKeys = latestRunKeys.filter((key) => !allowedRunKeys.includes(key));
    const serializedProof = JSON.stringify(proof) + badge;

    if (!proofResponse.ok || !badgeResponse.ok || unexpectedRunKeys.length || serializedProof.includes(token) || !badge.includes('passing')) {
      return failedIteration(index, fixture, 'proof_or_badge_invalid', {
        proofStatus: proofResponse.status,
        badgeStatus: badgeResponse.status,
        latestRunKeys,
        unexpectedRunKeys,
        leakedToken: serializedProof.includes(token),
        badgeHasPassing: badge.includes('passing'),
      });
    }

    return {
      iteration: index + 1,
      fixture: fixture.id,
      title: fixture.title,
      docsEntry: fixture.docsEntry,
      install: 'passed',
      unsafeStatus: unsafePayload.status,
      patchedStatus: patchedPayload.status,
      proofStatus: proofPayload.status,
      projectHash,
      latestRunKeys,
      passed: true,
    };
  } finally {
    if (process.env.MONARCH_KEEP_ADOPTION_STRESS !== '1') {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

function failedIteration(index, fixture, failure, detail) {
  return {
    iteration: index + 1,
    fixture: fixture.id,
    title: fixture.title,
    docsEntry: fixture.docsEntry,
    failure,
    detail: sanitizeDetail(detail),
    passed: false,
  };
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

      const projectRoute = request.url.match(/^\/projects\/([a-f0-9]{24})\/(proof|badge\.svg)$/);
      if (request.method === 'GET' && projectRoute) {
        const projectHash = projectRoute[1];
        const scoped = state.reports.filter((report) => report.projectScope === true && report.projectHash === projectHash);
        const latest = scoped.at(-1);

        if (projectRoute[2] === 'badge.svg') {
          response.writeHead(200, { 'content-type': 'image/svg+xml' });
          response.end(`<svg xmlns="http://www.w3.org/2000/svg"><text>monarch proof: ${latest?.status === 'passed' ? 'passing' : 'attention'}</text></svg>`);
          return;
        }

        response.writeHead(scoped.length ? 200 : 404, { 'content-type': 'application/json' });
        response.end(JSON.stringify(scoped.length ? {
          projectHash,
          scope: 'token-backed-project-proof',
          counters: {
            totalRuns: scoped.length,
            passedRuns: scoped.filter((report) => report.status === 'passed').length,
            failedRuns: scoped.filter((report) => report.status !== 'passed').length,
            ciRuns: scoped.filter((report) => report.ci === true).length,
            localRuns: scoped.filter((report) => report.ci !== true).length,
          },
          runs: latest ? [safeRun(latest)] : [],
        } : { error: 'project_proof_not_found' }));
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

function summarizeUsability(results) {
  const byFixture = {};
  for (const result of results) {
    byFixture[result.fixture] ??= { runs: 0, passed: 0 };
    byFixture[result.fixture].runs += 1;
    if (result.passed) byFixture[result.fixture].passed += 1;
  }
  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    byFixture,
  };
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

function installPackedPackages(tempRoot, packages) {
  writeFileSync(join(tempRoot, 'package.json'), `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`);
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund', ...packages], {
    cwd: tempRoot,
    encoding: 'utf8',
  });
  assertSpawn(result, 'npm install packed Monarch packages');
}

function writeCase(projectRoot, content) {
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(join(projectRoot, 'pay.js'), trimTemplate(content));
}

function runNpx(cwd, args, env = {}) {
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

function listen(server) {
  return new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveListen(`http://127.0.0.1:${address.port}`);
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

function parseJson(value) {
  try {
    return JSON.parse(value);
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
  const queryRows = report.queryResults
    .map((result) => `| ${result.query} | ${result.answeringPage} | ${result.clearCommand ? 'yes' : 'no'} | ${result.linksBenchmark ? 'yes' : 'no'} | ${result.linksProof ? 'yes' : 'no'} | ${result.linksSarif ? 'yes' : 'no'} | ${result.passed ? 'PASS' : 'FAIL'} |`)
    .join('\n');
  const fixtureRows = Object.entries(report.usabilitySummary.byFixture)
    .map(([fixture, summary]) => `| ${fixture} | ${summary.passed}/${summary.runs} |`)
    .join('\n');

  return `# Adoption Stress Test Report

Status: ${report.status}

Iterations: ${report.iterationsCompleted}/${report.iterationsRequested}

This stress test checks whether high-intent payment-safety queries land on Monarch pages with runnable commands and proof links, then repeats fresh temp project installs across varied payment shapes. It proves adoption funnel usability only; it does not claim runtime policy enforcement, signed attestations, fraud prevention, settlement safety, or wallet ownership verification.

## Search Query Stress

| Query | Answering Page | Command | Benchmark | Proof | SARIF | Result |
| --- | --- | --- | --- | --- | --- | --- |
${queryRows}

## Third-Party Usability Stress

| Fixture | Passed Runs |
| --- | --- |
${fixtureRows}
`;
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9@/.-]+/g, ' ').trim();
}

function countOccurrences(text, token) {
  if (!token) return 0;
  return text.split(token).length - 1;
}

function hashProjectToken(token) {
  return createHash('sha256')
    .update(`monarch-project-token:v1:${token}`)
    .digest('hex')
    .slice(0, 24);
}

function sanitizeDetail(detail) {
  return JSON.parse(JSON.stringify(detail, (key, value) => {
    if (key.toLowerCase().includes('token')) return '[redacted]';
    if (typeof value === 'string' && value.length > 400) return `${value.slice(0, 400)}...`;
    return value;
  }));
}

function trimTemplate(value) {
  return `${value.trim()}\n`;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
