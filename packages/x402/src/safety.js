import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = new URL('..', import.meta.url);
const scenariosPath = fileURLToPath(new URL('../fixtures/sandbox-scenarios.json', import.meta.url));

export const scenarios = JSON.parse(readFileSync(scenariosPath, 'utf8'));

const scanExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.sol',
  '.rb',
  '.php',
  '.cs',
]);
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'artifacts', '.next', '.vite']);

export function evaluatePayment(input = {}) {
  const evidence = normalizeInput(input);

  if (!evidence.hasPrepaymentCheck && evidence.mode === 'preprod') {
    return decision('block', 'high', 'missing_prepayment_check', 'Monarch is not called before payment.', evidence);
  }

  if (evidence.payToWalletChanged) {
    return decision('block', 'high', 'pay_to_wallet_changed', 'The endpoint recently changed its payment destination.', evidence);
  }

  if (evidence.knownBadEndpoint) {
    return decision('block', 'high', 'known_risky_endpoint', 'The endpoint is marked as risky in local fixtures.', evidence);
  }

  if (evidence.deliveryReliability === 'failing') {
    return decision('caution', 'medium', 'failed_delivery', 'Recent paid calls did not consistently return usable responses.', evidence);
  }

  if (evidence.providerStatus === 'unknown_wrapper') {
    return decision('caution', 'medium', 'unknown_wrapper', 'The endpoint may be a wrapper and provider authorization is not visible.', evidence);
  }

  if (evidence.priceSanity === 'high') {
    return decision('caution', 'medium', 'price_anomaly', 'The requested amount looks high for this payment intent.', evidence);
  }

  if (evidence.verifiedAlternative) {
    return decision('route', 'medium', 'verified_alternative_available', 'A lower-risk verified alternative can satisfy the same intent.', evidence);
  }

  return decision('allow', 'low', 'verified_low_risk', 'Endpoint ownership, pay-to wallet, and delivery reliability are acceptable for sandbox use.', evidence);
}

export async function checkPayment(input = {}) {
  if (process.env.MONARCH_API_URL && process.env.MONARCH_API_KEY) {
    return checkHosted(input);
  }

  return evaluatePayment(input);
}

export async function checkBeforePayment(input = {}, pay) {
  const result = await checkPayment(input);

  if (result.decision === 'block') {
    const error = new Error(result.userMessage);
    error.monarch = result;
    throw error;
  }

  if (result.decision === 'caution') {
    return { requiresUserApproval: true, monarch: result };
  }

  if (result.decision === 'route' && result.verifiedAlternative && typeof pay === 'function') {
    return pay({ ...input, resourceUrl: result.verifiedAlternative, monarch: result });
  }

  if (typeof pay === 'function') {
    return pay({ ...input, monarch: result });
  }

  return result;
}

export function runSandbox() {
  return scenarios.map((scenario) => {
    const result = evaluatePayment({ mode: 'sandbox', ...scenario.input });
    return {
      id: scenario.id,
      title: scenario.title,
      expected: scenario.expectedDecision,
      actual: result.decision,
      passed: result.decision === scenario.expectedDecision,
      reason: result.reason,
    };
  });
}

export function scanProject(root = process.cwd()) {
  const files = collectFiles(root);
  const findings = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const rel = relative(root, file);

    addFinding(findings, rel, content, /402 Payment Required|X-PAYMENT|x402|paymentRequired|facilitator/i, 'x402 payment handling found');
    addFinding(findings, rel, content, /\bpayTo\b|\brecipient\b|\bmerchantWallet\b|settlementAddress|walletAddress|destinationWallet/i, 'pay-to wallet handling found');
    addFinding(findings, rel, content, /paid MCP|paid tool|mcp.*payment|payment.*mcp|tool.*price|price.*tool/i, 'paid MCP or tool payment reference found');
    addFinding(findings, rel, content, /agent.*spend|spend.*agent|autonomous.*payment|wallet\.send|sendTransaction|transferUSDC|stablecoin.*payment/i, 'agent spend payment reference found');
    addFinding(findings, rel, content, /checkBeforePayment|checkPayment|safePayX402|check-payment|@monarch-shield\/x402/i, 'Monarch pre-payment check reference found');
  }

  const hasPaymentFlow = findings.some((finding) => finding.kind !== 'monarch_check');
  const hasMonarchCheck = findings.some((finding) => finding.kind === 'monarch_check');
  const unprotectedPaymentFiles = findUnprotectedPaymentFiles(findings);

  return {
    root,
    hasPaymentFlow,
    hasMonarchCheck,
    hasUnprotectedPaymentFiles: unprotectedPaymentFiles.length > 0,
    unprotectedPaymentFiles,
    ready: !hasPaymentFlow || (hasMonarchCheck && unprotectedPaymentFiles.length === 0),
    findings,
    recommendation: recommendationForScan(hasPaymentFlow, hasMonarchCheck, unprotectedPaymentFiles),
  };
}

