# Monarch Shield — Deployment Guide

## Prerequisites

- Node.js 20+
- GitHub repository created for this project
- DNS access for `x402ms.ai`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output is written to `dist/`. Preview locally with:

```bash
npm run preview
```

## GitHub Pages Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<YOUR_ORG>/x402ms.git
git push -u origin main
```

### 2. Enable GitHub Pages via Actions

1. Go to **Settings → Pages** in the repository.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. The workflow at `.github/workflows/deploy-pages.yml` will run automatically on every push to `main`.

### 3. Configure Custom Domain

1. In **Settings → Pages → Custom domain**, enter `x402ms.ai`.
2. Click **Save**. GitHub will verify DNS and issue a TLS certificate.
3. Check **Enforce HTTPS** once the certificate is ready (usually within minutes).

### 4. DNS Records for x402ms.ai

Since `x402ms.ai` is an apex (root) domain, configure these DNS records at your registrar or DNS provider:

#### A Records (apex domain → GitHub Pages)

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

#### CNAME Record (www subdomain)

| Type | Name | Value |
|------|------|-------|
| CNAME | www | `<YOUR_ORG>.github.io` |

#### Optional: Domain Verification TXT Record

To verify domain ownership in GitHub (recommended for security):

1. Go to **GitHub → Settings → Pages → Verified domains**.
2. Add `x402ms.ai`.
3. GitHub will provide a TXT record to add to your DNS. Example:

| Type | Name | Value |
|------|------|-------|
| TXT | _github-pages-challenge-`<YOUR_ORG>` | `<verification-code>` |

### 5. Verify Deployment

After DNS propagation (can take up to 48 hours, usually much faster):

- https://x402ms.ai should serve the site
- https://www.x402ms.ai should redirect to the apex domain
- The GitHub Actions tab should show a green deployment

## One-Time Repository Settings

1. **Settings → Pages → Source**: GitHub Actions
2. **Settings → Pages → Custom domain**: `x402ms.ai`
3. **Settings → Pages → Enforce HTTPS**: Enabled
4. **Settings → Pages → Verified domains**: Add `x402ms.ai` (optional but recommended)

## Production URL Paths

| Path | Content |
|------|---------|
| `/` | Homepage |
| `/404.html` | Not-found fallback (redirects to `/`) |

## File Structure

```
x402ms/
├── .github/workflows/deploy-pages.yml   # CI/CD pipeline
├── public/
│   ├── CNAME                             # Custom domain for GitHub Pages
│   ├── 404.html                          # Fallback page
│   └── logo/
│       ├── monarch-shield-logo.png       # Logo raster
│       └── monarch-shield-logo.svg       # Logo vector
├── src/
│   ├── main.js                           # Entry JS (nav, smooth scroll)
│   └── style.css                         # Full design system + layout
├── index.html                            # Homepage
├── vite.config.js                        # Build configuration
├── package.json                          # Dependencies
└── DEPLOY.md                             # This file
```
