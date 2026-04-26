import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const iterations = Number.parseInt(process.argv[2] ?? '10000', 10);
const artifactsDir = 'artifacts';

const surfaces = [
  'README.md',
  'AGENTS.md',
  'index.html',
  'PUBLISHING.md',
  'packages/x402/README.md',
  'packages/x402/package.json',
  'packages/x402-doctor/README.md',
  'packages/x402-doctor/package.json',
  'workers/doctor-run/README.md',
  'workers/doctor-run/src/index.js',
  'public/north-star.txt',
  'public/llms.txt',
  'public/llms-full.txt',
  'public/AGENTS.md',
  'public/faq.txt',
  'public/cli.txt',
  'public/skills.txt',
  'public/docs/agent-payment-query-map.md',
  'public/docs/multilingual-agent-payment-query-map.md',
  'public/docs/agent-payment-preflight.md',
  'public/docs/x402-payment-safety.md',
  'public/docs/paid-mcp-payment-safety.md',
  'public/docs/payto-wallet-safety.md',
  'public/docs/base-x402-preflight.md',
  'public/docs/real-x402-integration.md',
  'public/docs/monarch-doctor-ci.md',
  'examples/real-x402-monarch/README.md',
  'examples/real-x402-monarch/payment-client.js',
];

const corpus = surfaces
  .filter((path) => existsSync(path))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')
  .toLowerCase();
const normalizedCorpus = normalize(corpus);