export function validatePreprod(root = process.cwd()) {
  const scan = scanProject(root);
  const sandbox = runSandbox();
  const sandboxPassed = sandbox.every((result) => result.passed);

  const checks = [
    {
      id: 'payment_flow_scanned',
      passed: scan.hasPaymentFlow,
      message: scan.hasPaymentFlow ? 'Payment flow detected.' : 'No x402 or agent-payment flow detected.',
    },
    {
      id: 'monarch_before_payment',
      passed: scan.hasMonarchCheck && !scan.hasUnprotectedPaymentFiles,
      message: scan.hasMonarchCheck && !scan.hasUnprotectedPaymentFiles
        ? 'Monarch check reference detected in payment files.'
        : 'One or more payment files lack a Monarch check before payment.',
    },
    {
      id: 'sandbox_passed',
      passed: sandboxPassed,
      message: sandboxPassed ? 'Sandbox scenarios passed.' : 'One or more sandbox scenarios failed.',
    },
  ];

  return {
    applicable: scan.hasPaymentFlow,
    ready: !scan.hasPaymentFlow || checks.every((check) => check.passed),
    checks,
    scan,
    sandbox,
  };
}

function normalizeInput(input) {
  return {
    mode: input.mode ?? 'runtime',
    resourceUrl: input.resourceUrl ?? input.url ?? '',
    payTo: input.payTo ?? '',
    amount: input.amount ?? '',
    asset: input.asset ?? 'USDC',
    network: input.network ?? 'base',
    intent: input.intent ?? '',
    hasPrepaymentCheck: input.hasPrepaymentCheck ?? true,
    payToWalletChanged: Boolean(input.payToWalletChanged),
    knownBadEndpoint: Boolean(input.knownBadEndpoint),
    providerStatus: input.providerStatus ?? 'verified',
    deliveryReliability: input.deliveryReliability ?? 'passing',
    priceSanity: input.priceSanity ?? 'normal',
    verifiedAlternative: input.verifiedAlternative ?? null,
  };
}

function decision(type, risk, status, reason, evidence) {
  return {
    decision: type,
    risk,
    status,
    reason,
    suggestedAction: suggestedAction(type),
    userMessage: userMessage(type, reason),
    verifiedAlternative: evidence.verifiedAlternative,
    checks: {
      domainOwnership: evidence.providerStatus === 'verified' ? 'verified' : 'unknown',
      payToWallet: evidence.payTo ? 'present' : 'missing',
      payToWalletChanged: evidence.payToWalletChanged,
      deliveryReliability: evidence.deliveryReliability,
      provenance: evidence.providerStatus,
      priceSanity: evidence.priceSanity,
    },
  };
}

function suggestedAction(type) {
  if (type === 'allow') return 'continue_with_payment';
  if (type === 'caution') return 'ask_user_before_payment';
  if (type === 'block') return 'do_not_pay';
  if (type === 'route') return 'use_verified_alternative';
  return 'review';
}

function userMessage(type, reason) {
  if (type === 'allow') return `Monarch allowed this payment. ${reason}`;
  if (type === 'caution') return `Monarch recommends caution. ${reason}`;
  if (type === 'block') return `Monarch blocked this payment. ${reason}`;
  if (type === 'route') return `Monarch recommends routing to a verified alternative. ${reason}`;
  return reason;
}

async function checkHosted(input) {
  const response = await fetch(`${process.env.MONARCH_API_URL}/check-payment`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.MONARCH_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Monarch hosted check failed with ${response.status}`);
  }

  return response.json();
}

function collectFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (ignoredDirs.has(entry)) continue;

      const path = join(dir, entry);
      const stat = statSync(path);

      if (stat.isDirectory()) {
        walk(path);
      } else if (scanExtensions.has(extname(path))) {
        files.push(path);
      }
    }
  }

  walk(root);
  return files;
}

function addFinding(findings, file, content, pattern, message) {
  if (!pattern.test(content)) return;

  findings.push({
    kind: message.includes('Monarch') ? 'monarch_check' : 'payment_flow',
    file,
    message,
  });
}

function findUnprotectedPaymentFiles(findings) {
  const byFile = new Map();

  for (const finding of findings) {
    if (!byFile.has(finding.file)) {
      byFile.set(finding.file, { hasPaymentFlow: false, hasMonarchCheck: false });
    }

    const state = byFile.get(finding.file);
    if (finding.kind === 'monarch_check') {
      state.hasMonarchCheck = true;
    } else {
      state.hasPaymentFlow = true;
    }
  }

  return [...byFile.entries()]
    .filter(([, state]) => state.hasPaymentFlow && !state.hasMonarchCheck)
    .map(([file]) => file);
}

function recommendationForScan(hasPaymentFlow, hasMonarchCheck, unprotectedPaymentFiles) {
  if (!hasPaymentFlow) return 'No payment flow detected.';
  if (!hasMonarchCheck) {
    return 'Run `npx @monarch-shield/x402 sandbox`, then add `checkBeforePayment` before signing or sending funds.';
  }
  if (unprotectedPaymentFiles.length) {
    return `Add \`checkBeforePayment\` inside these payment files: ${unprotectedPaymentFiles.join(', ')}`;
  }
  return 'No missing Monarch pre-payment check detected.';
}

export function packagePath(path) {
  return fileURLToPath(new URL(path, packageRoot));
}
