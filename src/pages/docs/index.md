---
layout: ../../layouts/Docs.astro
title: Overview
description: What AI with UI is and how the pieces fit together.
---

# AI with UI

AI with UI is a workspace — self-hosted, or [hosted by us](/docs/hosted/) —
where a **project is a folder of files** —
Markdown and JSON — that both a person and an AI agent can work in. A person
uses the **Studio**, a clean web UI that renders the folder as dashboards,
tables, calendars and boards. An agent (Claude Code or Codex) works in the same
folder from its terminal. There is no database and no sync: the files are the
single source of truth.

## The pieces

- **The project folder.** Your records live as Markdown-with-frontmatter or
  JSON under a directory you own. Nothing is hidden in a database.
- **The manifest.** A single `ai-with-ui.yaml` declares the UI: which files are
  which content type, and which views (dashboard, table, calendar) to render.
- **The Studio.** A web app that projects the folder into a UI and hosts agent
  terminals. It never invents state — it reflects the files.
- **Connectors.** Optional first-party integrations — Gmail and Notion today,
  with more on the way — give the agent read-only tools while the access token
  stays server-side. A Pro feature (see [pricing](/pricing/)).
- **Encryption at rest.** Everything the Studio stores in its database —
  project files on the hosted service, agent conversations, credentials and
  connection tokens — is sealed with AES-256-GCM under a key that exists only
  for that workspace. Secrets are kept out of Git and out of the agent's reach.

## Why it's built this way

Because files are portable, diffable, and equally legible to a person, an agent,
and Git. The UI is a projection you can change at any time by editing the
manifest; the data outlives any particular tool.

Continue with the [getting-started guide](/docs/getting-started/), the
[hosted service](/docs/hosted/), the [manifest reference](/docs/manifest-reference/),
or [deployment](/docs/deployment/).
