#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const artifactsDir = join(repoRoot, 'artifacts');
const backupsDir = join(artifactsDir, 'backups');
const errorsDir = join(artifactsDir, 'errors');
const statusPath = join(artifactsDir, 'holodeck_status.jsonl');
const requestedQueryCount = Number.parseInt(process.argv[2] ?? '1000', 10);

const baseQueries = [
  {
    category: 'AI agent payments',
    expectedPage: 'public/docs/ai-agent-payment-safety.md',
    fixture: 'x402-fetch',
    variants: [
      'how do I safely let an AI agent make payments',
      'how can an AI agent pay safely before production',
      'safe AI agent payments preflight check',
      'AI agent payment safety npm package',
      'before I let my agent spend money',
      'agent-controlled payment safety gate',
      'autonomous AI payments safety check',
      'how to verify AI-generated payment code is safe',
      'AI agent can move money safely',
      'review AI agent money movement code',
      'what should an agent run before paying',
      'required safety check for autonomous payments',
    ],
  },
  {
    category: 'Before shipping payment code',
    expectedPage: 'public/docs/before-shipping-payment-code.md',
    fixture: 'wallet-send',
    variants: [
      'preflight check before shipping payment code',
      'before shipping AI-generated payment code',
      'payment code go-live safety check',
      'CI gate before payment code merges',
      'pre-production check for money-moving code',
      'payment definition of done for agents',
      'agent payment code review checklist',
      'unsafe payment code before merge',
      'how to review money-moving code before deploy',
      'preflight for code that can charge users',
      'required gate before payment code ships',
      'agent wrote payment code what should I run',
    ],
  },
  {
    category: 'x402',
    expectedPage: 'public/docs/x402-payment-safety.md',
    fixture: 'x402-fetch',
    variants: [
      'x402 payment safety',
      'x402 preflight check',
      'x402 doctor before production',
      'HTTP 402 Payment Required safety',
      'X-PAYMENT header safety check',
      'Base x402 payment safety',
      'x402 client safety before go-live',
      'x402 facilitator payment preflight',
      'safe x402 payment implementation for agents',
      'how to catch unsafe X-PAYMENT code',
      'x402 CI gate before merge',
      'review x402 payment code for unsafe sends',
    ],
  },
  {
    category: 'wallet.send',
    expectedPage: 'public/docs/wallet-send-preflight.md',
    fixture: 'wallet-send',
    variants: [
      'wallet.send safety check',
      'sendTransaction preflight safety',
      'wallet transfer before payment check',
      'prevent unsafe wallet.send from AI agent',
      'pay-to wallet safety preflight',
      'agent wallet transfer safety check',
      'transferUSDC safety before send',
      'hot wallet agent safety gate',
      'wallet.send CI gate before deploy',
      'review wallet.send code before production',
      'agent code calls wallet.send what safety check',
      'block unsafe wallet transfer code before merge',
    ],
  },
  {
    category: 'Stripe',
    expectedPage: 'public/docs/stripe-agent-payment-preflight.md',
    fixture: 'stripe-intent',
    variants: [
      'Stripe agent payment safety',
      'Stripe PaymentIntent agent safety',
      'Stripe Checkout AI agent preflight',
      'agent creates Stripe charge safety',
      'Stripe billing meter agent safety',
      'Stripe autonomous payment CI gate',
      'Stripe payment code scanning for agents',
      'before AI agent creates Stripe PaymentIntent',
      'review Stripe agent charge code before deploy',
      'Stripe payment code CI gate before merge',
      'AI agent can charge customers with Stripe safely',
      'preflight before agent creates checkout session',
    ],
  },
  {
    category: 'paid MCP',
    expectedPage: 'public/docs/paid-mcp-payment-safety.md',
    fixture: 'paid-mcp-tool',
    variants: [
      'paid MCP tool payment safety',
      'paid MCP server safety check',
      'MCP monetization payment preflight',
      'charge for MCP tool safely',
      'AI agent paid tool call safety',
      'paid API MCP payment guard',
      'MCP tool price payment safety',
      'preflight for paid MCP tool calls',
      'review paid MCP tool before charging agents',
      'paid MCP CI safety gate',
      'agent pays MCP server what preflight check',
      'safe monetized MCP tool payment code',
    ],
  },
  {
    category: 'agent wallet',
    expectedPage: 'public/docs/wallet-send-preflight.md',
    fixture: 'agent-wallet',
    variants: [
      'agent wallet spend safety',
      'Coinbase AgentKit wallet safety',
      'agentic wallet spend preflight',
      'AI wallet sendTransaction safety',
      'autonomous wallet spend check',
      'agent wallet transfer CI gate',
      'Coinbase Smart Wallet agent safety',
      'embedded wallet agent spend safety',
      'AI agent wallet can move money safely',
      'review agent wallet spend code',
      'agentic wallet payment code before merge',
      'required check before agent wallet spend',
    ],
  },
  {
    category: 'card/bank/stablecoin',
    expectedPage: 'public/docs/grant-evidence.md',
    fixture: 'card-settlement',
    variants: [
      'card bank stablecoin payment safety',
      'agent can charge card what preflight check',
      'AI agent bank transfer safety gate',
      'stablecoin payment code CI gate',
      'card settlement agent payment safety',
      'review ACH debit code written by an agent',
      'wire transfer agent code safety check',
      'stablecoin transfer before go-live',
      'agent checkout tokenized card safety',
      'processor card rail payment preflight',
      'bank rail payment code before merge',
      'card and stablecoin settlement safety review',
    ],
  },
  {
    category: 'GitHub Action',
    expectedPage: 'public/docs/github-action.md',
    fixture: 'card-settlement',
    variants: [
      'GitHub Action payment safety gate',
      'payment safety GitHub Action',
      'CI action for agent payment code',
      'branch protection payment Doctor',
      'merge queue payment safety gate',
      'GitHub workflow x402 safety',
      'agent payment safety in pull requests',
      'copy paste payment safety action',
      'payment code CI gate GitHub Actions',
      'required CI check for money-moving code',
      'GitHub Action before AI payment code merges',
      'how to add payment safety gate to PRs',
    ],
  },
  {
    category: 'SARIF',
    expectedPage: 'public/docs/monarch-doctor-ci.md',
    fixture: 'stripe-intent',
    variants: [
      'SARIF payment code scanning',
      'GitHub code scanning payment safety',
      'SARIF for agent payment code',
      'code scanning unprotected payment files',
      'payment linter SARIF output',
      'show unsafe payment files in PR',
      'CodeQL upload SARIF payment safety',
      'static analysis payment SARIF',
      'agent payment findings in GitHub code scanning',
      'upload SARIF for payment preflight',
      'payment safety scanner code scanning alerts',
      'PR annotation for unsafe payment code',
    ],
  },
  {
    category: 'hosted proof',
    expectedPage: 'public/docs/hosted-proof.md',
    fixture: 'paid-mcp-tool',
    variants: [
      'hosted proof for payment safety checks',
      'payment safety proof badge',
      'projectHash hosted proof',
      'MONARCH_PROJECT_TOKEN reporting proof',
      'prove payment safety check ran in CI',
      'public proof endpoint for agent payment safety',
      'Doctor report badge for payment project',
      'privacy preserving payment proof endpoint',
      'prove CI ran payment safety preflight',
      'hosted proof without leaking source code',
      'public badge for Monarch Doctor run',
      'aggregate proof for agent payment safety checks',
    ],
  },
];

