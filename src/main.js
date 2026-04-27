import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#nav');
  const discovery = initDiscovery();
  initProof();
  initDemo();

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        nav?.classList.remove('open');
        toggle?.classList.remove('active');
        toggle?.setAttribute('aria-expanded', 'false');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('[data-discovery-cta]').forEach((element) => {
    element.addEventListener('click', () => {
      reportDiscovery('cta_click', discovery, {
        surface: element.getAttribute('data-discovery-cta') ?? 'unknown',
      });
    });
  });
});

function initDemo() {
  const code = document.querySelector('[data-demo-code]');
  const result = document.querySelector('[data-demo-result]');
  const status = document.querySelector('[data-demo-status]');
  const buttons = document.querySelectorAll('[data-demo-mode]');
  if (!code || !result || !status || buttons.length === 0) return;

  const states = {
    unsafe: {
      status: 'Blocked',
      decision: 'BLOCK',
      detail: 'Payment flow has no Monarch check before funds move.',
      code: `await wallet.send({
  payTo: userProvidedAddress,
  amount: "2500",
  asset: "USDC"
});`,
    },
    patched: {
      status: 'Passed',
      decision: 'PASS',
      detail: 'Monarch check runs before signing or sending payment.',
      code: `await checkBeforePayment({
  payTo,
  amount: "2500",
  asset: "USDC",
  intent: "creator payout"
}, () => wallet.send(payment));`,
    },
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-demo-mode');
      const state = states[mode] ?? states.unsafe;

      buttons.forEach((item) => item.classList.toggle('active', item === button));
      code.textContent = state.code;
      status.textContent = state.status;
      result.innerHTML = `<strong>${state.decision}</strong><span>${state.detail}</span>`;
      result.dataset.state = mode;
    });
  });
}

function initDiscovery() {
  const variant = discoveryVariant();
  const intent = discoveryIntent();
  const language = navigator.language || 'unknown';
  const languages = Array.isArray(navigator.languages) ? navigator.languages.slice(0, 5) : [language];

  document.documentElement.dataset.discoveryVariant = variant;
  applyVariantCopy(variant);

  const discovery = {
    variant,
    intent,
    language,
    languages,
    referrerHost: referrerHost(),
    landing: window.location.pathname || '/',
    utmSource: safeParam('utm_source'),
    utmMedium: safeParam('utm_medium'),
    utmCampaign: safeParam('utm_campaign'),
  };

  reportDiscovery('page_view', discovery);
  return discovery;
}

function discoveryVariant() {
  const key = 'monarch.discovery.variant';
  const existing = window.localStorage?.getItem(key);
  if (existing === 'a' || existing === 'b') return existing;

  const variant = Math.random() < 0.5 ? 'a' : 'b';
  window.localStorage?.setItem(key, variant);
  return variant;
}

function discoveryIntent() {
  return safeParam('intent')
    || safeParam('utm_content')
    || inferIntentFromPath(window.location.pathname)
    || 'homepage';
}

function inferIntentFromPath(pathname) {
  if (pathname.includes('paid-mcp')) return 'paid-mcp-safety';
  if (pathname.includes('payto')) return 'payto-wallet-safety';
  if (pathname.includes('base')) return 'base-usdc-preflight';
  if (pathname.includes('x402')) return 'x402-payment-safety';
  if (pathname.includes('agent-payment')) return 'agent-payment-preflight';
  if (pathname.includes('monarch-doctor-ci')) return 'payment-ci-gate';
  return '';
}

function applyVariantCopy(variant) {
  document.querySelectorAll('[data-variant-a][data-variant-b]').forEach((element) => {
    element.textContent = element.getAttribute(variant === 'a' ? 'data-variant-a' : 'data-variant-b');
  });
}

function reportDiscovery(eventName, discovery, overrides = {}) {
  const payload = {
    event: 'discovery_event',
    eventName,
    surface: overrides.surface ?? 'homepage',
    variant: discovery.variant,
    language: discovery.language,
    languages: discovery.languages,
    referrerHost: discovery.referrerHost,
    landing: discovery.landing,
    intent: discovery.intent,
    utmSource: discovery.utmSource,
    utmMedium: discovery.utmMedium,
    utmCampaign: discovery.utmCampaign,
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('https://monarch-doctor-run.ghostmonarchalerts.workers.dev/discovery-event', new Blob([body], { type: 'application/json' }));
    return;
  }

  fetch('https://monarch-doctor-run.ghostmonarchalerts.workers.dev/discovery-event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

function safeParam(name) {
  const value = new URLSearchParams(window.location.search).get(name);
  if (!value) return '';
  return value.replace(/[^a-z0-9._:-]/gi, '-').slice(0, 80);
}

function referrerHost() {
  if (!document.referrer) return '';

  try {
    return new URL(document.referrer).hostname.slice(0, 120);
  } catch {
    return '';
  }
}

function initProof() {
  const proofSection = document.querySelector('#proof');
  if (!proofSection) return;

  fetch('https://monarch-doctor-run.ghostmonarchalerts.workers.dev/proof', {
    headers: { accept: 'application/json' },
  })
    .then((response) => {
      if (!response.ok) throw new Error('proof_unavailable');
      return response.json();
    })
    .then(renderProof)
    .catch(() => {
      const updated = document.querySelector('[data-proof-updated]');
      if (updated) {
        updated.textContent = 'Live counters are temporarily unavailable. Public examples remain reproducible from the links above.';
      }
    });
}

function renderProof(proof) {
  const counters = proof.counters ?? {};
  document.querySelectorAll('[data-proof-counter]').forEach((element) => {
    const key = element.getAttribute('data-proof-counter');
    element.textContent = formatCount(counters[key] ?? 0);
  });

  const rails = document.querySelector('[data-proof-rails]');
  if (rails && Array.isArray(proof.byRail) && proof.byRail.length > 0) {
    rails.replaceChildren(...proof.byRail.map((item) => {
      const rail = document.createElement('span');
      rail.textContent = `${railLabel(item.rail)} ${formatCount(item.runs)}`;
      return rail;
    }));
  }

  const examples = document.querySelector('[data-proof-examples]');
  if (examples && Array.isArray(proof.examples) && proof.examples.length > 0) {
    examples.replaceChildren(...proof.examples.map((example) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = example.href;
      link.textContent = example.title;
      item.append(link);
      return item;
    }));
  }

  const updated = document.querySelector('[data-proof-updated]');
  if (updated) {
    updated.textContent = `Live aggregate proof updated ${new Date(proof.generatedAt).toLocaleString()}. Dogfood is labeled separately from external reported use.`;
  }
}

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(Number(value ?? 0));
}

function railLabel(rail) {
  const labels = {
    'x402': 'x402',
    'paid_mcp': 'paid MCP',
    'agentkit': 'AgentKit',
    'stripe': 'Stripe',
    'stablecoin': 'stablecoin',
    'wallet': 'wallet',
    'card': 'card',
    'bank': 'bank',
    'regional_rail': 'regional rail',
  };

  return labels[rail] ?? rail;
}
