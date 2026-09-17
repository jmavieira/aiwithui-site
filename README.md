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
binding). Submissions are delivered with Cloudflare **Email Workers**, so there
is no third-party email API or key. One-time setup in the Cloudflare dashboard:

1. **Email → Email Routing** for `aiwithui.net`: enable it and add the DNS
   records it asks for.
2. Add the real inbox that should receive support mail as a **verified
   destination address**, and create a routing rule `info@aiwithui.net → that
   inbox`. The `send_email` binding can only deliver to verified destinations,
   so `CONTACT_TO` in `wrangler.jsonc` must be (or route to) one of them.
3. Deploy with `npm run deploy` (builds, then `wrangler deploy`).

To change the recipient or the sender, edit `CONTACT_TO`, `CONTACT_FROM` and
the binding's `destination_address` in `wrangler.jsonc`. The form has a
honeypot field; if spam becomes a problem, add a Cloudflare WAF rate-limiting
rule on `/api/contact` or wire in Turnstile.

Local test: `npm run dev:worker` then submit the form at
http://localhost:8787/support/ — in local mode wrangler logs the message
instead of sending it.
