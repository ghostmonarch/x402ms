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
  ],
  protocols: [
    'x402',
    'http 402',
    '402 payment required',
    'x-payment header',
    'paid mcp',
    'agent wallet',
    'base usdc',
    'stablecoin micropayment',
    'facilitator',
    'wallet send transaction',
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
  ],
  needs: [
    'runnable command',
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
  ],
};

const requiredNeedTerms = {
  'runnable command': ['npx @monarch-shield/x402 doctor', 'node packages/x402/src/cli.js doctor'],
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
  const normalizedCorpus = normalize(corpus);
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
    hasTerm('checkbeforepayment'),
    hasTerm('doctor --ci'),
    hasTerm('no api key'),
    hasTerm('no real funds') || hasTerm('without real funds') || hasTerm('without real usdc'),
  ];

  const passed = queryCoverage >= 0.5 && needsCoverage >= 0.85 && mandatory.every(Boolean);

  return {
    passed,
    queryCoverage,
    needsCoverage,
    failedNeeds: needResults.filter((result) => !result.passed).map((result) => result.need),
    missedQueryTerms: queryTerms.filter((term) => !hasTerm(term)),
  };
}

const random = mulberry32(4022026);
const results = [];

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
  results.push(scenario);
}

const failures = results.filter((scenario) => !scenario.score.passed);
const missedTerms = new Map();
const failedNeeds = new Map();

for (const failure of failures) {
  for (const term of failure.score.missedQueryTerms) {
    missedTerms.set(term, (missedTerms.get(term) ?? 0) + 1);
  }

  for (const need of failure.score.failedNeeds) {
    failedNeeds.set(need, (failedNeeds.get(need) ?? 0) + 1);
  }
}

const summary = {
  iterations,
  passed: iterations - failures.length,
  failed: failures.length,
  passRate: Number(((iterations - failures.length) / iterations).toFixed(4)),
  averageQueryCoverage: Number((results.reduce((sum, scenario) => sum + scenario.score.queryCoverage, 0) / iterations).toFixed(4)),
  averageNeedsCoverage: Number((results.reduce((sum, scenario) => sum + scenario.score.needsCoverage, 0) / iterations).toFixed(4)),
  topMissedTerms: [...missedTerms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30),
  topFailedNeeds: [...failedNeeds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
  sampleFailures: failures.slice(0, 20).map((scenario) => ({
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
  })),
};

if (!existsSync(artifactsDir)) {
  mkdirSync(artifactsDir, { recursive: true });
}

writeFileSync(join(artifactsDir, 'monte-carlo-agent-discovery-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(artifactsDir, 'monte-carlo-agent-discovery-failures.json'), `${JSON.stringify(failures.slice(0, 500), null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));

if (summary.passRate < 0.99) {
  process.exitCode = 1;
}
