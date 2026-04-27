#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outputDirs = [join(root, 'public/docs'), join(root, 'public/read')];

const docs = [
  {
    slug: 'partner-proof-packs',
    title: 'Partner Proof Packs',
    group: 'Proof Packs',
    source: 'public/docs/partner-proof-packs.md',
    description: 'Index of reproducible Monarch proof packs across agent-payment ecosystems.',
  },
  {
    slug: 'adversarial-benchmark',
    title: 'Adversarial Benchmark',
    group: 'Proof Packs',
    source: 'public/docs/adversarial-benchmark.md',
    description: 'Public benchmark showing what Doctor catches and what it does not claim to prove.',
  },
  {
    slug: 'hosted-proof',
    title: 'Hosted Proof',
    group: 'Start',
    source: 'public/docs/hosted-proof.md',
    description: 'Opt-in project proof for reported Doctor runs with a strict privacy boundary.',
  },
  {
    slug: 'grant-evidence',
    title: 'Grant Evidence Packet',
    group: 'Proof Packs',
    source: 'public/docs/grant-evidence.md',
    description: 'A reviewer-ready packet for grants, ecosystem support, and partnership diligence.',
  },
  {
    slug: 'free-tier-pricing',
    title: 'Free Tier And Pricing',
    group: 'Start',
    source: 'public/docs/free-tier-pricing.md',
    description: 'Supabase-style free tier and paid proof, policy, team, and runtime ladder.',
  },
  {
    slug: 'ecosystem-grants',
    title: 'Ecosystem Grant Pages',
    group: 'Grant Pages',
    source: 'public/docs/ecosystem-grants.md',
    description: 'Reviewer entry point for ecosystem-specific grant and support pages.',
  },
  {
    slug: 'grant-base-coinbase',
    title: 'Base / Coinbase Grant Page',
    group: 'Grant Pages',
    source: 'public/docs/grant-base-coinbase.md',
    description: 'Grant support page for Base x402, Coinbase AgentKit, and agentic wallet safety.',
  },
  {
    slug: 'grant-virtuals-acp',
    title: 'Virtuals ACP Grant Page',
    group: 'Grant Pages',
    source: 'public/docs/grant-virtuals-acp.md',
    description: 'Grant support page for Virtuals ACP agent-to-agent payment safety.',
  },
  {
    slug: 'grant-google-ap2-a2a',
    title: 'Google AP2 / A2A Grant Page',
    group: 'Grant Pages',
    source: 'public/docs/grant-google-ap2-a2a.md',
    description: 'Grant support page for AP2, A2A, and x402-style agent payment payload safety.',
  },
  {
    slug: 'grant-stripe-bridge',
    title: 'Stripe / Bridge Grant Page',
    group: 'Grant Pages',
    source: 'public/docs/grant-stripe-bridge.md',
    description: 'Grant support page for Stripe checkout and Bridge stablecoin payment safety.',
  },
  {
    slug: 'grant-mastercard-visa',
    title: 'Mastercard / Visa Grant Page',
    group: 'Grant Pages',
    source: 'public/docs/grant-mastercard-visa.md',
    description: 'Grant support page for tokenized card-agent and delegated commerce safety.',
  },
  {
    slug: 'x-money-creator-commerce',
    title: 'X Money / Creator Commerce',
    group: 'Grant Pages',
    source: 'public/docs/x-money-creator-commerce.md',
    description: 'Proof concept for X Money, creator payouts, and agent-controlled commerce.',
  },
  {
    slug: 'monarch-for-base-x402',
    title: 'Base x402 Proof Pack',
    group: 'Proof Packs',
    source: 'public/docs/monarch-for-base-x402.md',
    description: 'Monarch preflight for Base x402 and USDC payment paths.',
  },
  {
    slug: 'monarch-for-coinbase-agentkit',
    title: 'Coinbase AgentKit Proof Pack',
    group: 'Proof Packs',
    source: 'public/docs/monarch-for-coinbase-agentkit.md',
    description: 'Monarch preflight for AgentKit and Agentic Wallet spend flows.',
  },
  {
    slug: 'monarch-for-virtuals-acp',
    title: 'Virtuals ACP Proof Pack',
    group: 'Proof Packs',
    source: 'public/docs/monarch-for-virtuals-acp.md',
    description: 'Monarch preflight for Virtuals ACP USDC escrow flows.',
  },
  {
    slug: 'monarch-for-google-ap2-a2a-x402',
    title: 'Google AP2 / A2A x402 Proof Pack',
    group: 'Proof Packs',
    source: 'public/docs/monarch-for-google-ap2-a2a-x402.md',
    description: 'Monarch preflight for AP2, A2A, and x402 payment payloads.',
  },
  {
    slug: 'monarch-for-stripe-bridge-stablecoin',
    title: 'Stripe / Bridge Stablecoin Proof Pack',
    group: 'Proof Packs',
    source: 'public/docs/monarch-for-stripe-bridge-stablecoin.md',
    description: 'Monarch preflight for Stripe ACP checkout and Bridge stablecoin settlement.',
  },
  {
    slug: 'monarch-for-card-network-agent-pay',
    title: 'Mastercard / Visa Proof Pack',
    group: 'Proof Packs',
    source: 'public/docs/monarch-for-card-network-agent-pay.md',
    description: 'Monarch preflight for tokenized card-agent payment flows.',
  },
  {
    slug: 'agent-payment-preflight',
    title: 'Agent Payment Preflight',
    group: 'Implementation',
    source: 'public/docs/agent-payment-preflight.md',
    description: 'General preflight pattern for agent-controlled money movement.',
  },
  {
    slug: 'x402-payment-safety',
    title: 'x402 Payment Safety',
    group: 'Implementation',
    source: 'public/docs/x402-payment-safety.md',
    description: 'Safety rules for HTTP 402, X-PAYMENT, and x402 payment flows.',
  },
  {
    slug: 'paid-mcp-payment-safety',
    title: 'Paid MCP Payment Safety',
    group: 'Implementation',
    source: 'public/docs/paid-mcp-payment-safety.md',
    description: 'Safety checks for paid MCP tools and paid agent actions.',
  },
  {
    slug: 'payto-wallet-safety',
    title: 'payTo Wallet Safety',
    group: 'Implementation',
    source: 'public/docs/payto-wallet-safety.md',
    description: 'Wallet destination pinning and pre-payment checks for pay-to flows.',
  },
  {
    slug: 'base-x402-preflight',
    title: 'Base x402 Preflight',
    group: 'Implementation',
    source: 'public/docs/base-x402-preflight.md',
    description: 'Base-specific preflight pattern for x402 and USDC.',
  },
  {
    slug: 'real-x402-integration',
    title: 'Real x402 Pattern',
    group: 'Implementation',
    source: 'public/docs/real-x402-integration.md',
    description: 'A concrete x402 client integration pattern with Monarch checks.',
  },
  {
    slug: 'monarch-doctor-ci',
    title: 'CI Gate',
    group: 'Operations',
    source: 'public/docs/monarch-doctor-ci.md',
    description: 'How to add Monarch Doctor as a merge gate.',
  },
  {
    slug: 'github-action',
    title: 'GitHub Action',
    group: 'Operations',
    source: 'public/docs/github-action.md',
    description: 'Copy-paste GitHub Action for Monarch Doctor payment safety gates.',
  },
  {
    slug: 'agent-payment-query-map',
    title: 'Agent Query Map',
    group: 'Discovery',
    source: 'public/docs/agent-payment-query-map.md',
    description: 'Agent search intents that should resolve to Monarch Doctor.',
  },
  {
    slug: 'multilingual-agent-payment-query-map',
    title: 'Multilingual Query Map',
    group: 'Discovery',
    source: 'public/docs/multilingual-agent-payment-query-map.md',
    description: 'Non-English agent-payment discovery coverage.',
  },
  {
    slug: 'agent-to-agent-payment-safety',
    title: 'Agent-to-Agent Payment Safety',
    group: 'Discovery',
    source: 'public/docs/agent-to-agent-payment-safety.md',
    description: 'Exact-match guide for agents building safe agent-to-agent payment stacks.',
  },
  {
    slug: 'ai-agent-payment-safety',
    title: 'AI Agent Payment Safety',
    group: 'Discovery',
    source: 'public/docs/ai-agent-payment-safety.md',
    description: 'Short action doc for agents searching how to let AI agents pay safely.',
  },
  {
    slug: 'ai-agent-payment-preflight',
    title: 'AI Agent Payment Preflight',
    group: 'Discovery',
    source: 'public/docs/ai-agent-payment-preflight.md',
    description: 'Exact-match preflight page for AI agents that can move money.',
  },
  {
    slug: 'before-shipping-payment-code',
    title: 'Before Shipping Payment Code',
    group: 'Discovery',
    source: 'public/docs/before-shipping-payment-code.md',
    description: 'Short action doc for preflight checks before AI-generated payment code ships.',
  },
  {
    slug: 'payment-code-ci-gate',
    title: 'Payment Code CI Gate',
    group: 'Discovery',
    source: 'public/docs/payment-code-ci-gate.md',
    description: 'Exact-match CI gate page for unsafe payment code scanning and SARIF.',
  },
  {
    slug: 'x402-payment-ci-gate',
    title: 'x402 Payment CI Gate',
    group: 'Discovery',
    source: 'public/docs/x402-payment-ci-gate.md',
    description: 'Exact-match CI gate page for x402, HTTP 402, and X-PAYMENT safety.',
  },
  {
    slug: 'wallet-send-preflight',
    title: 'Wallet Send Preflight',
    group: 'Discovery',
    source: 'public/docs/wallet-send-preflight.md',
    description: 'Short action doc for wallet.send, sendTransaction, and transferUSDC safety.',
  },
  {
    slug: 'wallet-send-safety-check',
    title: 'wallet.send Safety Check',
    group: 'Discovery',
    source: 'public/docs/wallet-send-safety-check.md',
    description: 'Exact-match page for wallet.send, sendTransaction, and wallet safety checks.',
  },
  {
    slug: 'stripe-agent-payment-preflight',
    title: 'Stripe Agent Payment Preflight',
    group: 'Discovery',
    source: 'public/docs/stripe-agent-payment-preflight.md',
    description: 'Short action doc for Stripe agent payment safety.',
  },
  {
    slug: 'paid-api-mcp-preflight',
    title: 'Paid API And MCP Preflight',
    group: 'Discovery',
    source: 'public/docs/paid-api-mcp-preflight.md',
    description: 'Short action doc for paid API, paid MCP, and metered tool safety.',
  },
  {
    slug: 'paid-mcp-payment-preflight',
    title: 'Paid MCP Payment Preflight',
    group: 'Discovery',
    source: 'public/docs/paid-mcp-payment-preflight.md',
    description: 'Exact-match page for paid MCP tool and MCP payment preflight searches.',
  },
  {
    slug: 'endpoint-registry-vs-payment-code-preflight',
    title: 'Endpoint Registry vs Payment Code Preflight',
    group: 'Positioning',
    source: 'public/docs/endpoint-registry-vs-payment-code-preflight.md',
    description: 'Careful comparison of endpoint discovery and payment-code preflight.',
  },
  {
    slug: 'budget-controls-vs-payment-code-preflight',
    title: 'Budget Controls vs Payment Code Preflight',
    group: 'Positioning',
    source: 'public/docs/budget-controls-vs-payment-code-preflight.md',
    description: 'Careful comparison of runtime spend controls and build-time payment-code preflight.',
  },
  {
    slug: 'north-star',
    title: 'Agent North Star',
    group: 'Agent Files',
    source: 'public/north-star.txt',
    description: 'The shortest decision rule for when agents must run Monarch.',
  },
  {
    slug: 'agents',
    title: 'Agent Instructions',
    group: 'Agent Files',
    source: 'AGENTS.md',
    description: 'Build-time instructions for coding agents.',
  },
  {
    slug: 'llms',
    title: 'llms.txt',
    group: 'Agent Files',
    source: 'public/llms.txt',
    description: 'Canonical LLM-facing product index.',
  },
  {
    slug: 'agent-skill',
    title: 'Agent Skill',
    group: 'Agent Files',
    source: 'public/docs/agent-skill.md',
    description: 'Monarch agent-payment safety skill install and usage instructions.',
  },
  {
    slug: 'agent-discovery-build-plan',
    title: 'Build Plan',
    group: 'Operations',
    source: 'public/docs/agent-discovery-build-plan.md',
    description: 'Remaining build plan for MCP server, hosted proof, team policy, and runtime enforcement.',
  },
  {
    slug: 'openapi',
    title: 'Proof API Contract',
    group: 'Operations',
    source: 'public/openapi.yaml',
    description: 'OpenAPI contract for proof and telemetry endpoints.',
  },
];