const fixtureShapes = {
  'x402-fetch': {
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
  'wallet-send': {
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
  'stripe-intent': {
    unsafe: `
      export async function chargeAgent(stripe, payment) {
        return stripe.paymentIntents.create({ amount: payment.amount, currency: 'usd' });
      }
    `,
    patched: `
      import { checkBeforePayment } from '@monarch-shield/x402';

      export async function chargeAgent(stripe, payment) {
        return checkBeforePayment(payment, () => stripe.paymentIntents.create({ amount: payment.amount, currency: 'usd' }));
      }
    `,
  },
  'paid-mcp-tool': {
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
  'agent-wallet': {
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
  'card-settlement': {
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
};

const multilingualPhrases = [
  { language: 'en', phrases: ['agent to agent payment stack safety', 'AI agent can move money safely', 'preflight check before shipping payment code', 'payment code CI gate', 'hosted proof for payment safety checks'] },
  { language: 'es', phrases: ['seguridad de pagos para agentes de IA', 'pagos agente a agente', 'puerta de seguridad antes de producción', 'seguridad de pagos Stripe para agentes', 'seguridad de transferencias bancarias para agentes'] },
  { language: 'pt', phrases: ['segurança de pagamentos para agentes de IA', 'pagamentos agente para agente', 'trava de segurança antes de produção', 'segurança de pagamentos com cartão para agentes', 'pré-verificação de pagamentos x402'] },
  { language: 'fr', phrases: ['sécurité des paiements pour agents IA', 'paiements agent à agent', 'garde-fou avant mise en production', 'sécurité des virements bancaires pour agents', 'sécurité des paiements Stripe pour agents'] },
  { language: 'de', phrases: ['zahlungssicherheit für KI-agenten', 'agent-zu-agent zahlungen', 'sicherheitsprüfung vor produktivbetrieb', 'banküberweisung sicherheit für agenten', 'x402 zahlung vorabprüfung'] },
  { language: 'ja', phrases: ['AI エージェント 支払い 安全性', 'エージェント間 支払い', '本番前 支払い セーフティゲート', 'AI 生成 支払いコード 本番前 チェック', 'x402 支払い 事前チェック'] },
  { language: 'ko', phrases: ['AI 에이전트 결제 안전', '에이전트 간 결제', '프로덕션 전 결제 안전 게이트', 'x402 결제 사전 점검', '유료 MCP 도구 안전'] },
  { language: 'zh', phrases: ['AI 代理 支付 安全', '代理到代理 支付', '上线前 支付 安全门', 'x402 支付 预检查', '付费 MCP 工具 安全'] },
  { language: 'hi', phrases: ['AI एजेंट भुगतान सुरक्षा', 'एजेंट से एजेंट भुगतान', 'उत्पादन से पहले भुगतान सुरक्षा गेट', 'x402 भुगतान प्रीफ्लाइट', 'वॉलेट भेजने से पहले सुरक्षा जांच'] },
  { language: 'ar', phrases: ['سلامة مدفوعات وكيل الذكاء الاصطناعي', 'مدفوعات من وكيل إلى وكيل', 'بوابة أمان قبل الإنتاج', 'فحص مسبق لمدفوعات x402', 'سلامة أدوات MCP المدفوعة'] },
  { language: 'id', phrases: ['keamanan pembayaran agen AI', 'pembayaran antar agen', 'gerbang keamanan sebelum produksi', 'pemeriksaan awal pembayaran x402', 'keamanan alat MCP berbayar'] },
  { language: 'ru', phrases: ['безопасность платежей AI агента', 'платежи агент агент', 'проверка перед production', 'безопасность платежей x402', 'безопасность платных MCP инструментов'] },
  { language: 'tr', phrases: ['AI ajan ödeme güvenliği', 'ajandan ajana ödeme', 'üretimden önce ödeme güvenlik kapısı', 'x402 ödeme ön kontrolü', 'ücretli MCP aracı güvenliği'] },
  { language: 'vi', phrases: ['an toàn thanh toán tác nhân AI', 'thanh toán tác nhân với tác nhân', 'cổng an toàn trước sản xuất', 'kiểm tra trước thanh toán x402', 'an toàn công cụ MCP trả phí'] },
  { language: 'it', phrases: ['sicurezza pagamenti agente AI', 'pagamenti agente ad agente', 'gate di sicurezza prima della produzione', 'preflight pagamenti x402', 'sicurezza strumenti MCP a pagamento'] },
  { language: 'nl', phrases: ['betaalveiligheid voor AI agenten', 'agent naar agent betalingen', 'veiligheidspoort voor productie', 'x402 betaling preflight', 'betaalde MCP tool veiligheid'] },
  { language: 'pl', phrases: ['bezpieczeństwo płatności agenta AI', 'płatności agent do agenta', 'bramka bezpieczeństwa przed produkcją', 'kontrola płatności x402 przed wdrożeniem', 'bezpieczeństwo płatnych narzędzi MCP'] },
  { language: 'th', phrases: ['ความปลอดภัยการชำระเงินของ AI agent', 'การชำระเงิน agent ถึง agent', 'ประตูความปลอดภัยก่อน production', 'ตรวจสอบ x402 ก่อนจ่ายเงิน', 'ความปลอดภัยเครื่องมือ MCP แบบชำระเงิน'] },
  { language: 'ms', phrases: ['keselamatan pembayaran ejen AI', 'pembayaran ejen ke ejen', 'pintu keselamatan sebelum produksi', 'semakan awal pembayaran x402', 'keselamatan alat MCP berbayar'] },
  { language: 'bn', phrases: ['AI এজেন্ট পেমেন্ট নিরাপত্তা', 'এজেন্ট থেকে এজেন্ট পেমেন্ট', 'প্রোডাকশনের আগে পেমেন্ট নিরাপত্তা গেট', 'x402 পেমেন্ট প্রিফ্লাইট', 'পেইড MCP টুল নিরাপত্তা'] },
  { language: 'ur', phrases: ['AI ایجنٹ ادائیگی حفاظت', 'ایجنٹ سے ایجنٹ ادائیگی', 'پروڈکشن سے پہلے ادائیگی سیفٹی گیٹ', 'x402 ادائیگی پری فلائٹ', 'paid MCP tool safety'] },
];
const queryIntents = [
  'how do I set up',
  'how do I review',
  'what should I run for',
  'required preflight for',
  'CI gate for',
  'GitHub Action for',
  'SARIF scan for',
  'hosted proof for',
  'privacy preserving proof for',
  'unsafe code check for',
];
const railHints = ['x402', 'wallet.send', 'Stripe', 'paid MCP', 'agent wallet', 'card bank stablecoin', 'agent-to-agent'];

const representativeQueries = new Set(baseQueries.map((group) => group.variants[0]));
const allQueries = buildQuerySet(requestedQueryCount);

await main();

function buildQuerySet(targetCount) {
  const seedQueries = baseQueries.flatMap((group) => group.variants.map((query) => ({
    query,
    language: 'en',
    category: group.category,
    rail: group.category,
    queryIntent: inferQueryIntent(query),
    expectedPage: group.expectedPage,
    fixture: group.fixture,
    representative: representativeQueries.has(query),
  })));
  const seen = new Set(seedQueries.map((item) => normalize(item.query)));
  const queries = [...seedQueries];
  const generatedByLanguage = multilingualPhrases.map((languageGroup) => {
    const generated = [];
    for (const phrase of languageGroup.phrases) {
      for (const intent of queryIntents) {
        for (const rail of railHints) {
          const group = groupForGeneratedQuery(`${phrase} ${rail}`);
          const query = languageGroup.language === 'en'
            ? `${intent} ${phrase} ${rail}`
            : `${phrase} ${rail} ${intent}`;
          generated.push({
            query,
            language: languageGroup.language,
            category: group.category,
            rail: rail,
            queryIntent: intent,
            expectedPage: group.expectedPage,
            fixture: group.fixture,
            representative: false,
          });
        }
      }
    }
    return generated;
  });

  for (let index = 0; queries.length < targetCount; index += 1) {
    let addedAny = false;
    for (const languageQueries of generatedByLanguage) {
      const candidate = languageQueries[index];
      if (!candidate) continue;
      const normalized = normalize(candidate.query);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        queries.push(candidate);
        addedAny = true;
        if (queries.length >= targetCount) break;
      }
    }
    if (!addedAny) break;
  }

  return queries.slice(0, targetCount);
}

function inferQueryIntent(query) {
  const lower = query.toLowerCase();
  if (lower.includes('github action')) return 'GitHub Action for';
  if (lower.includes('ci gate') || lower.includes('before merge')) return 'CI gate for';
  if (lower.includes('sarif') || lower.includes('code scanning')) return 'SARIF scan for';
  if (lower.includes('hosted proof') || lower.includes('proof') || lower.includes('badge')) return 'hosted proof for';
  if (lower.includes('privacy')) return 'privacy preserving proof for';
  if (lower.includes('unsafe') || lower.includes('block') || lower.includes('catch')) return 'unsafe code check for';
  if (lower.includes('review')) return 'how do I review';
  if (lower.includes('required')) return 'required preflight for';
  if (lower.includes('set up') || lower.includes('build') || lower.includes('add')) return 'how do I set up';
  return 'what should I run for';
}

function groupForGeneratedQuery(query) {
  const lower = query.toLowerCase();
  if (lower.includes('hosted proof') || lower.includes('projecthash') || lower.includes('proof')) {
    return baseQueries.find((group) => group.category === 'hosted proof');
  }
  if (lower.includes('sarif') || lower.includes('code scanning')) {
    return baseQueries.find((group) => group.category === 'SARIF');
  }
  if (lower.includes('github action') || lower.includes('ci gate')) {
    return baseQueries.find((group) => group.category === 'GitHub Action');
  }
  if (lower.includes('stripe')) {
    return baseQueries.find((group) => group.category === 'Stripe');
  }
  if (lower.includes('mcp')) {
    return baseQueries.find((group) => group.category === 'paid MCP');
  }
  if (lower.includes('wallet.send') || lower.includes('agent wallet')) {
    return baseQueries.find((group) => group.category === 'agent wallet');
  }
  if (lower.includes('card') || lower.includes('bank') || lower.includes('stablecoin')) {
    return baseQueries.find((group) => group.category === 'card/bank/stablecoin');
  }
  if (lower.includes('x402')) {
    return baseQueries.find((group) => group.category === 'x402');
  }
  return baseQueries.find((group) => group.category === 'AI agent payments');
}

async function main() {
  await heartbeat('discovery_stress_test_started', 'in_progress', `Scoring ${allQueries.length} discovery queries and executing ${representativeQueries.size} representative third-party flows.`);
  const startedAt = new Date().toISOString();
  const packRoot = mkdtempSync(join(tmpdir(), 'monarch-discovery-pack-'));
  const proofServerState = { reports: [] };
  const proofServer = createProofServer(proofServerState);

  try {
    const documents = loadDiscoveryDocuments();
    const queryResults = allQueries.map((query) => scoreQuery(query, documents));
    const endpoint = await listen(proofServer);
    const x402Pack = packWorkspace('@monarch-shield/x402', packRoot);
    const doctorPack = packWorkspace('x402-doctor', packRoot);
    const executionResults = [];

    for (const query of allQueries.filter((item) => item.representative)) {
      const result = await executeRepresentativeFlow({ query, x402Pack, doctorPack, endpoint });
      executionResults.push(result);
      await heartbeat('discovery_stress_representative_flow', result.passed ? 'completed' : 'failed', `${query.category}: ${result.passed ? 'passed' : result.failure}`);
      if (!result.passed) break;
    }

    const report = buildReport({
      startedAt,
      queryResults,
      executionResults,
      completedAt: new Date().toISOString(),
    });

    writeArtifact('discovery-stress-test.json', `${JSON.stringify(report, null, 2)}\n`);
    writeArtifact('discovery-stress-test.md', renderMarkdown(report));
    await heartbeat('discovery_stress_test_completed', report.status, `${report.status}: ${report.summary.passedQueries}/${report.summary.totalQueries} queries passed; ${report.summary.passedExecutions}/${report.summary.totalExecutions} representative executions passed.`);

    if (report.status !== 'passed') {
      logError('discovery-stress-test', report);
      process.exitCode = 1;
    }
  } catch (error) {
    const failure = {
      tool: 'monarch-discovery-stress-test',
      status: 'error',
      message: error.message,
      stack: error.stack,
      completedAt: new Date().toISOString(),
    };
    logError('discovery-stress-test', failure);
    await heartbeat('discovery_stress_test_error', 'failed', error.message);
    throw error;
  } finally {
    await new Promise((resolveServer) => proofServer.close(resolveServer));
    rmSync(packRoot, { recursive: true, force: true });
  }
}

function loadDiscoveryDocuments() {
  const surfaces = [
    'README.md',
    'package.json',
    'public/llms.txt',
    'public/AGENTS.md',
    'public/llms-full.txt',
    'public/cli.txt',
    'docs.json',
    'public/openapi.yaml',
    'public/docs/manifest.json',
    'packages/x402/README.md',
    'packages/x402/package.json',
    'packages/x402-doctor/README.md',
    'packages/x402-doctor/package.json',
    'action.yml',
    ...packageMetadataFiles(),
    ...listMarkdownFiles(join(repoRoot, 'public/docs')).map((path) => repoRelative(path)),
  ];

  return [...new Set(surfaces)]
    .filter((path) => existsSync(join(repoRoot, path)))
    .map((path) => {
      const rawText = readFileSync(join(repoRoot, path), 'utf8');
      const text = agentVisibleText(path, rawText);
      return {
        path,
        surfaceType: surfaceType(path),
        text,
        lowerText: text.toLowerCase(),
        normalizedText: normalize(text),
      };
    });
}

function packageMetadataFiles() {
  const packagesDir = join(repoRoot, 'packages');
  if (!existsSync(packagesDir)) return [];
  return readdirSync(packagesDir)
    .map((entry) => `packages/${entry}/package.json`)
    .filter((path) => existsSync(join(repoRoot, path)));
}

function agentVisibleText(path, text) {
  if (!path.endsWith('package.json')) return text;
  try {
    const metadata = JSON.parse(text);
    return [
      `name: ${metadata.name ?? ''}`,
      `description: ${metadata.description ?? ''}`,
      `bin: ${Object.keys(metadata.bin ?? {}).join(' ')}`,
      `scripts: ${Object.entries(metadata.scripts ?? {}).map(([key, value]) => `${key} ${value}`).join(' ')}`,
      `keywords: ${(metadata.keywords ?? []).join(' ')}`,
      `homepage: ${metadata.homepage ?? ''}`,
      `repository: ${metadata.repository?.url ?? metadata.repository ?? ''}`,
    ].join('\n');
  } catch {
    return text;
  }
}

function surfaceType(path) {
  if (path === 'README.md' || path.endsWith('/README.md')) return 'readme';
  if (path.endsWith('package.json')) return 'npm-package-metadata';
  if (path === 'action.yml') return 'github-action-metadata';
  if (path === 'public/llms.txt') return 'llms';
  if (path === 'public/AGENTS.md') return 'agents';
  if (path === 'public/cli.txt') return 'cli';
  if (path === 'docs.json' || path === 'public/docs/manifest.json') return 'docs-manifest';
  if (path === 'public/openapi.yaml') return 'openapi';
  if (path.startsWith('public/docs/') && path.endsWith('.md')) return 'docs-title-heading-body';
  return 'other';
}

function listMarkdownFiles(dir) {
  const entries = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...listMarkdownFiles(full));
    } else if (entry.endsWith('.md')) {
      entries.push(full);
    }
  }
  return entries;
}

function repoRelative(path) {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length).replace(/^\/+/, '') : path;
}

