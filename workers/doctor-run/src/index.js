const MAX_BODY_BYTES = 8192;
const ALLOWED_ORIGINS = new Set(['https://x402ms.ai', 'https://www.x402ms.ai']);
const REQUIRED_FIELDS = ['event', 'tool', 'version', 'status', 'projectHash', 'timestamp'];
const DISCOVERY_REQUIRED_FIELDS = ['event', 'eventName', 'surface', 'variant', 'language', 'timestamp'];
const ALLOWED_DOCTOR_FIELDS = new Set([
  'event',
  'tool',
  'version',
  'status',
  'projectHash',
  'timestamp',
  'ci',
  'strict',
  'applicable',
  'hasPaymentFlow',
  'hasUnprotectedPaymentFiles',
  'findingCount',
  'detectedRails',
  'sandboxPassed',
  'proofSource',
]);
const ALLOWED_RAILS = new Set([
  'x402',
  'paid_mcp',
  'agentkit',
  'stripe',
  'stablecoin',
  'wallet',
  'card',
  'bank',
  'regional_rail',
]);
const ALLOWED_PROOF_SOURCES = new Set([
  'internal-dogfood',
  'public-example',
  'external-reported',
]);
const PUBLIC_PROOF_EXAMPLES = [
  {
    id: 'x402-unsafe-to-passed',
    source: 'public-example',
    rail: 'x402',
    status: 'passed',
    title: 'x402 payment path blocked until checkBeforePayment was added',
    summary: 'Doctor first failed an unprotected X-PAYMENT flow, then passed after the original payment path called Monarch before funds moved.',
    href: 'https://x402ms.ai/doctor-demo-recording.txt',
  },
  {
    id: 'sandbox-unsafe-branches',
    source: 'public-example',
    rail: 'sandbox',
    status: 'passed',
    title: 'Sandbox proves allow, caution, block, and route decisions',
    summary: 'Local fixtures cover missing prepayment checks, unknown wrappers, changed pay-to wallets, failed delivery, and verified alternatives.',
    href: 'https://x402ms.ai/doctor-demo-summary.json',
  },
  {
    id: 'base-x402-proof-pack',
    source: 'public-example',
    rail: 'x402-base-usdc',
    status: 'passed',
    title: 'Base x402 proof pack blocks unsafe USDC payment code before passing the patched path',
    summary: 'Doctor fails the unsafe Base x402 example, passes the patched checkBeforePayment path, and proves CI enforcement for Base USDC agent payments.',
    href: 'https://x402ms.ai/base-x402-proof-pack-recording.txt',
  },
  {
    id: 'coinbase-agentkit-proof-pack',
    source: 'public-example',
    rail: 'coinbase-agentkit-agentic-wallet',
    status: 'passed',
    title: 'Coinbase AgentKit / Agentic Wallet proof pack blocks unsafe autonomous spend',
    summary: 'Doctor fails unsafe Coinbase agent-wallet spend, passes the patched checkBeforePayment path, and proves CI enforcement for AgentKit, Agentic Wallet, and Base USDC flows.',
    href: 'https://x402ms.ai/coinbase-agentkit-proof-pack-recording.txt',
  },
  {
    id: 'virtuals-acp-proof-pack',
    source: 'public-example',
    rail: 'virtuals-acp-usdc-escrow',
    status: 'passed',
    title: 'Virtuals ACP proof pack blocks unsafe USDC escrow job funding',
    summary: 'Doctor fails unsafe Virtuals ACP job funding, passes the patched checkBeforePayment path, and proves CI enforcement for USDC escrowed agent commerce.',
    href: 'https://x402ms.ai/virtuals-acp-proof-pack-recording.txt',
  },
  {
    id: 'google-ap2-a2a-x402-proof-pack',
    source: 'public-example',
    rail: 'google-ap2-a2a-x402',
    status: 'passed',
    title: 'Google AP2 / A2A x402 proof pack blocks unsafe agent payment payloads',
    summary: 'Doctor fails unsafe AP2 embedded A2A x402 payment code, passes the patched checkBeforePayment path, and proves CI enforcement for agent-to-agent crypto payments.',
    href: 'https://x402ms.ai/google-ap2-a2a-x402-proof-pack-recording.txt',
  },
  {
    id: 'stripe-bridge-stablecoin-proof-pack',
    source: 'public-example',
    rail: 'stripe-bridge-stablecoin',
    status: 'passed',
    title: 'Stripe ACP / Bridge proof pack blocks unsafe checkout and stablecoin settlement',
    summary: 'Doctor fails unsafe agentic checkout and Bridge-style stablecoin movement, passes the patched checkBeforePayment path, and proves CI enforcement for Stripe and stablecoin flows.',
    href: 'https://x402ms.ai/stripe-bridge-stablecoin-proof-pack-recording.txt',
  },
  {
    id: 'card-network-agent-pay-proof-pack',
    source: 'public-example',
    rail: 'mastercard-agent-pay-visa-intelligent-commerce',
    status: 'passed',
    title: 'Mastercard Agent Pay / Visa Intelligent Commerce proof pack blocks unsafe tokenized checkout',
    summary: 'Doctor fails unsafe tokenized card-agent checkout, passes the patched checkBeforePayment path, and proves CI enforcement for Mastercard and Visa agent-commerce flows.',
    href: 'https://x402ms.ai/card-network-agent-pay-proof-pack-recording.txt',
  },
];
const SENSITIVE_KEYS = [
  'source',
  'code',
  'file',
  'files',
  'path',
  'paths',
  'wallet',
  'address',
  'payTo',
  'resourceUrl',
  'url',
  'endpoint',
  'amount',
  'apiKey',
  'secret',
  'token',
];
const DISCOVERY_SENSITIVE_KEYS = [
  'sourceCode',
  'code',
  'file',
  'files',
  'wallet',
  'address',
  'payTo',
  'resourceUrl',
  'rawUrl',
  'url',
  'endpoint',
  'amount',
  'apiKey',
  'secret',
  'token',
  'email',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'monarch-doctor-run' }, request);
    }

    if (request.method === 'GET' && url.pathname === '/summary') {
      return summary(request, env, url);
    }

    if (request.method === 'GET' && url.pathname === '/proof') {
      return proof(request, env, url);
    }

    if (request.method === 'POST' && url.pathname === '/doctor-run') {
      return recordDoctorRun(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/discovery-event') {
      return recordDiscoveryEvent(request, env);
    }

    if (request.method !== 'POST') {
      return json({ error: 'not_found' }, request, 404);
    }

    return json({ error: 'not_found' }, request, 404);
  },
};