for (const dir of outputDirs) mkdirSync(dir, { recursive: true });

const pages = docs.map((doc) => {
  const text = readFileSync(join(root, doc.source), 'utf8');
  const isMarkdown = doc.source.endsWith('.md');
  const isPlainText = doc.source.endsWith('.txt') || doc.source.endsWith('.yaml');
  const body = isMarkdown ? renderMarkdown(text) : renderPlainText(text, isPlainText ? doc.source : '');
  const html = page(doc, body);

  for (const dir of outputDirs) {
    writeFileSync(join(dir, `${doc.slug}.html`), html);
  }

  return {
    slug: doc.slug,
    title: doc.title,
    group: doc.group,
    description: doc.description,
    html: `/docs/${doc.slug}.html`,
    raw: rawUrl(doc.source),
  };
});

const docsHome = page(
  {
    slug: 'index',
    title: 'Monarch Docs',
    group: 'Start',
    source: 'generated',
    description: 'Official Monarch Shield documentation for agent payment safety.',
  },
  docsIndexBody(),
);

for (const dir of outputDirs) {
  writeFileSync(join(dir, 'index.html'), docsHome);
}

writeFileSync(join(root, 'public/docs/manifest.json'), `${JSON.stringify({
  name: 'Monarch Shield Docs',
  generatedAt: new Date().toISOString(),
  canonical: 'https://x402ms.ai/docs/',
  docs: pages,
}, null, 2)}\n`);