function scoreQuery(queryConfig, documents) {
  const ranked = rankDocuments(queryConfig.query, documents);
  const expectedDocument = documents.find((document) => document.path === queryConfig.expectedPage);
  const searchPath = chooseSearchPath(queryConfig, ranked, expectedDocument);
  const entryDocument = searchPath[0] ?? ranked[0]?.document ?? expectedDocument;
  const entryRank = ranked.find((entry) => entry.document.path === entryDocument?.path);
  const answeringDocument = searchPath.at(-1) ?? entryDocument;
  const combinedText = searchPath.map((document) => document.lowerText).join('\n');
  const found = Boolean(answeringDocument) && combinedText.includes('monarch') && (entryRank?.tokenScore ?? 0) > 0;
  const exactCommandPresent = hasCommand(combinedText);
  const commandWorks = exactCommandPresent && hasTestedCommand(combinedText);
  const understandsWhenNeeded = /if (a )?(project|repo|code|agent|software).*can move money|when code handles|before go-live|before merge|payment code|money-moving code|agent-controlled payment|ready for go-live/i.test(combinedText);
  const requiredGatePresent = /required|must pass|preflight gate|ci gate|safety gate|before go-live|before merge|should not merge/i.test(combinedText);
  const ciPathPresent = /github action|actions\/checkout|doctor --ci|--ci --strict|uses:\s*ghostmonarch\/x402ms/i.test(combinedText);
  const githubActionPresent = /github action|actions\/checkout|uses:\s*ghostmonarch\/x402ms/i.test(combinedText);
  const benchmarkLinked = /adversarial-benchmark|benchmark:adversarial/i.test(combinedText);
  const smokeLinked = /smoke:external-agent|external-agent smoke|external smoke|smoke harness/i.test(combinedText);
  const sarifLinked = /sarif|code scanning|upload-sarif/i.test(combinedText);
  const hostedProofLinked = /hosted-proof|projecthash|monarch_project_token|--report|\/proof|badge\.svg/i.test(combinedText);
  const trustEvidencePresent = benchmarkLinked && smokeLinked && sarifLinked && hostedProofLinked;
  const privacyBoundaryPresent = /does not send|does not include|never send|raw token|source code|wallet address|file path|repo name|commit sha/i.test(combinedText);
  const currentBoundaryHonest = /local\/ci preflight|local and ci preflight|local-first preflight|build-time preflight|runtime policy.*later|not runtime|does not prove runtime|runtime.*future|signed attestations.*future/i.test(combinedText);
  const agentWouldKnowNextStep = exactCommandPresent && /(run|add|patch|copy|set|create|fix|before go-live|before merge)/i.test(combinedText);
  const score = {
    found,
    understandsWhenNeeded,
    requiredGatePresent,
    actionable: exactCommandPresent,
    exactCommandPresent,
    commandWorks,
    ciPathPresent,
    githubActionPresent,
    benchmarkLinked,
    smokeLinked,
    sarifLinked,
    hostedProofLinked,
    trustEvidencePresent,
    privacyBoundaryPresent,
    currentBoundaryHonest,
    agentWouldKnowNextStep,
  };
  const passed = Object.values(score).every(Boolean);

  return {
    query: queryConfig.query,
    language: queryConfig.language,
    category: queryConfig.category,
    rail: queryConfig.rail,
    queryIntent: queryConfig.queryIntent,
    expectedPage: queryConfig.expectedPage,
    entrySurface: entryDocument ? { path: entryDocument.path, surfaceType: entryDocument.surfaceType } : null,
    answeringPage: answeringDocument?.path ?? null,
    answeringSurfaceType: answeringDocument?.surfaceType ?? null,
    searchPath: searchPath.map((document) => ({ path: document.path, surfaceType: document.surfaceType })),
    topPages: ranked.slice(0, 8).map((entry) => ({ path: entry.document.path, surfaceType: entry.document.surfaceType, score: entry.score, tokenScore: entry.tokenScore })),
    score,
    weakSignals: Object.entries(score).filter(([, value]) => !value).map(([key]) => key),
    passed,
  };
}

