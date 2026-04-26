import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const iterations = Number.parseInt(process.argv[2] ?? '10000', 10);
const artifactsDir = 'artifacts';

const surfaces = [
  'README.md',
  'AGENTS.md',
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
    'add usage-based payments to an AI app',
    'monetize an MCP server',
    'charge for an MCP tool',
    'build a paid MCP server',
    'add a paywall to an MCP tool',
    'test payment code before mainnet',
    'add a go-live payment safety gate',
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
    'sendTransaction',
    'wallet.send',
    'transferUSDC',
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