writeFileSync(join(root, 'public/sitemap.xml'), sitemap(pages));

console.log(`Generated ${docs.length} docs into /docs and /read`);

function page(doc, body) {
  const nav = groupedDocs()
    .map(([group, groupDocs]) => `<section><h2>${escapeHtml(group)}</h2>${groupDocs.map((item) => `<a ${item.slug === doc.slug ? 'class="active"' : ''} href="/docs/${item.slug}.html"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('')}</section>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(doc.title)} | Monarch Shield Docs</title>
  <meta name="description" content="${escapeHtml(doc.description)}" />
  <link rel="icon" type="image/svg+xml" href="/logo/monarch-shield-logo.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${inlineCss()}</style>
</head>
<body>
  <header>
    <a class="brand" href="/">Monarch</a>
    <nav>
      <a href="/">Home</a>
      <a href="/proof/">Proof</a>
      <a href="/docs/">Docs</a>
      <a href="/docs/openapi.html">API</a>
    </nav>
  </header>
  <main>
    <aside>
      <a class="docs-home" href="/docs/">Monarch Docs</a>
      ${nav}
    </aside>
    <article>
      <div class="meta"><span>${escapeHtml(doc.group)}</span><span>Raw agent sources are listed in /docs/manifest.json</span></div>
      ${body}
    </article>
  </main>