function chooseSearchPath(queryConfig, ranked, expectedDocument) {
  const candidates = ranked.slice(0, 8);
  const expectedRank = ranked.find((entry) => entry.document.path === queryConfig.expectedPage);
  if (expectedDocument && expectedRank?.tokenScore > 0 && !candidates.some((entry) => entry.document.path === expectedDocument.path)) {
    candidates.push(expectedRank);
  }

  const completeCandidate = candidates.find((entry) => entry.tokenScore > 0 && isCompleteAnswer(entry.document.lowerText));
  if (completeCandidate) return [completeCandidate.document];

  const entry = ranked[0];
  if (entry?.tokenScore > 0 && expectedDocument && entry.document.path !== expectedDocument.path && linksTo(entry.document.text, expectedDocument.path)) {
    return [entry.document, expectedDocument];
  }

  if (expectedDocument && expectedRank?.tokenScore > 0) return [expectedDocument];
  return entry?.tokenScore > 0 ? [entry.document] : [];
}

function rankDocuments(query, documents) {
  const tokens = normalize(query).split(' ').filter((token) => token.length > 1);
  return documents
    .map((document) => {
      const tokenScore = tokens.reduce((sum, token) => sum + countOccurrences(document.normalizedText, token), 0);
      const evidenceScore = tokenScore > 0
        ? (document.lowerText.includes('npx @monarch-shield/x402 doctor') ? 4 : 0)
          + (document.lowerText.includes('adversarial-benchmark') ? 3 : 0)
          + (document.lowerText.includes('smoke:external-agent') || document.lowerText.includes('external smoke') ? 3 : 0)
          + (document.lowerText.includes('sarif') ? 3 : 0)
          + (document.lowerText.includes('hosted-proof') || document.lowerText.includes('projecthash') || document.lowerText.includes('--report') ? 3 : 0)
          + (document.surfaceType === 'npm-package-metadata' ? 3 : 0)
          + (document.surfaceType === 'github-action-metadata' ? 3 : 0)
          + (document.path.startsWith('public/docs/') ? 2 : 0)
        : 0;
      const score = tokenScore * 10 + evidenceScore;
      return { document, score, tokenScore };
    })
    .sort((a, b) => b.score - a.score);
}

