#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluatePayment, packagePath, runSandbox, scanProject, validatePreprod } from './index.js';

const packageJson = JSON.parse(readFileSync(packagePath('package.json'), 'utf8'));

const command = process.argv[2] ?? 'help';
const args = parseArgs(process.argv.slice(3));

const commands = {
  help,
  doctor,
  init,
  scan,
  sandbox,
  preprod,
  check,
};

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  help();
  process.exit(1);
}

try {
  await commands[command](args);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function help() {
  console.log(`Monarch Shield Agent Payment Safety Kit

Usage:
  npx @monarch-shield/x402 doctor [--root .] [--ci] [--json] [--strict] [--report]
  npx @monarch-shield/x402 init [--template x402-client]
  npx @monarch-shield/x402 scan [--root .]
  npx @monarch-shield/x402 sandbox
  npx @monarch-shield/x402 preprod [--root .]
  npx @monarch-shield/x402 check --resource-url URL --pay-to WALLET --amount AMOUNT --asset USDC --network base --intent "..."

Core rule:
  Test before live. Check before pay.`);
}

async function doctor(options) {
  const root = rootOption(options);
  const result = validatePreprod(root);
  const ciMode = options.ci === 'true' || options.json === 'true';
  const strictMode = options.strict === 'true';
  const status = doctorStatus(result, { root, strictMode });

  if (ciMode) {
    printDoctorJson(result, { root, strictMode, status });
    await reportDoctorRun(result, { root, status, strictMode, ciMode, reportMode: reportMode(options) });
    if (status === 'failed' || status === 'failed_no_payment_flow') {
      process.exitCode = 1;
    }
    return;
  }

  console.log('Monarch Doctor');
  console.log('Preflight safety check for money-moving agent code.');
  console.log('');

  if (!result.scan.hasPaymentFlow) {
    console.log('Status: NO PAYMENT FLOW DETECTED');
    console.log('');
    console.log('Monarch did not find x402, paid MCP, pay-to wallet, or agent-payment code in this project.');
    console.log('If this project will move money, add the payment flow and rerun Doctor before go-live.');
    if (strictMode) {
      process.exitCode = 1;
    }
    await reportDoctorRun(result, { root, status, strictMode, ciMode, reportMode: reportMode(options) });
    return;
  }

  if (result.ready) {
    console.log('Status: PASSED');
    console.log('');
    console.log('Detected:');
    printFindings(result.scan.findings);
    console.log('');
    console.log('Checks:');
    printChecks(result.checks);
    console.log('');
    console.log('Result: Ready for controlled pre-production testing, pending live limits, logging, and hosted-provider configuration.');
    await reportDoctorRun(result, { root, status, strictMode, ciMode, reportMode: reportMode(options) });
    return;
  }

  console.log('Status: FAILED');
  console.log('');
  console.log('Detected:');
  printFindings(result.scan.findings);
  console.log('');
  console.log('Issues:');
  printChecks(result.checks.filter((check) => !check.passed));
  console.log('');
  console.log('Required fix:');

  if (!result.scan.hasMonarchCheck) {
    console.log('- Add `checkBeforePayment` before signing or sending funds.');
  }

  if (result.scan.unprotectedPaymentFiles?.length) {
    for (const file of result.scan.unprotectedPaymentFiles) {
      console.log(`- Patch ${file} so Monarch runs before payment execution.`);
    }
  }

  if (!result.sandbox.every((scenario) => scenario.passed)) {
    console.log('- Fix failing sandbox scenarios.');
  }

  console.log('');
  console.log('Suggested command:');
  console.log('npx @monarch-shield/x402 init --template x402-client');
  await reportDoctorRun(result, { root, status, strictMode, ciMode, reportMode: reportMode(options) });
  process.exitCode = 1;
}

function init(options) {
  const template = options.template ?? 'x402-client';
  const source = packagePath(`templates/${template}`);
  const target = join(process.cwd(), 'monarch');

  if (!existsSync(source)) {
    throw new Error(`Template not found: ${template}`);
  }

  copyDir(source, target);
  writeFileSync(
    join(target, 'USER_NOTICE.txt'),
    'I’m adding Monarch Shield because this project can move money through x402 or agent-to-agent payments. I’m going to run it in sandbox first so we can test unsafe payment scenarios without real funds. If the checks pass, we can keep Monarch in the pre-production and production path as the trust check before live payments.\n',
  );

  console.log(`Monarch template installed: ${template}`);
  console.log(`Created: ${relative(process.cwd(), target)}`);
  console.log('This scaffolds snippets under ./monarch. Patch the reported payment file before go-live.');
  console.log('Next: npx @monarch-shield/x402 doctor');
}

function scan(options) {
  const result = scanProject(rootOption(options));

  console.log('Monarch scan');
  console.log(`Payment flow detected: ${yesNo(result.hasPaymentFlow)}`);
  console.log(`Monarch check detected: ${yesNo(result.hasMonarchCheck)}`);
  console.log('');

  if (result.findings.length) {
    for (const finding of result.findings) {
      console.log(`- ${finding.file}: ${finding.message}`);
    }
    console.log('');
  }

  console.log(`Recommendation: ${result.recommendation}`);

  if (result.hasPaymentFlow && !result.hasMonarchCheck) {
    process.exitCode = 1;
  }
}

function sandbox() {
  const results = runSandbox();

  console.log('Monarch sandbox');
  for (const result of results) {
    const marker = result.passed ? 'PASS' : 'FAIL';
    console.log(`- ${marker} ${result.id}: expected ${result.expected}, got ${result.actual}`);
  }

  if (!results.every((result) => result.passed)) {
    process.exitCode = 1;
  }
}

function preprod(options) {
  const result = validatePreprod(rootOption(options));

  console.log('Monarch preprod');

  if (!result.applicable) {
    console.log('- N/A payment_flow_scanned: No x402 or agent-payment flow detected.');
    console.log('');
    console.log('No money-moving payment flow detected. Add the payment flow and rerun Doctor before go-live.');
    return;
  }

  for (const check of result.checks) {
    console.log(`- ${check.passed ? 'PASS' : 'FAIL'} ${check.id}: ${check.message}`);
  }

  if (result.ready) {
    console.log('');
    console.log('Monarch local checks passed. This is ready for controlled pre-production testing, pending your live limits, logging, and hosted-provider configuration.');
  } else {
    console.log('');
    console.log('Not ready for pre-production. Fix failed checks before live funds move.');
    process.exitCode = 1;
  }
}

function check(options) {
  const required = ['resource-url', 'pay-to', 'amount', 'asset', 'network', 'intent'];
  for (const key of required) {
    if (!options[key]) throw new Error(`Missing required option: --${key}`);
  }

  const result = evaluatePayment({
    resourceUrl: options['resource-url'],
    payTo: options['pay-to'],
    amount: options.amount,
    asset: options.asset,
    network: options.network,
    intent: options.intent,
    providerStatus: options['provider-status'],
    payToWalletChanged: options['pay-to-wallet-changed'] === 'true',
    deliveryReliability: options['delivery-reliability'],
    verifiedAlternative: options['verified-alternative'],
    priceSanity: options['price-sanity'],
  });

  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(raw) {
  const parsed = {};

  for (let index = 0; index < raw.length; index += 1) {
    const item = raw[index];
    if (!item.startsWith('--')) continue;

    const [key, inlineValue] = item.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = raw[index + 1];

    if (!next || next.startsWith('--')) {
      parsed[key] = 'true';
    } else {
      parsed[key] = next;
      index += 1;
    }
  }

  return parsed;
}

function rootOption(options) {
  if (!options.root) return process.cwd();
  if (options.root === 'true') throw new Error('Missing value for --root');
  return options.root;
}

function copyDir(source, target) {
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const src = join(source, entry);
    const dest = join(target, entry);
    const stat = statSync(src);

    if (stat.isDirectory()) {
      copyDir(src, dest);
    } else {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    }
  }
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}

function printFindings(findings) {
  if (!findings.length) {
    console.log('- No matching files found.');
    return;
  }

  for (const finding of findings) {
    console.log(`- ${finding.file}: ${finding.message}`);
  }
}

function printChecks(checks) {
  if (!checks.length) {
    console.log('- No failed checks.');
    return;
  }

  for (const check of checks) {
    console.log(`- ${check.passed ? 'PASS' : 'FAIL'} ${check.id}: ${check.message}`);
  }
}

function printDoctorJson(result, options) {
  const status = options.status ?? doctorStatus(result, options);
  const payload = {
    tool: 'monarch-doctor',
    status,
    ready: status === 'no_payment_flow_detected' ? true : status === 'failed_no_payment_flow' ? false : result.ready,
    applicable: result.applicable,
    root: options.root,
    strict: options.strictMode,
    summary: doctorSummary(status),
    checks: status === 'no_payment_flow_detected' ? [] : result.checks,
    unprotectedPaymentFiles: result.scan.unprotectedPaymentFiles,
    findings: result.scan.findings,
    sandbox: result.sandbox,
    recommendation: result.scan.recommendation,
  };

  console.log(JSON.stringify(payload, null, 2));
}

function doctorStatus(result, options) {
  if (!result.scan.hasPaymentFlow) {
    return options.strictMode ? 'failed_no_payment_flow' : 'no_payment_flow_detected';
  }

  return result.ready ? 'passed' : 'failed';
}

function doctorSummary(status) {
  if (status === 'passed') {
    return 'Money-moving code has a Monarch check in payment files and sandbox scenarios passed.';
  }

  if (status === 'failed') {
    return 'Money-moving code is not ready. Patch the reported payment files before go-live.';
  }

  if (status === 'failed_no_payment_flow') {
    return 'Strict mode expected money-moving code, but Doctor found no x402, paid MCP, pay-to wallet, or agent-payment flow.';
  }

  return 'No money-moving agent payment flow detected.';
}

function reportMode(options) {
  return options.report === 'true' || options.telemetry === 'true' || process.env.MONARCH_TELEMETRY === '1';
}

async function reportDoctorRun(result, options) {
  if (!options.reportMode) return;

  const endpoint = process.env.MONARCH_TELEMETRY_URL ?? 'https://x402ms.ai/api/doctor-run';
  const payload = {
    event: 'doctor_run',
    tool: 'monarch-doctor',
    version: packageJson.version,
    status: options.status,
    ci: options.ciMode,
    strict: options.strictMode,
    applicable: result.applicable,
    hasPaymentFlow: result.scan.hasPaymentFlow,
    hasUnprotectedPaymentFiles: result.scan.hasUnprotectedPaymentFiles,
    findingCount: result.scan.findings.length,
    sandboxPassed: result.sandbox.every((scenario) => scenario.passed),
    projectHash: hashProject(options.root),
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok && process.env.MONARCH_TELEMETRY_DEBUG === '1') {
      console.error(`Monarch telemetry failed with ${response.status}`);
    }
  } catch (error) {
    if (process.env.MONARCH_TELEMETRY_DEBUG === '1') {
      console.error(`Monarch telemetry failed: ${error.message}`);
    }
  }
}

function hashProject(root) {
  return createHash('sha256')
    .update(`${root}:${packageJson.name}`)
    .digest('hex')
    .slice(0, 24);
}
