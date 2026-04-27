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
  'sandboxPassed',
]);
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

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