</body>
</html>`;
}

function docsIndexBody() {
  const groups = groupedDocs()
    .map(([group, groupDocs]) => `<section class="doc-cards"><h2>${escapeHtml(group)}</h2>${groupDocs.map((doc) => `<a class="doc-card" href="/docs/${doc.slug}.html"><strong>${escapeHtml(doc.title)}</strong><span>${escapeHtml(doc.description)}</span></a>`).join('')}</section>`)
    .join('');

  return `<h1>Monarch Shield Docs</h1>
<p class="lead">Official documentation for the local-first payment safety gate agents run before agent-controlled money moves.</p>
<div class="exec-panel">
  <strong>Executive read:</strong>
  Monarch is not a payment processor, wallet, marketplace, or fraud vendor. Today it is a local and CI preflight gate for code that can initiate payments across x402, wallets, stablecoins, cards, bank rails, paid APIs, and paid MCP tools.
</div>
${groups}`;
}

function groupedDocs() {
  const groups = [];
  for (const doc of docs) {
    let entry = groups.find(([group]) => group === doc.group);
    if (!entry) {
      entry = [doc.group, []];
      groups.push(entry);
    }
    entry[1].push(doc);
  }
  return groups;
}

function renderMarkdown(text) {
  const html = [];
  let inCode = false;
  let listOpen = false;
  let orderedListOpen = false;

  for (const line of text.split('\n')) {
    if (line.startsWith('```')) {
      closeLists();
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      closeLists();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      if (!listOpen) {
        closeOrderedList();
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${renderInline(bullet[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (!orderedListOpen) {
        closeUnorderedList();
        html.push('<ol>');
        orderedListOpen = true;
      }
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeLists();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');

  function closeLists() {
    closeUnorderedList();
    closeOrderedList();
  }

  function closeUnorderedList() {
    if (!listOpen) return;
    html.push('</ul>');
    listOpen = false;
  }

  function closeOrderedList() {
    if (!orderedListOpen) return;
    html.push('</ol>');
    orderedListOpen = false;
  }
}

function renderPlainText(text) {
  return `<pre>${escapeHtml(text)}</pre>`;
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${docHref(href)}">${label}</a>`);
}

function docHref(href) {
  const match = href.match(/^\/?docs\/([^#)]+)\.md(#.*)?$/);
  if (match) return `/docs/${match[1]}.html${match[2] ?? ''}`;
  return href;
}

function rawUrl(source) {
  if (source === 'generated') return '/docs/manifest.json';
  return `/${source.replace(/^public\//, '')}`;
}

function sitemap(pages) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    '/',
    '/proof/',
    '/proof/proof.json',
    '/docs/',
    '/llms.txt',
    '/llms-full.txt',
    '/AGENTS.md',
    '/faq.txt',
    '/cli.txt',
    '/skills.txt',
    '/proof.txt',
    '/openapi.yaml',
    '/doctor-demo-recording.txt',
    '/base-x402-proof-pack-recording.txt',
    '/coinbase-agentkit-proof-pack-recording.txt',
    '/virtuals-acp-proof-pack-recording.txt',
    '/google-ap2-a2a-x402-proof-pack-recording.txt',
    '/stripe-bridge-stablecoin-proof-pack-recording.txt',
    '/card-network-agent-pay-proof-pack-recording.txt',
    ...pages.map((page) => page.html),
    ...pages.map((page) => page.raw),
  ];

  const uniqueUrls = [...new Set(urls)];
  const body = uniqueUrls
    .map((url) => `  <url><loc>https://x402ms.ai${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineCss() {
  return `
    :root{--dark:#080808;--cream:#EDECE4;--cream-2:#E3E2DA;--muted:rgba(8,8,8,.6);--border:rgba(8,8,8,.1);font-family:Outfit,-apple-system,BlinkMacSystemFont,sans-serif}
    *{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--dark);line-height:1.7}
    header{height:72px;background:var(--dark);color:var(--cream);display:flex;align-items:center;justify-content:space-between;padding:0 48px;position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(237,236,228,.1)}
    .brand{font-weight:800;font-size:1.35rem;letter-spacing:-.02em;color:inherit;text-decoration:none}header nav{display:flex;gap:28px}header nav a{color:rgba(237,236,228,.64);text-decoration:none;font-weight:650}
    main{max-width:1480px;margin:0 auto;padding:56px 48px 104px;display:grid;grid-template-columns:340px minmax(0,860px);gap:72px;align-items:start}
    aside{position:sticky;top:104px;border:1px solid var(--border);background:rgba(8,8,8,.03);padding:22px;max-height:calc(100vh - 128px);overflow:auto}.docs-home{display:block;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:20px;color:var(--dark);text-decoration:none}
    aside section+section{margin-top:22px}aside h2{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}aside a:not(.docs-home){display:block;color:var(--muted);text-decoration:none;padding:10px;border-radius:6px}aside a strong{display:block;color:inherit;font-size:.94rem;line-height:1.25}aside a span{display:block;font-size:.78rem;line-height:1.35;margin-top:3px;color:rgba(8,8,8,.46)}aside a:hover,aside a.active{background:var(--dark);color:var(--cream)}aside a:hover span,aside a.active span{color:rgba(237,236,228,.58)}
    article{min-width:0}.meta{display:flex;justify-content:space-between;gap:24px;padding-bottom:20px;margin-bottom:32px;border-bottom:1px solid var(--border);color:var(--muted);font-weight:650;font-size:.9rem}.meta a{color:inherit;text-underline-offset:4px}
    h1{font-size:clamp(2.6rem,5vw,4.5rem);line-height:1.01;letter-spacing:-.05em;margin:0 0 28px}h2{font-size:clamp(1.65rem,3vw,2.35rem);line-height:1.12;letter-spacing:-.03em;margin:48px 0 18px}h3{font-size:1.25rem;margin:34px 0 12px}h4{font-size:1.05rem;margin:28px 0 10px}
    p,li{font-size:1.0625rem;color:rgba(8,8,8,.74)}.lead{font-size:1.28rem;color:rgba(8,8,8,.68);max-width:760px}ul,ol{margin:14px 0 28px 22px}a{color:inherit;text-underline-offset:4px}code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.92em;padding:.1em .35em;border-radius:4px;background:rgba(8,8,8,.08)}
    pre{overflow:auto;margin:22px 0 32px;padding:22px;border-radius:6px;background:var(--dark);color:var(--cream);line-height:1.7}pre code{padding:0;background:transparent;color:inherit}.exec-panel{border:1px solid var(--border);background:var(--cream-2);padding:22px 24px;margin:30px 0 34px;font-size:1.06rem;color:rgba(8,8,8,.72)}.exec-panel strong{color:var(--dark)}
    .doc-cards{margin-top:38px}.doc-cards h2{margin-bottom:14px}.doc-card{display:block;border:1px solid var(--border);padding:18px 20px;text-decoration:none;background:rgba(8,8,8,.025)}.doc-card+.doc-card{border-top:0}.doc-card strong{display:block;font-size:1.05rem}.doc-card span{display:block;color:var(--muted);margin-top:4px}
    @media(max-width:980px){header{padding:0 24px}header nav{gap:14px}main{grid-template-columns:1fr;padding:36px 24px 80px}aside{position:static;max-height:none}.meta{flex-direction:column}}
  `;
}