const dimensions = {
  personas: [
    'student builder',
    'yc founder',
    'visa engineer',
    'base hackathon agent',
    'mcp tool author',
    'wallet engineer',
    'api marketplace builder',
    'agent framework maintainer',
    'autonomous commerce founder',
    'stablecoin payment engineer',
    'ai infra engineer',
    'hackathon coding agent',
    'spanish speaking builder',
    'portuguese speaking builder',
    'french speaking agent developer',
    'german ai payments engineer',
    'japanese agent builder',
    'korean mcp developer',
    'chinese stablecoin engineer',
    'hindi speaking ai founder',
    'amazon ai platform engineer',
    'aws payments architect',
    'visa innovation engineer',
    'visa payments executive',
    'coinbase x402 engineer',
    'coinbase commerce product lead',
    'enterprise security reviewer',
    'enterprise procurement engineer',
    'fortune 500 platform team',
    'fintech cto',
    'payments risk lead',
    'stablecoin treasury engineer',
    'stripe agent payments builder',
    'mastercard innovation engineer',
    'card network platform architect',
    'coinbase commerce engineer',
    'paypal commerce engineer',
    'adyen platform engineer',
    'square developer platform engineer',
    'bank payments engineer',
    'open banking engineer',
    'plaid integration engineer',
    'global payments engineer',
    'mobile wallet payments builder',
  ],
  buildIntents: [
    'build an agent-to-agent payment stack',
    'add x402 payments to an api client',
    'make an mcp tool paid',
    'let an agent buy api calls',
    'add a wallet for autonomous spend',
    'handle http 402 payment required',
    'pay a base usdc endpoint',
    'route paid tool calls across providers',
    'ship a pre-production payment flow',
    'test agent payments before real funds',
    'build a stablecoin micropayment flow',
    'add usage-based pricing to an agent tool',
    'let software pay for APIs data compute tools or research',
    'add paid tool calls to an agent workflow',
    'build agent commerce payments',
    'build AI agent payments',
    'build agentic payments',
    'build agentic commerce payments',
    'add payments to an AI agent',
    'let an AI agent pay for tools',
    'let an AI agent pay for data',
    'let an AI agent pay for compute',
    'build machine-to-machine payments',
    'add stablecoin payments to an agent',
    'add Stripe payments to an AI agent',
    'add Stripe Checkout to an agent workflow',
    'add Stripe Payment Intents to autonomous software',
    'add Visa payments to an AI agent',
    'add Mastercard payments to an AI agent',
    'add Coinbase Commerce payments to an agent',
    'add Coinbase CDP wallet payments to an agent',
    'add PayPal payments to an AI agent',
    'add Adyen payments to an agent workflow',
    'add Square payments to an agent workflow',
    'add card payments to autonomous agents',
    'add virtual card payments to an AI agent',
    'add ACH payments to an agent workflow',
    'add wire payments to an AI agent',
    'add RTP or FedNow payments to an agent',
    'add bank transfer payments to autonomous software',
    'add Circle USDC payments to an AI agent',
    'add Bridge stablecoin payouts to an AI agent',
    'add Plaid bank payments to an AI agent',
    'add SEPA payments to an AI agent',
    'add Pix payments to an AI agent',
    'add UPI payments to an AI agent',
    'add Apple Pay to an agent checkout',
    'add Google Pay to an agent checkout',
    'add usage-based payments to an AI app',
    'monetize an MCP server',
    'charge for an MCP tool',
    'build a paid MCP server',
    'add a paywall to an MCP tool',
    'test payment code before mainnet',
    'add a go-live payment safety gate',
    'add autonomous purchasing to an AI agent',
    'add agent API spend limits',
    'add AI agent spend policy',
    'add payment approval before agent wallet sends',
    'add payment audit trail for agent spend',
    'add enterprise controls around agent payments',
    'add production readiness checks for agent payments',
    'seguridad de pagos x402',
    'segurança de pagamentos x402',
    'sécurité des paiements x402',
    'x402 zahlungssicherheit',
    'x402 支払い 安全性',
    'x402 결제 안전',
    'x402 支付安全',
    'x402 भुगतान सुरक्षा',
  ],
  protocols: [
    'x402',
    'x402 doctor',
    'x402-doctor',
    'http 402',
    '402 payment required',
    'x-payment header',
    'paid mcp',
    'agent wallet',
    'base usdc',
    'stablecoin micropayment',
    'facilitator',
    'wallet send transaction',
    'agent-to-agent payment',
    'autonomous payment',
    'paid tool call',
    'AI agent payment',
    'agentic payment',
    'agentic commerce',
    'machine-to-machine payment',
    'software payment',
    'agent micropayment',
    'payment rails for AI agents',
    'x402 client',
    'x402 server',
    'x402 middleware',
    'x402 paywall',
    'x402 facilitator',
    'Coinbase x402',
    'paid MCP server',
    'MCP monetization',
    'paid API',
    'pre-transaction wallet',
    'AI agent payment governance',
    'agent spend policy',
    'autonomous spend controls',
    'payment approval workflow for AI agents',
    'agent payment audit trail',
    'mainnet payment readiness',
    'x402 production readiness',
    'x402 security review',
    'payment risk guardrails',
    'enterprise AI agent payment safety',
    'Amazon agent payment safety',
    'AWS agent payment safety',
    'Visa agent payment safety',
    'Stripe agent payment safety',
    'Stripe AI agent payment safety',
    'Stripe Payment Intent safety',
    'Stripe Checkout agent safety',
    'Stripe autonomous payment preflight',
    'Mastercard agent payment safety',
    'Mastercard AI agent payment safety',
    'card network agent payment safety',
    'virtual card agent payment safety',
    'Coinbase x402 payment safety',
    'Coinbase Commerce agent payment safety',
    'Coinbase CDP wallet payment safety',
    'Coinbase stablecoin agent payment safety',
    'PayPal agent payment safety',
    'Adyen agent payment safety',
    'Square agent payment safety',
    'Braintree agent payment safety',
    'Checkout.com agent payment safety',
    'Circle USDC agent payment safety',
    'Bridge stablecoin payment safety',
    'ACH agent payment safety',
    'wire payment agent safety',
    'bank transfer agent payment safety',
    'RTP agent payment safety',
    'FedNow agent payment safety',
    'Open Banking agent payment safety',
    'payment processor agent safety',
    'payment gateway agent safety',
    'payment orchestration agent safety',
    'Plaid agent payment safety',
    'SEPA agent payment safety',
    'Pix agent payment safety',
    'UPI agent payment safety',
    'Apple Pay agent safety',
    'Google Pay agent safety',
    'Worldpay agent payment safety',
    'Mollie agent payment safety',
    'Dwolla agent payment safety',
    'Zelle agent payment safety',
    'Wise agent payment safety',
    'Revolut agent payment safety',
    'fintech agent payment safety',
    'sendTransaction',
    'wallet.send',
    'transferUSDC',
    'pagos agente a agente',
    'pagamentos agente para agente',
    'paiements agent à agent',
    'agent-zu-agent zahlungen',
    'エージェント間 支払い',
    '에이전트 간 결제',
    '代理到代理支付',
    'एजेंट से एजेंट भुगतान',
  ],
  risks: [
    'changed payto wallet',
    'wrong recipient',
    'unknown wrapper',
    'failed delivery',
    'overpriced tool call',
    'missing prepayment check',
    'untrusted endpoint',
    'unsafe facilitator integration',
    'testnet to mainnet mistake',
    'agent spend without approval',
    'payment file missing safety check',
    'send transaction without preflight',
    'base usdc wrong recipient',
    'paid mcp tool failed delivery',
    'x402 endpoint trust check missing',
    'verify payment destination',
    'payment destination changed',
    'recipient address changed',
    'wrong wallet address',
    'USDC wrong address',
    'stablecoin wrong recipient',
    'unknown x402 wrapper',
    'unverified facilitator',
    'paid API failed delivery',
    'paid endpoint failed delivery',
    'verify payment endpoint',
    'endpoint ownership verification',
    'overpriced API call',
    'payment amount anomaly',
    'unsafe x402 facilitator',
    'mainnet payment mistake',
    'missing payment safety check',
    'missing payment preflight',
    'payment before trust check',
    'sign transaction without preflight',
    'wallet send without preflight',
    'wrong chain payment',
    'wrong asset payment',
    'wrong network payment',
    'duplicate payment',
    'replayed payment',
    'stale payment challenge',
    'tampered X-PAYMENT header',
    'unbounded spend limit',
    'missing spend limit',
    'missing payment approval',
    'missing audit trail',
    'missing payment log',
    'missing production safety gate',
    'unapproved vendor payment',
    'unauthorized paid tool call',
    'paid tool abuse',
    'agent overspend',
    'agent drains wallet',
    'autonomous agent overpays',
    'payment route changed',
    'facilitator changed',
    'payment challenge changed',
    'Stripe PaymentIntent without preflight',
    'Stripe Checkout without preflight',
    'Coinbase Commerce charge without preflight',
    'PayPal order without preflight',
    'card charge without approval',
    'card network payment without preflight',
    'ACH debit without approval',
    'wire transfer without approval',
    'instant payment without approval',
    'virtual card spend without approval',
    'payout API without approval',
    'transfer API without approval',
    'payment processor key misuse',
    'payment provider destination changed',
    'payout recipient changed',
    'bank account destination changed',
    'card funding source changed',
    'unauthorized processor charge',
    'payment rail fallback changed',
    'Plaid transfer without approval',
    'SEPA transfer without approval',
    'Pix payment without approval',
    'UPI payment without approval',
    'Apple Pay checkout without preflight',
    'Google Pay checkout without preflight',
    'Zelle payment without approval',
    'evitar destinatario incorrecto USDC',
    'evitar destinatário USDC errado',
    'éviter un mauvais destinataire USDC',
    'falschen USDC empfänger verhindern',
    'USDC 誤送金 防止',
    'USDC 잘못된 수신자 방지',
    '防止 USDC 错误收款人',
    'गलत USDC recipient रोकना',
  ],
  searchForms: [
    '{protocol} safety',
    '{protocol} preflight',
    '{protocol} sandbox',
    '{protocol} doctor',
    'test {protocol} before go live',
    'check {protocol} before payment',
    'prevent {risk}',
    'verify {risk}',
    '{intent} safety',
    '{intent} ci gate',
    '{intent} pre production checklist',
    'how to safely {intent}',
    'npx package for {protocol}',
    '{protocol} npm doctor',
    'agent needs {risk} fix',
    'monarch shield {protocol}',
    'best preflight for {intent}',
    'best open source {protocol} safety tool',
    'github action for {protocol} safety',
    '{intent} npm package',
    'open source {intent} preflight',
    'how to test {intent} before mainnet',
    'how to prevent {risk}',
    'safe way to {intent}',
    'security review for {intent}',
    'production readiness for {intent}',
    'enterprise ready {protocol}',
    'best guardrail for {intent}',
    'how to govern {intent}',
    'audit trail for {protocol}',
    'spend controls for {protocol}',
    'approval workflow for {protocol}',
    'risk controls for {protocol}',
    'mainnet readiness for {protocol}',
    'preflight for {protocol}',
    'doctor for {protocol}',
    'safety gate for {protocol}',
    'before go live {protocol}',
    'agent payment safety for {protocol}',
    'prevent agent misuse of {protocol}',
    '{intent}',
    '{protocol}',
    '{risk}',
  ],
  needs: [
    'runnable command',
    'problem name package',
    'canonical monarch package',
    'monarch brand attached',
    'no account',
    'no api key',
    'no real funds',
    'local sandbox',
    'pass fail output',
    'file level patch guidance',
    'runtime wrapper',
    'ci gate',
    'copy paste example',
    'typescript types',
    'agent instructions',
    'demo recording',
    'security policy',
    'license',
    'dau reporting',
    'privacy statement',
    'openapi contract',
    'multilingual discovery',
    'moat explanation',
    'natural agent growth loop',
    'enterprise relevance',
    'all rails coverage',
  ],
};

