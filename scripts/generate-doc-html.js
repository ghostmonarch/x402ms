#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'public/read');

const docs = [
  ['partner-proof-packs', 'Partner Proof Packs', 'public/docs/partner-proof-packs.md'],
  ['monarch-for-base-x402', 'Base x402 Proof Pack', 'public/docs/monarch-for-base-x402.md'],
  ['monarch-for-coinbase-agentkit', 'Coinbase AgentKit Proof Pack', 'public/docs/monarch-for-coinbase-agentkit.md'],
  ['monarch-for-virtuals-acp', 'Virtuals ACP Proof Pack', 'public/docs/monarch-for-virtuals-acp.md'],
  ['monarch-for-google-ap2-a2a-x402', 'Google AP2 / A2A x402 Proof Pack', 'public/docs/monarch-for-google-ap2-a2a-x402.md'],
  ['monarch-for-stripe-bridge-stablecoin', 'Stripe / Bridge Proof Pack', 'public/docs/monarch-for-stripe-bridge-stablecoin.md'],
  ['monarch-for-card-network-agent-pay', 'Mastercard / Visa Proof Pack', 'public/docs/monarch-for-card-network-agent-pay.md'],
  ['agent-payment-query-map', 'Agent Query Map', 'public/docs/agent-payment-query-map.md'],
  ['multilingual-agent-payment-query-map', 'Multilingual Query Map', 'public/docs/multilingual-agent-payment-query-map.md'],
  ['x402-payment-safety', 'x402 Safety', 'public/docs/x402-payment-safety.md'],
  ['real-x402-integration', 'Real x402 Pattern', 'public/docs/real-x402-integration.md'],
  ['monarch-doctor-ci', 'CI Gate', 'public/docs/monarch-doctor-ci.md'],
  ['north-star', 'Agent North Star', 'public/north-star.txt'],
  ['agents', 'Agent Instructions', 'AGENTS.md'],
  ['llms', 'llms.txt', 'public/llms.txt'],
];

mkdirSync(outDir, { recursive: true });

for (const [slug, title, source] of docs) {
  const sourcePath = join(root, source);
  const text = readFileSync(sourcePath, 'utf8');
  const body = source.endsWith('.md') ? renderMarkdown(text) : `<pre>${escapeHtml(text)}</pre>`;
  writeFileSync(join(outDir, `${slug}.html`), page(title, body, source));
}

console.log(`Generated ${docs.length} static doc pages in ${outDir}`);

function page(title, body, source) {
  const nav = docs.map(([slug, label]) => `<a href="/read/${slug}.html">${escapeHtml(label)}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | Monarch Shield</title>
  <meta name="description" content="${escapeHtml(title)} for Monarch Shield agent payment safety." />
  <link rel="icon" type="image/svg+xml" href="/logo/monarch-shield-logo.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${inlineCss()}</style>
</head>
<body>
  <header><a class="brand" href="/">Monarch</a><nav><a href="/">Home</a><a href="/#proof">Proof</a><a href="/read/partner-proof-packs.html">Proof Packs</a></nav></header>
  <main>
    <aside><span>Documentation</span>${nav}</aside>
    <article><div class="meta"><span>${escapeHtml(title)}</span><a href="/#docs">Back to docs index</a></div>${body}</article>
  </main>
</body>
</html>`;
}

function renderMarkdown(text) {
  const html = [];
  let inCode = false;
  let listOpen = false;

  for (const line of text.split('\n')) {
    if (line.startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        closeList();
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
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${renderInline(bullet[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');

  function closeList() {
    if (!listOpen) return;
    html.push('</ul>');
    listOpen = false;
  }
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${docHref(href)}">${label}</a>`);
}

function docHref(href) {
  const match = href.match(/^\/?docs\/([^#)]+)\.md(#.*)?$/);
  if (match) return `/read/${match[1]}.html${match[2] ?? ''}`;
  return href;
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
    :root{--dark:#080808;--cream:#EDECE4;--muted:rgba(8,8,8,.58);--border:rgba(8,8,8,.1);font-family:Outfit,-apple-system,BlinkMacSystemFont,sans-serif}
    *{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--dark);line-height:1.7}
    header{height:72px;background:var(--dark);color:var(--cream);display:flex;align-items:center;justify-content:space-between;padding:0 48px;position:sticky;top:0}
    .brand{font-weight:800;font-size:1.35rem;letter-spacing:-.02em;color:inherit;text-decoration:none}header nav{display:flex;gap:28px}header nav a{color:rgba(237,236,228,.62);text-decoration:none;font-weight:600}
    main{max-width:1440px;margin:0 auto;padding:56px 48px 104px;display:grid;grid-template-columns:300px minmax(0,820px);gap:72px}
    aside{position:sticky;top:104px;border:1px solid var(--border);background:rgba(8,8,8,.03);padding:24px;align-self:start}aside span{display:block;color:var(--muted);font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px}aside a{display:block;color:var(--muted);text-decoration:none;font-weight:650;padding:9px 10px;border-radius:6px}aside a:hover{background:var(--dark);color:var(--cream)}
    article{min-width:0}.meta{display:flex;justify-content:space-between;gap:24px;padding-bottom:20px;margin-bottom:32px;border-bottom:1px solid var(--border);color:var(--muted);font-weight:650;font-size:.9rem}.meta a{color:inherit;text-underline-offset:4px}
    h1{font-size:clamp(2.5rem,5vw,4.25rem);line-height:1.02;letter-spacing:-.045em;margin:0 0 28px}h2{font-size:clamp(1.75rem,3vw,2.35rem);line-height:1.12;letter-spacing:-.03em;margin:48px 0 18px}h3{font-size:1.25rem;margin:34px 0 12px}
    p,li{font-size:1.0625rem;color:rgba(8,8,8,.72)}ul{margin:14px 0 28px 22px}a{color:inherit;text-underline-offset:4px}code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.92em;padding:.1em .35em;border-radius:4px;background:rgba(8,8,8,.08)}
    pre{overflow:auto;margin:22px 0 32px;padding:22px;border-radius:6px;background:var(--dark);color:var(--cream)}pre code{padding:0;background:transparent;color:inherit}
    @media(max-width:900px){header{padding:0 24px}header nav{gap:14px}main{grid-template-columns:1fr;padding:36px 24px 80px}aside{position:static}.meta{flex-direction:column}}
  `;
}
