# aiwithui.net

Marketing + docs site for **AI with UI**, built with [Astro](https://astro.build)
and deployed on **Cloudflare Pages**.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
```

## Build

```bash
npm run build    # static output in ./dist
```

## Deploy on Cloudflare Pages

Create a Pages project from this repo with:

- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Then add `aiwithui.net` and `www.aiwithui.net` as custom domains (SSL is
automatic). Content lives in `src/pages/` (landing in `index.astro`, docs as
Markdown under `src/pages/docs/`).

## Support form (email delivery)

`/support/` posts to `POST /api/contact`, handled by the small Worker in
`worker/index.js` (everything else is served from `dist` via the `ASSETS`
binding). Submissions are sent through **Resend** (the account the Studio also
uses), from `CONTACT_FROM` to `CONTACT_TO` with the visitor as Reply-To, so
answering the email answers them. Setup:

1. `RESEND_API_KEY` as a **secret** on the Cloudflare project (Settings →
   Variables and Secrets). Never commit it.
2. `CONTACT_FROM` (`noreply@aiwithui.net`) must be on a domain verified in
   Resend; `aiwithui.net` is.
3. `CONTACT_TO` (`info@aiwithui.net`) is received by Cloudflare **Email
   Routing** (the domain's MX), so it needs a routing rule forwarding it to a
   real inbox.

The form has a honeypot field; if spam becomes a problem, add a Cloudflare WAF
rate-limiting rule on `/api/contact` or wire in Turnstile.

Local test: put `RESEND_API_KEY=…` in `.dev.vars` (git-ignored), run
`npm run dev:worker`, and submit the form at http://localhost:8787/support/ —
it sends for real.