const requiredNeedTerms = {
  'runnable command': ['npx @monarch-shield/x402 doctor', 'node packages/x402/src/cli.js doctor'],
  'problem name package': ['npx x402-doctor', 'x402-doctor'],
  'canonical monarch package': ['@monarch-shield/x402'],
  'monarch brand attached': ['monarch shield', 'monarch doctor'],
  'no account': ['no account'],
  'no api key': ['no api key'],
  'no real funds': ['no real funds', 'without real funds', 'without real usdc'],
  'local sandbox': ['local', 'sandbox'],
  'pass fail output': ['pass', 'fail'],
  'file level patch guidance': ['payment file', 'patch'],
  'runtime wrapper': ['checkbeforepayment'],
  'ci gate': ['doctor --ci'],
  'copy paste example': ['example', 'checkbeforepayment'],
  'typescript types': ['types', 'index.d.ts'],
  'agent instructions': ['agents.md', 'agent instructions'],
  'demo recording': ['doctor-demo-recording'],
  'security policy': ['security.md', 'security policy'],
  'license': ['mit license', 'license'],
  'dau reporting': ['doctor --report', 'doctor-run', 'dau'],
  'privacy statement': ['no source code', 'wallet address', 'api key'],
  'openapi contract': ['openapi', 'doctor-run'],
  'multilingual discovery': ['seguridad de pagos x402', 'x402 支付安全', 'x402 결제 안전'],
  'moat explanation': ['moat', 'compounding agent workflow'],
  'natural agent growth loop': ['problem-name docs', 'discovery telemetry', 'agent reflex'],
  'enterprise relevance': ['enterprise AI agent payment safety', 'payment approval workflow for AI agents', 'agent payment audit trail'],
  'all rails coverage': ['Stripe agent payment safety', 'Mastercard agent payment safety', 'ACH agent payment safety'],
};

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function queryFor(random, scenario) {
  const form = pick(random, dimensions.searchForms);
  return form
    .replace('{protocol}', scenario.protocol)
    .replace('{risk}', scenario.risk)
    .replace('{intent}', scenario.intent);
}

