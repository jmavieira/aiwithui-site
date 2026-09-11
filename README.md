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
