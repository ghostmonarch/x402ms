import './style.css';

const docs = [
  ['partner-proof-packs', 'Partner Proof Packs', '/docs/partner-proof-packs.md'],
  ['monarch-for-base-x402', 'Base x402 Proof Pack', '/docs/monarch-for-base-x402.md'],
  ['monarch-for-coinbase-agentkit', 'Coinbase AgentKit Proof Pack', '/docs/monarch-for-coinbase-agentkit.md'],
  ['monarch-for-virtuals-acp', 'Virtuals ACP Proof Pack', '/docs/monarch-for-virtuals-acp.md'],
  ['monarch-for-google-ap2-a2a-x402', 'Google AP2 / A2A x402 Proof Pack', '/docs/monarch-for-google-ap2-a2a-x402.md'],
  ['monarch-for-stripe-bridge-stablecoin', 'Stripe / Bridge Proof Pack', '/docs/monarch-for-stripe-bridge-stablecoin.md'],
  ['monarch-for-card-network-agent-pay', 'Mastercard / Visa Proof Pack', '/docs/monarch-for-card-network-agent-pay.md'],
  ['agent-payment-query-map', 'Agent Query Map', '/docs/agent-payment-query-map.md'],
  ['multilingual-agent-payment-query-map', 'Multilingual Query Map', '/docs/multilingual-agent-payment-query-map.md'],
  ['x402-payment-safety', 'x402 Safety', '/docs/x402-payment-safety.md'],
  ['real-x402-integration', 'Real x402 Pattern', '/docs/real-x402-integration.md'],
  ['monarch-doctor-ci', 'CI Gate', '/docs/monarch-doctor-ci.md'],
  ['north-star', 'Agent North Star', '/north-star.txt'],
  ['agents', 'Agent Instructions', '/AGENTS.md'],
  ['llms', 'llms.txt', '/llms.txt'],
];

const docMap = new Map(docs.map(([id, title, path]) => [id, { id, title, path }]));

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  renderNav();
  loadDoc(selectedDoc());
});

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function selectedDoc() {
  const raw = new URLSearchParams(window.location.search).get('doc') ?? 'partner-proof-packs';
  const id = raw.replace(/^\/?docs\//, '').replace(/\.md$|\.txt$/g, '').toLowerCase();
  return docMap.get(id) ?? docMap.get('partner-proof-packs');
}

function renderNav() {
  const nav = document.querySelector('[data-doc-nav]');
  if (!nav) return;

  nav.replaceChildren(...docs.map(([id, title]) => {
    const link = document.createElement('a');
    link.href = `/docs.html?doc=${id}`;
    link.textContent = title;
    if (selectedDoc()?.id === id) link.classList.add('active');
    return link;
  }));
}

async function loadDoc(doc) {
  const content = document.querySelector('[data-doc-content]');
  const kicker = document.querySelector('[data-doc-kicker]');

  if (!doc || !content) return;
  document.title = `${doc.title} | Monarch Shield`;
  if (kicker) kicker.textContent = doc.title;

  try {
    const response = await fetch(doc.path, { headers: { accept: 'text/plain' } });
    if (!response.ok) throw new Error('doc_unavailable');
    const text = await response.text();
    content.innerHTML = renderDocument(text, doc.path);
  } catch {
    content.innerHTML = '<h1>Document unavailable</h1><p>This Monarch doc could not be loaded. Return to the proof-pack index and try again.</p>';
  }
}

function renderDocument(text, path) {
  if (!path.endsWith('.md')) {
    return `<pre>${escapeHtml(text)}</pre>`;
  }

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
  if (match) return `/docs.html?doc=${match[1]}${match[2] ?? ''}`;

  const rootDoc = href.match(/^\/?(AGENTS|llms|north-star)\.(md|txt)(#.*)?$/i);
  if (rootDoc) return `/docs.html?doc=${rootDoc[1].toLowerCase()}${rootDoc[3] ?? ''}`;

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