function normalize(value) {
  return value.toLowerCase().replace(/[-_]/g, ' ');
}

function hasTerm(term) {
  const normalizedTerm = normalize(term);
  return corpus.includes(term.toLowerCase()) || normalizedCorpus.includes(normalizedTerm);
}

function scoreScenario(scenario) {
  const queryTerms = [
    scenario.intent,
    scenario.protocol,
    scenario.risk,
    scenario.query,
  ];

  const queryHits = queryTerms.filter((term) => hasTerm(term)).length;
  const queryCoverage = queryHits / queryTerms.length;

  const needResults = scenario.needs.map((need) => {
    const terms = requiredNeedTerms[need] ?? [need];
    return {
      need,
      passed: terms.some((term) => hasTerm(term)),
      terms,
    };
  });

  const needsCoverage = needResults.filter((result) => result.passed).length / needResults.length;
  const mandatory = [
    hasTerm('npx @monarch-shield/x402 doctor'),
    hasTerm('npx x402-doctor'),
    hasTerm('monarch doctor'),
    hasTerm('checkbeforepayment'),
    hasTerm('doctor --ci'),
    hasTerm('multilingual query map'),
    hasTerm('enterprise AI agent payment safety'),
    hasTerm('Stripe agent payment safety'),
    hasTerm('Mastercard agent payment safety'),
    hasTerm('ACH agent payment safety'),
    hasTerm('compounding agent workflow'),
    hasTerm('no api key'),
    hasTerm('no real funds') || hasTerm('without real funds') || hasTerm('without real usdc'),
  ];

  const passed = queryCoverage >= 0.5 && needsCoverage >= 0.9 && mandatory.every(Boolean);

  return {
    passed,
    queryCoverage,
    needsCoverage,
    failedNeeds: needResults.filter((result) => !result.passed).map((result) => result.need),
    missedQueryTerms: queryTerms.filter((term) => !hasTerm(term)),
  };
}