async function recordDoctorRun(request, env) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'payload_too_large' }, request, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, request, 400);
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return json({ error: validationError }, request, 400);
  }

  if (!env.DB) {
    return json({ accepted: true, stored: false, reason: 'missing_db_binding' }, request, 202);
  }

  const receivedAt = new Date().toISOString();
  const eventDate = receivedAt.slice(0, 10);
  const runId = await sha256(`${payload.projectHash}:${payload.timestamp}:${payload.status}:${receivedAt}`);

  const detectedRails = normalizeDetectedRails(payload.detectedRails);
  const proofSource = payload.proofSource ?? 'external-reported';

  try {
    await env.DB.prepare(
      `INSERT INTO doctor_runs (
      id,
      received_at,
      event_date,
      project_hash,
      version,
      status,
      ci,
      strict,
      applicable,
      has_payment_flow,
      has_unprotected_payment_files,
      finding_count,
      sandbox_passed,
      detected_rails,
      proof_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      runId,
      receivedAt,
      eventDate,
      payload.projectHash,
      payload.version,
      payload.status,
      boolToInt(payload.ci),
      boolToInt(payload.strict),
      boolToInt(payload.applicable),
      boolToInt(payload.hasPaymentFlow),
      boolToInt(payload.hasUnprotectedPaymentFiles),
      Number(payload.findingCount ?? 0),
      boolToInt(payload.sandboxPassed),
      detectedRails.join(','),
      proofSource,
    ).run();
  } catch (error) {
    const message = String(error?.message ?? '');
    if (!message.includes('detected_rails') && !message.includes('proof_source')) throw error;

    await env.DB.prepare(
      `INSERT INTO doctor_runs (
        id,
        received_at,
        event_date,
        project_hash,
        version,
        status,
        ci,
        strict,
        applicable,
        has_payment_flow,
        has_unprotected_payment_files,
        finding_count,
        sandbox_passed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      runId,
      receivedAt,
      eventDate,
      payload.projectHash,
      payload.version,
      payload.status,
      boolToInt(payload.ci),
      boolToInt(payload.strict),
      boolToInt(payload.applicable),
      boolToInt(payload.hasPaymentFlow),
      boolToInt(payload.hasUnprotectedPaymentFiles),
      Number(payload.findingCount ?? 0),
      boolToInt(payload.sandboxPassed),
    ).run();
  }

  return json({ accepted: true, stored: true }, request, 202);
}