function isCompleteAnswer(text) {
  return text.includes('monarch')
    && hasCommand(text)
    && /required|must pass|preflight gate|ci gate|before go-live|before merge/i.test(text)
    && /adversarial-benchmark|benchmark:adversarial/i.test(text)
    && /smoke:external-agent|external-agent smoke|external smoke|smoke harness/i.test(text)
    && /sarif|code scanning|upload-sarif/i.test(text)
    && /hosted-proof|projecthash|monarch_project_token|--report|\/proof|badge\.svg/i.test(text)
    && /does not send|does not include|never send|raw token|source code|wallet address|file path|repo name|commit sha/i.test(text)
    && /local\/ci preflight|local and ci preflight|local-first preflight|build-time preflight|runtime policy.*later|not runtime|does not prove runtime|runtime.*future|signed attestations.*future/i.test(text);
}

function linksTo(text, targetPath) {
  const stem = targetPath
    .replace(/^public\//, '')
    .replace(/\.md$/, '');
  return text.includes(targetPath)
    || text.includes(stem)
    || text.includes(`${stem}.html`)
    || text.includes(`https://x402ms.ai/${stem}`)
    || text.includes(`https://x402ms.ai/${stem}.html`);
}

async function executeRepresentativeFlow({ query, x402Pack, doctorPack, endpoint }) {
  const tempRoot = mkdtempSync(join(tmpdir(), `monarch-discovery-${slug(query.category)}-`));
  const projectRoot = join(tempRoot, 'payment-project');
  const fixture = fixtureShapes[query.fixture];

  try {
    installPackedPackages(tempRoot, [x402Pack, doctorPack]);
    writeCase(projectRoot, fixture.unsafe);

    const unsafe = await runNpx(tempRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict']);
    const unsafePayload = parseJson(unsafe.stdout);
    if (unsafe.status !== 1 || unsafePayload?.status !== 'failed') {
      return failedExecution(query, 'unsafe_did_not_fail', { unsafe });
    }

    writeCase(projectRoot, fixture.patched);
    const patched = await runNpx(tempRoot, ['x402-doctor', '--root', projectRoot, '--ci', '--strict']);
    const patchedPayload = parseJson(patched.stdout);
    if (patched.status !== 0 || patchedPayload?.status !== 'passed') {
      return failedExecution(query, 'patched_did_not_pass', { patched });
    }

    const token = randomBytes(32).toString('hex');
    const projectHash = hashProjectToken(token);
    const proofRun = await runNpx(tempRoot, ['x402', 'doctor', '--root', projectRoot, '--ci', '--strict', '--report'], {
      MONARCH_PROJECT_TOKEN: token,
      MONARCH_TELEMETRY_URL: `${endpoint}/doctor-run`,
    });
    const proofRunPayload = parseJson(proofRun.stdout);
    if (proofRun.status !== 0 || proofRunPayload?.status !== 'passed') {
      return failedExecution(query, 'proof_report_did_not_pass', { proofRun });
    }

    const proofResponse = await fetch(`${endpoint}/projects/${projectHash}/proof`);
    const proof = await proofResponse.json();
    const badgeResponse = await fetch(`${endpoint}/projects/${projectHash}/badge.svg`);
    const badge = await badgeResponse.text();
    const latestRunKeys = Object.keys(proof.runs?.[0] ?? {});
    const allowedRunKeys = ['receivedAt', 'status', 'ci', 'strict', 'applicable', 'rails', 'findingCount', 'sandboxPassed', 'hasUnprotectedPaymentFiles'];
    const unexpectedRunKeys = latestRunKeys.filter((key) => !allowedRunKeys.includes(key));
    const serialized = `${JSON.stringify(proof)}\n${badge}`;

    if (!proofResponse.ok || !badgeResponse.ok || unexpectedRunKeys.length || serialized.includes(token) || !badge.includes('passing')) {
      return failedExecution(query, 'proof_or_badge_invalid', {
        proofStatus: proofResponse.status,
        badgeStatus: badgeResponse.status,
        latestRunKeys,
        unexpectedRunKeys,
        leakedToken: serialized.includes(token),
        badgeHasPassing: badge.includes('passing'),
      });
    }

    return {
      query: query.query,
      category: query.category,
      fixture: query.fixture,
      unsafeStatus: unsafePayload.status,
      patchedStatus: patchedPayload.status,
      proofStatus: proofRunPayload.status,
      projectHash,
      latestRunKeys,
      sensitiveLeak: false,
      passed: true,
    };
  } finally {
    if (process.env.MONARCH_KEEP_DISCOVERY_STRESS !== '1') {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

function failedExecution(query, failure, detail) {
  return {
    query: query.query,
    category: query.category,
    fixture: query.fixture,
    failure,
    detail: sanitizeDetail(detail),
    passed: false,
  };
}

function buildReport({ startedAt, completedAt, queryResults, executionResults }) {
  const passedQueries = queryResults.filter((result) => result.passed).length;
  const passedExecutions = executionResults.filter((result) => result.passed).length;
  const weakestCategories = [...new Set(queryResults
    .filter((result) => !result.passed)
    .map((result) => result.category))];
  const weakestSurfaces = summarizeWeakSurfaces(queryResults);
  const weakestLanguages = summarizeWeakLanguages(queryResults);
  const byLanguage = summarizeDimension(queryResults, 'language');
  const byPaymentRail = summarizeDimension(queryResults, 'rail');
  const byQueryIntent = summarizeDimension(queryResults, 'queryIntent');

  return {
    tool: 'monarch-discovery-stress-test',
    sprint: 'Agent Search Discovery Stress Test',
    status: passedQueries === queryResults.length && passedExecutions === executionResults.length ? 'passed' : 'failed',
    startedAt,
    completedAt,
    summary: {
      totalQueries: queryResults.length,
      passedQueries,
      passRate: Number((passedQueries / queryResults.length).toFixed(4)),
      totalExecutions: executionResults.length,
      passedExecutions,
      byLanguage,
      byPaymentRail,
      byQueryIntent,
      weakestCategories,
      weakestLanguages,
      weakestSurfaces,
    },
    queryResults,
    representativeExecutions: executionResults,
  };
}

function summarizeDimension(queryResults, key) {
  const totals = new Map();
  for (const result of queryResults) {
    const value = result[key] ?? 'unknown';
    const entry = totals.get(value) ?? { value, totalQueries: 0, passedQueries: 0, passRate: 0 };
    entry.totalQueries += 1;
    if (result.passed) entry.passedQueries += 1;
    totals.set(value, entry);
  }

  return [...totals.values()]
    .map((entry) => ({
      ...entry,
      passRate: Number((entry.passedQueries / entry.totalQueries).toFixed(4)),
    }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

function summarizeWeakLanguages(queryResults) {
  const totals = new Map();
  for (const result of queryResults) {
    const language = result.language ?? 'unknown';
    const entry = totals.get(language) ?? { language, totalQueries: 0, passedQueries: 0, passRate: 0 };
    entry.totalQueries += 1;
    if (result.passed) entry.passedQueries += 1;
    totals.set(language, entry);
  }

  return [...totals.values()]
    .map((entry) => ({
      ...entry,
      passRate: Number((entry.passedQueries / entry.totalQueries).toFixed(4)),
    }))
    .filter((entry) => entry.passRate < 1)
    .sort((a, b) => a.passRate - b.passRate || b.totalQueries - a.totalQueries);
}

function summarizeWeakSurfaces(queryResults) {
  const failuresBySurface = new Map();
  for (const result of queryResults.filter((queryResult) => !queryResult.passed)) {
    const key = result.answeringPage ?? result.entrySurface?.path ?? 'unknown';
    const entry = failuresBySurface.get(key) ?? {
      path: key,
      surfaceType: result.answeringSurfaceType ?? result.entrySurface?.surfaceType ?? 'unknown',
      failedQueries: 0,
      weakSignals: {},
    };
    entry.failedQueries += 1;
    for (const signal of result.weakSignals) {
      entry.weakSignals[signal] = (entry.weakSignals[signal] ?? 0) + 1;
    }
    failuresBySurface.set(key, entry);
  }

  return [...failuresBySurface.values()]
    .sort((a, b) => b.failedQueries - a.failedQueries)
    .slice(0, 12);
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

      const route = request.url.match(/^\/projects\/([a-f0-9]{24})\/(proof|badge\.svg)$/);
      if (request.method === 'GET' && route) {
        const projectHash = route[1];
        const scoped = state.reports.filter((report) => report.projectScope === true && report.projectHash === projectHash);
        const latest = scoped.at(-1);

        if (route[2] === 'badge.svg') {
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

function hasCommand(text) {
  return /npx\s+@monarch-shield\/x402\s+doctor|npx\s+x402-doctor|uses:\s*ghostmonarch\/x402ms|--sarif-output|checkbeforepayment/i.test(text);
}

function hasTestedCommand(text) {
  return /npx\s+@monarch-shield\/x402\s+doctor|npx\s+x402-doctor|doctor --ci|--ci --strict|--report|--sarif-output/i.test(text);
}

function renderMarkdown(report) {
  const queryRows = report.queryResults
    .map((result) => `| ${result.language} | ${result.rail} | ${result.queryIntent} | ${result.query} | ${result.entrySurface?.path ?? ''} | ${result.answeringPage} | ${result.passed ? 'PASS' : `FAIL: ${result.weakSignals.join(', ')}`} |`)
    .join('\n');
  const executionRows = report.representativeExecutions
    .map((result) => `| ${result.category} | ${result.fixture} | ${result.unsafeStatus ?? ''} | ${result.patchedStatus ?? ''} | ${result.proofStatus ?? ''} | ${result.passed ? 'PASS' : `FAIL: ${result.failure}`} |`)
    .join('\n');
  const weakSurfaceRows = report.summary.weakestSurfaces.length
    ? report.summary.weakestSurfaces
      .map((surface) => `| ${surface.path} | ${surface.surfaceType} | ${surface.failedQueries} | ${Object.entries(surface.weakSignals).map(([signal, count]) => `${signal}: ${count}`).join(', ')} |`)
      .join('\n')
    : '| None |  | 0 |  |';
  const weakLanguageRows = report.summary.weakestLanguages.length
    ? report.summary.weakestLanguages
      .map((language) => `| ${language.language} | ${language.passedQueries}/${language.totalQueries} | ${language.passRate} |`)
      .join('\n')
    : '| None | 0/0 | 1 |';
  const languageRows = renderSummaryRows(report.summary.byLanguage);
  const railRows = renderSummaryRows(report.summary.byPaymentRail);
  const intentRows = renderSummaryRows(report.summary.byQueryIntent);

  return `# Discovery Stress Test Report

Status: ${report.status}

Queries: ${report.summary.passedQueries}/${report.summary.totalQueries}

Representative executions: ${report.summary.passedExecutions}/${report.summary.totalExecutions}

This harness checks whether a cold outside agent can start from high-intent payment-safety searches, land on Monarch discovery surfaces with runnable commands and proof links, then execute real third-party packaged install flows. It does not claim runtime policy enforcement, signed attestations, dashboards, billing, fraud prevention, settlement safety, or wallet ownership verification.

This is deterministic simulated discovery against agent-visible Monarch surfaces. It is not live search-engine visibility.

## Pass Rate By Language

| Language | Passed Queries | Pass Rate |
| --- | --- | --- |
${languageRows}

## Pass Rate By Payment Rail

| Payment Rail | Passed Queries | Pass Rate |
| --- | --- | --- |
${railRows}

## Pass Rate By Query Intent

| Query Intent | Passed Queries | Pass Rate |
| --- | --- | --- |
${intentRows}

## Weakest Surfaces

| Surface | Type | Failed Queries | Weak Signals |
| --- | --- | --- | --- |
${weakSurfaceRows}

## Weakest Languages

| Language | Passed Queries | Pass Rate |
| --- | --- | --- |
${weakLanguageRows}

## Query Stress

| Language | Rail | Intent | Query | Entry Surface | Answering Surface | Result |
| --- | --- | --- | --- | --- | --- | --- |
${queryRows}

## Representative Third-Party Execution

| Category | Fixture | Unsafe | Patched | Proof | Result |
| --- | --- | --- | --- | --- | --- |
${executionRows}
`;
}

function renderSummaryRows(rows) {
  return rows
    .map((row) => `| ${row.value} | ${row.passedQueries}/${row.totalQueries} | ${row.passRate} |`)
    .join('\n');
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

function normalize(value) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}@/.-]+/gu, ' ').trim();
}

function countOccurrences(text, token) {
  if (!token) return 0;
  return text.split(token).length - 1;
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

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