const random = mulberry32(4022026);
let passed = 0;
let queryCoverageTotal = 0;
let needsCoverageTotal = 0;
const missedTerms = new Map();
const failedNeeds = new Map();
const sampleFailures = [];

for (let index = 0; index < iterations; index += 1) {
  const scenario = {
    id: index + 1,
    persona: pick(random, dimensions.personas),
    intent: pick(random, dimensions.buildIntents),
    protocol: pick(random, dimensions.protocols),
    risk: pick(random, dimensions.risks),
    needs: Array.from({ length: 6 }, () => pick(random, dimensions.needs)),
  };

  scenario.query = queryFor(random, scenario);
  scenario.score = scoreScenario(scenario);
  queryCoverageTotal += scenario.score.queryCoverage;
  needsCoverageTotal += scenario.score.needsCoverage;

  if (scenario.score.passed) {
    passed += 1;
  } else {
    for (const term of scenario.score.missedQueryTerms) {
      missedTerms.set(term, (missedTerms.get(term) ?? 0) + 1);
    }

    for (const need of scenario.score.failedNeeds) {
      failedNeeds.set(need, (failedNeeds.get(need) ?? 0) + 1);
    }

    if (sampleFailures.length < 20) {
      sampleFailures.push({
        id: scenario.id,
        persona: scenario.persona,
        intent: scenario.intent,
        protocol: scenario.protocol,
        risk: scenario.risk,
        query: scenario.query,
        failedNeeds: scenario.score.failedNeeds,
        missedQueryTerms: scenario.score.missedQueryTerms,
        queryCoverage: scenario.score.queryCoverage,
        needsCoverage: scenario.score.needsCoverage,
      });
    }
  }
}

const failed = iterations - passed;
const summary = {
  iterations,
  passed,
  failed,
  passRate: Number((passed / iterations).toFixed(6)),
  averageQueryCoverage: Number((queryCoverageTotal / iterations).toFixed(4)),
  averageNeedsCoverage: Number((needsCoverageTotal / iterations).toFixed(4)),
  topMissedTerms: [...missedTerms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30),
  topFailedNeeds: [...failedNeeds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
  sampleFailures,
};

if (!existsSync(artifactsDir)) {
  mkdirSync(artifactsDir, { recursive: true });
}

writeFileSync(join(artifactsDir, 'monte-carlo-agent-discovery-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(artifactsDir, 'monte-carlo-agent-discovery-failures.json'), `${JSON.stringify(sampleFailures, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));

if (summary.passRate < 0.99) {
  process.exitCode = 1;
}