async function recordDiscoveryEvent(request, env) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'payload_too_large' }, request, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, request, 400);
  }

  const validationError = validateDiscoveryPayload(payload);
  if (validationError) {
    return json({ error: validationError }, request, 400);
  }

  if (!env.DB) {
    return json({ accepted: true, stored: false, reason: 'missing_db_binding' }, request, 202);
  }

  const receivedAt = new Date().toISOString();
  const eventDate = receivedAt.slice(0, 10);
  const eventId = await sha256(`${payload.eventName}:${payload.surface}:${payload.variant}:${payload.timestamp}:${receivedAt}`);

  await env.DB.prepare(
    `INSERT INTO discovery_events (
      id,
      received_at,
      event_date,
      event_name,
      surface,
      variant,
      language,
      languages,
      referrer_host,
      landing,
      intent,
      utm_source,
      utm_medium,
      utm_campaign
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    eventId,
    receivedAt,
    eventDate,
    limit(payload.eventName, 40),
    limit(payload.surface, 80),
    limit(payload.variant, 20),
    limit(payload.language, 24),
    limit(Array.isArray(payload.languages) ? payload.languages.join(',') : '', 160),
    limit(payload.referrerHost ?? '', 120),
    limit(payload.landing ?? '', 160),
    limit(payload.intent ?? '', 120),
    limit(payload.utmSource ?? '', 80),
    limit(payload.utmMedium ?? '', 80),
    limit(payload.utmCampaign ?? '', 80),
  ).run();

  return json({ accepted: true, stored: true }, request, 202);
}

async function summary(request, env, url) {
  const expectedToken = env.MONARCH_ADMIN_TOKEN;
  const suppliedToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!expectedToken || suppliedToken !== expectedToken) {
    return json({ error: 'unauthorized' }, request, 401);
  }

  if (!env.DB) {
    return json({ error: 'missing_db_binding' }, request, 503);
  }

  const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const dailyDoctorRuns = await env.DB.prepare(
    `SELECT
      COUNT(*) as runs,
      COUNT(DISTINCT project_hash) as unique_projects,
      SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_runs,
      SUM(CASE WHEN has_payment_flow = 1 THEN 1 ELSE 0 END) as payment_flow_runs
    FROM doctor_runs
    WHERE event_date = ?`,
  ).bind(date).first();

  const discovery = await env.DB.prepare(
    `SELECT
      COUNT(*) as events,
      COUNT(DISTINCT language) as languages,
      SUM(CASE WHEN event_name = 'cta_click' THEN 1 ELSE 0 END) as cta_clicks
    FROM discovery_events
    WHERE event_date = ?`,
  ).bind(date).first();

  const topDiscovery = await env.DB.prepare(
    `SELECT intent, language, variant, COUNT(*) as events
    FROM discovery_events
    WHERE event_date = ?
    GROUP BY intent, language, variant
    ORDER BY events DESC
    LIMIT 20`,
  ).bind(date).all();

  return json({ date, doctorRuns: dailyDoctorRuns, discovery, topDiscovery: topDiscovery.results ?? [] }, request);
}

async function proof(request, env, url) {
  const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const empty = publicProofPayload(date, {}, [], [], []);

  if (!env.DB) {
    return json({ ...empty, stored: false, reason: 'missing_db_binding' }, request);
  }

  try {
    const totals = await env.DB.prepare(
      `SELECT
        COUNT(*) as total_runs,
        COUNT(DISTINCT project_hash) as unique_projects,
        SUM(CASE WHEN proof_source = 'internal-dogfood' THEN 1 ELSE 0 END) as internal_dogfood_runs,
        SUM(CASE WHEN proof_source = 'public-example' THEN 1 ELSE 0 END) as reported_public_example_runs,
        SUM(CASE WHEN proof_source = 'external-reported' OR proof_source IS NULL OR proof_source = '' THEN 1 ELSE 0 END) as external_reported_runs,
        SUM(CASE WHEN ci = 1 THEN 1 ELSE 0 END) as ci_runs,
        SUM(CASE WHEN ci = 0 THEN 1 ELSE 0 END) as reported_local_runs,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_runs,
        SUM(CASE WHEN status IN ('failed', 'failed_no_payment_flow') THEN 1 ELSE 0 END) as blocked_or_failed_runs,
        SUM(CASE WHEN has_unprotected_payment_files = 1 THEN 1 ELSE 0 END) as unsafe_paths_blocked
      FROM doctor_runs
      WHERE event_date = ?`,
    ).bind(date).first();

    const byStatus = await env.DB.prepare(
      `SELECT status, COUNT(*) as runs
      FROM doctor_runs
      WHERE event_date = ?
      GROUP BY status
      ORDER BY runs DESC`,
    ).bind(date).all();

    const bySource = await env.DB.prepare(
      `SELECT COALESCE(NULLIF(proof_source, ''), 'external-reported') as source, COUNT(*) as runs
      FROM doctor_runs
      WHERE event_date = ?
      GROUP BY source
      ORDER BY runs DESC`,
    ).bind(date).all();

    const rows = await env.DB.prepare(
      `SELECT detected_rails
      FROM doctor_runs
      WHERE event_date = ? AND detected_rails != ''`,
    ).bind(date).all();

    return json(publicProofPayload(
      date,
      totals,
      byStatus.results ?? [],
      bySource.results ?? [],
      railCounts(rows.results ?? []),
    ), request);
  } catch {
    const fallbackTotals = await env.DB.prepare(
      `SELECT
        COUNT(*) as total_runs,
        COUNT(DISTINCT project_hash) as unique_projects,
        SUM(CASE WHEN ci = 1 THEN 1 ELSE 0 END) as ci_runs,
        SUM(CASE WHEN ci = 0 THEN 1 ELSE 0 END) as reported_local_runs,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_runs,
        SUM(CASE WHEN status IN ('failed', 'failed_no_payment_flow') THEN 1 ELSE 0 END) as blocked_or_failed_runs,
        SUM(CASE WHEN has_unprotected_payment_files = 1 THEN 1 ELSE 0 END) as unsafe_paths_blocked
      FROM doctor_runs
      WHERE event_date = ?`,
    ).bind(date).first();

    const fallbackStatus = await env.DB.prepare(
      `SELECT status, COUNT(*) as runs
      FROM doctor_runs
      WHERE event_date = ?
      GROUP BY status
      ORDER BY runs DESC`,
    ).bind(date).all();

    return json({
      ...publicProofPayload(date, fallbackTotals, fallbackStatus.results ?? [], [], []),
      schemaUpgradeRequired: true,
    }, request);
  }
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'payload_must_be_object';
  }

  for (const field of REQUIRED_FIELDS) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return `missing_${field}`;
    }
  }

  for (const key of Object.keys(payload)) {
    if (!ALLOWED_DOCTOR_FIELDS.has(key)) {
      return `unexpected_field_${key}`;
    }

    // Known Doctor fields are aggregate metadata only; raw paths, wallet addresses, URLs, and secrets are rejected as unexpected fields.
  }

  if (payload.event !== 'doctor_run' || payload.tool !== 'monarch-doctor') {
    return 'invalid_event';
  }

  if (!/^[a-f0-9]{24}$/.test(payload.projectHash)) {
    return 'invalid_project_hash';
  }

  if (!['passed', 'failed', 'no_payment_flow_detected', 'failed_no_payment_flow'].includes(payload.status)) {
    return 'invalid_status';
  }

  if (Number(payload.findingCount ?? 0) < 0 || Number(payload.findingCount ?? 0) > 10000) {
    return 'invalid_finding_count';
  }

  if (payload.proofSource !== undefined && !ALLOWED_PROOF_SOURCES.has(payload.proofSource)) {
    return 'invalid_proof_source';
  }

  if (payload.detectedRails !== undefined) {
    if (!Array.isArray(payload.detectedRails) || payload.detectedRails.length > ALLOWED_RAILS.size) {
      return 'invalid_detected_rails';
    }

    for (const rail of payload.detectedRails) {
      if (!ALLOWED_RAILS.has(rail)) return `invalid_detected_rail_${rail}`;
    }
  }

  return null;
}

function validateDiscoveryPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'payload_must_be_object';
  }

  for (const field of DISCOVERY_REQUIRED_FIELDS) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return `missing_${field}`;
    }
  }

  for (const key of Object.keys(payload)) {
    if (DISCOVERY_SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      return `sensitive_field_${key}`;
    }
  }

  if (payload.event !== 'discovery_event') {
    return 'invalid_event';
  }

  if (!['page_view', 'cta_click'].includes(payload.eventName)) {
    return 'invalid_event_name';
  }

  if (!['a', 'b'].includes(payload.variant)) {
    return 'invalid_variant';
  }

  return null;
}

function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://x402ms.ai';

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
  };
}

function json(body, request, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

function boolToInt(value) {
  return value === true ? 1 : 0;
}

function limit(value, maxLength) {
  return String(value ?? '').slice(0, maxLength);
}

function normalizeDetectedRails(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((rail) => ALLOWED_RAILS.has(rail)))].sort();
}

function railCounts(rows) {
  const counts = new Map();

  for (const row of rows) {
    for (const rail of String(row.detected_rails ?? '').split(',')) {
      if (!rail) continue;
      counts.set(rail, (counts.get(rail) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([rail, runs]) => ({ rail, runs }))
    .sort((a, b) => b.runs - a.runs || a.rail.localeCompare(b.rail));
}

function publicProofPayload(date, totals = {}, byStatus = [], bySource = [], byRail = []) {
  return {
    date,
    generatedAt: new Date().toISOString(),
    interpretation: {
      internalDogfood: 'Monarch-run proof-of-function. Counts show that we can reproduce Doctor locally and in CI.',
      publicExamples: 'Public unsafe examples showing blocked -> patched -> passed behavior.',
      externalReported: 'Opt-in reports from outside Monarch. These are the strongest proof-of-demand signal.',
    },
    counters: {
      totalRuns: numberOrZero(totals.total_runs),
      uniqueProjects: numberOrZero(totals.unique_projects),
      internalDogfoodRuns: numberOrZero(totals.internal_dogfood_runs),
      publicExampleRuns: PUBLIC_PROOF_EXAMPLES.length + numberOrZero(totals.reported_public_example_runs),
      externalReportedRuns: numberOrZero(totals.external_reported_runs),
      reportedLocalRuns: numberOrZero(totals.reported_local_runs),
      ciRuns: numberOrZero(totals.ci_runs),
      passedRuns: numberOrZero(totals.passed_runs),
      blockedOrFailedRuns: numberOrZero(totals.blocked_or_failed_runs),
      unsafePathsBlocked: numberOrZero(totals.unsafe_paths_blocked),
    },
    byStatus,
    bySource,
    byRail,
    examples: PUBLIC_PROOF_EXAMPLES,
    shareableProofUrl: 'https://x402ms.ai/#proof',
    installCommand: 'npx @monarch-shield/x402 doctor',
  };
}

function numberOrZero(value) {
  return Number(value ?? 0);
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
