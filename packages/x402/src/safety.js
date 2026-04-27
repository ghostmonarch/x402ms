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
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'artifacts', '.next', '.vite', '.wrangler', '.cache']);
const ignoredScanPaths = [
  'examples/base-x402-proof-pack/unsafe/',
  'examples/coinbase-agentkit-proof-pack/unsafe/',
  'examples/virtuals-acp-proof-pack/unsafe/',
  'examples/google-ap2-a2a-x402-proof-pack/unsafe/',
  'examples/stripe-bridge-stablecoin-proof-pack/unsafe/',
  'examples/card-network-agent-pay-proof-pack/unsafe/',
  'packages/x402/src/cli.js',
  'packages/x402/src/safety.js',
  'packages/x402/examples/',
  'packages/x402/templates/',
  'packages/x402/test/',
  'scripts/generate-doc-html.js',
  'scripts/monte-carlo-agent-discovery.js',
  'scripts/record-base-x402-proof-pack.js',
  'scripts/record-doctor-demo.js',
  'workers/doctor-run/',
];
const paymentSinkPattern = /fetch\s*\(|wallet\.send\s*\(|sendTransaction\s*\(|paymentIntents\.create\s*\(|checkout\.sessions\.create\s*\(|charges\.create\s*\(|transfers?\.create\s*\(|payouts?\.create\s*\(|transferUSDC\s*\(|usdcTransfer\s*\(|commerce\.charges\.create\s*\(|createJobFromOffering\s*\(|fundJobEscrow\s*\(|submitPaymentMandate\s*\(|bridgeStablecoin\s*\(|\.checkout\s*\(|cardCharge\s*\(|achDebit\s*\(|wireTransfer\s*\(|bankTransfer\s*\(|rtpPayment\s*\(|fedNow\s*\(|pixPayment\s*\(|upiPayment\s*\(/i;

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
    const commentFreeContent = stripComments(content);
    const codeContent = stripStringLiterals(commentFreeContent);

    if (isIgnoredScanPath(rel)) continue;

    if (hasPaymentExecutionSignal(codeContent)) {
      addFinding(findings, rel, commentFreeContent, /402 Payment Required|X-PAYMENT/i, 'x402 payment handling found', ['x402']);
    }
    addFinding(findings, rel, codeContent, /x402|paymentRequired|facilitator|X_A2A_Extensions/i, 'x402 payment handling found', ['x402']);
    addFinding(findings, rel, codeContent, /\bpayTo\b|\brecipient\b|\bmerchantWallet\b|settlementAddress|walletAddress|destinationWallet/i, 'pay-to wallet handling found', ['wallet']);
    addFinding(findings, rel, codeContent, /paid MCP|paid tool|mcp.*payment|payment.*mcp|tool.*price|price.*tool/i, 'paid MCP or tool payment reference found', ['paid_mcp']);
    addFinding(findings, rel, codeContent, /agent.*spend|spend.*agent|autonomous.*payment|wallet\.send|sendTransaction/i, 'agent spend payment reference found', ['wallet']);
    addFinding(findings, rel, codeContent, /stablecoin.*payment|circle|bridge|rain|baseUSDC|transferUSDC|usdcTransfer|AssetToken\.usdc|USDC|chainId.*8453|baseSepolia/i, 'stablecoin payment handling found', ['stablecoin']);
    addFinding(findings, rel, codeContent, /stripe|paymentIntents\.create|checkout\.sessions\.create|shared_payment_granted_token|sharedPaymentGrantedToken|agentic checkout/i, 'Stripe payment processor handling found', ['stripe']);
    addFinding(findings, rel, codeContent, /coinbase|agentkit|agenticWallet|agentic wallet|commerce\.charges\.create/i, 'Coinbase AgentKit or Agentic Wallet payment handling found', ['agentkit', 'wallet']);
    addFinding(findings, rel, codeContent, /virtuals|virtualsAcp|acpClient|createJobFromOffering|fundJobEscrow|Agent Commerce Protocol|job\.funded|job\.completed/i, 'Virtuals ACP payment handling found', ['stablecoin', 'wallet']);
    addFinding(findings, rel, codeContent, /Agent Payments Protocol|AP2|CartMandate|PaymentMandate|A2A.*payment|payment.*A2A|x402\.payment|X_A2A_Extensions/i, 'Google AP2 or A2A x402 payment handling found', ['x402', 'paid_mcp']);
    addFinding(findings, rel, codeContent, /Agentic Commerce Protocol|CompleteCheckoutRequest|PaymentData|payment_provider|agentic_checkout|BridgeClient|bridgeStablecoin/i, 'Agentic commerce or Bridge stablecoin payment handling found', ['stripe', 'stablecoin']);
    addFinding(findings, rel, codeContent, /paypal|adyen|square|braintree|checkoutCom|worldpay|mollie|klarna/i, 'payment processor handling found', ['card']);
    addFinding(findings, rel, codeContent, /visa|mastercard|cardPayment|virtualCard|cardCharge|applePay|googlePay|Agent Pay|agentPay|agentic token|MDES|DSRP|DTVC|Digital Commerce Solution|Intelligent Commerce|Visa Token Service|Visa Payment Passkey|tokenized payment credential|purchaseIntent/i, 'card payment rail handling found', ['card']);
    addFinding(findings, rel, codeContent, /achDebit|wireTransfer|bankTransfer|rtpPayment|fedNow|openBanking|plaid|dwolla|zelle|sepa|payouts?\.create|transfers?\.create|wise|revolut|yapily|tink|finicity/i, 'bank payment rail handling found', ['bank']);
    addFinding(findings, rel, codeContent, /pixPayment|upiPayment|qris|promptPay|payNow|duitNow|vietQR|spei|ideal|blik|m-pesa|mpesa/i, 'regional payment rail handling found', ['regional_rail', 'bank']);
    if (hasEffectiveMonarchGuard(codeContent)) {
      findings.push({
        kind: 'monarch_check',
        file: rel,
        message: 'Monarch pre-payment guard detected before payment execution',
        rails: [],
      });
    }
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
      message: scan.hasPaymentFlow ? 'Payment flow detected.' : 'No x402, processor, card, bank, wallet, or agent-payment flow detected.',
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

function isIgnoredScanPath(file) {
  const normalized = file.replaceAll('\\', '/');
  return ignoredScanPaths.some((ignoredPath) => normalized.startsWith(ignoredPath));
}

function stripStringLiterals(content) {
  // Keep scanner runtime predictable: avoid one giant regex over source files that may contain regex literals.
  let output = '';
  let quote = null;
  let escaped = false;

  for (const char of content) {
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }

      output += char === '\n' ? '\n' : ' ';
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      output += ' ';
      continue;
    }

    output += char;
  }

  return output;
}

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/^\s*#.*$/gm, '');
}

function hasPaymentExecutionSignal(content) {
  return /fetch\s*\(|headers\s*:|wallet\.send|sendTransaction|paymentIntents\.create|checkout\.sessions\.create|charges\.create|transfers?\.create|payouts?\.create/i.test(content);
}

function hasEffectiveMonarchGuard(content) {
  const sinkIndexes = findMatchIndexes(content, paymentSinkPattern);
  if (sinkIndexes.length === 0) return false;

  const guardedRanges = findGuardedPaymentRanges(content);
  if (guardedRanges.length === 0) return false;

  return sinkIndexes.every((sinkIndex) => guardedRanges.some(([start, end]) => sinkIndex >= start && sinkIndex <= end));
}

function findGuardedPaymentRanges(content) {
  const ranges = [];
  const guardPattern = /checkBeforePayment\s*\(/ig;
  let match;

  while ((match = guardPattern.exec(content)) !== null) {
    const openParenIndex = content.indexOf('(', match.index);
    if (openParenIndex === -1) continue;

    const closeParenIndex = findMatchingDelimiter(content, openParenIndex, '(', ')');
    if (closeParenIndex === -1) continue;

    const guardedContent = content.slice(openParenIndex + 1, closeParenIndex);
    if (paymentSinkPattern.test(guardedContent)) {
      ranges.push([openParenIndex, closeParenIndex]);
    }

    for (const callbackName of findGuardedCallbackNames(guardedContent)) {
      const callbackRange = findFunctionBodyRange(content, callbackName);
      if (callbackRange && paymentSinkPattern.test(content.slice(callbackRange[0], callbackRange[1]))) {
        ranges.push(callbackRange);
      }
    }
  }

  return ranges;
}

function findGuardedCallbackNames(content) {
  const names = [];
  const callbackPattern = /,\s*([A-Za-z_$][\w$]*)\s*(?:,|$)/g;
  let match;

  while ((match = callbackPattern.exec(content)) !== null) {
    names.push(match[1]);
  }

  return names;
}

function findFunctionBodyRange(content, name) {
  const declarationPattern = new RegExp(`(?:async\\s+)?function\\s+${escapeRegExp(name)}\\s*\\(`);
  const declaration = declarationPattern.exec(content);
  if (!declaration) return null;

  const openParenIndex = content.indexOf('(', declaration.index);
  if (openParenIndex === -1) return null;

  const closeParenIndex = findMatchingDelimiter(content, openParenIndex, '(', ')');
  if (closeParenIndex === -1) return null;

  const openBraceIndex = content.indexOf('{', closeParenIndex);
  if (openBraceIndex === -1) return null;

  const closeBraceIndex = findMatchingDelimiter(content, openBraceIndex, '{', '}');
  if (closeBraceIndex === -1) return null;

  return [openBraceIndex, closeBraceIndex];
}

function findMatchIndexes(content, pattern) {
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('i') ? 'ig' : 'g');
  const indexes = [];
  let match;

  while ((match = globalPattern.exec(content)) !== null) {
    if (!isLikelyDeclaration(content, match.index)) {
      indexes.push(match.index);
    }
  }

  return indexes;
}

function isLikelyDeclaration(content, matchIndex) {
  const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
  const prefix = content.slice(lineStart, matchIndex);
  return /\b(?:async|function)\s+$/.test(prefix);
}

function findMatchingDelimiter(content, openIndex, openChar, closeChar) {
  let depth = 0;

  for (let index = openIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === openChar) depth += 1;
    if (char === closeChar) depth -= 1;
    if (depth === 0) return index;
  }

  return -1;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  return validateHostedResponse(await response.json());
}

function validateHostedResponse(value) {
  const decisions = new Set(['allow', 'caution', 'block', 'route']);
  const risks = new Set(['low', 'medium', 'high', 'unknown']);

  if (!value || typeof value !== 'object') {
    throw new Error('Monarch hosted check returned an invalid response');
  }

  if (!decisions.has(value.decision) || !risks.has(value.risk)) {
    throw new Error('Monarch hosted check returned an invalid decision');
  }

  for (const field of ['status', 'reason', 'suggestedAction', 'userMessage']) {
    if (typeof value[field] !== 'string' || value[field].length === 0) {
      throw new Error(`Monarch hosted check returned an invalid ${field}`);
    }
  }

  if (!value.checks || typeof value.checks !== 'object') {
    throw new Error('Monarch hosted check returned invalid checks');
  }

  return value;
}

function collectFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (ignoredDirs.has(entry)) continue;

      const path = join(dir, entry);
      const rel = relative(root, path).replaceAll('\\', '/');
      const stat = statSync(path);

      if (stat.isDirectory()) {
        if (isIgnoredScanPath(`${rel}/`)) continue;
        walk(path);
      } else if (!isIgnoredScanPath(rel) && scanExtensions.has(extname(path)) && !path.endsWith('.d.ts')) {
        files.push(path);
      }
    }
  }

  walk(root);
  return files;
}

function addFinding(findings, file, content, pattern, message, rails = []) {
  if (!pattern.test(content)) return;

  findings.push({
    kind: message.includes('Monarch') ? 'monarch_check' : 'payment_flow',
    file,
    message,
    rails,
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
