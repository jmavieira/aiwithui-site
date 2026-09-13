---
layout: ../../layouts/Docs.astro
title: Getting started
description: Run AI with UI in a container and open the Studio.
---

# Getting started

AI with UI ships as one public Docker image. You need Docker (or any container
host — a NAS, a VM, a laptop).

## Run it

Create a `docker-compose.yaml`:

```yaml
services:
  ai-with-ui:
    image: ghcr.io/jmavieira/ai-with-ui:latest
    container_name: ai-with-ui
    restart: unless-stopped
    network_mode: host
    environment:
      # The folder to serve as your project.
      AIUI_PROJECT: /project
      # A long secret that encrypts stored credentials and connection tokens.
      AIUI_VAULT_KEY: change-me-to-a-long-random-string
    volumes:
      - ./my-project:/project
      - ./vault:/home/node/.aiui/vault
```

Then start it and open the Studio in your browser:

```bash
docker compose up -d
# open http://localhost:3700
```

The first run seeds an example project so you have something to look at. Point
`AIUI_PROJECT` at your own folder (containing an `ai-with-ui.yaml`) to use your
own data.

## Multiple projects (Pro)

Serving several projects at once — with a project switcher — is a Pro feature.
With a license, set `AIUI_PROJECTS_DIR` to a folder whose subdirectories are each
a project (see [pricing](/pricing/)):

```yaml
    environment:
      AIUI_PROJECTS_DIR: /projects
    volumes:
      - ./projects:/projects
```

## What to configure

- **`AIUI_VAULT_KEY`** — required to store credentials or connect Gmail/Notion.
  Keep it safe; losing it makes stored secrets unrecoverable.
- **Connectors (Pro)** — set `AIUI_GOOGLE_CLIENT_ID` / `_SECRET` for Gmail, or
  connect Notion with a pasted integration token. Gmail and Notion today, with
  more connectors on the way.
- **Sign-in** — optionally protect the Studio with an owner account and password,
  from the Studio's account menu. Off by default (open on your network).
- **Pro license** — unlock multi-project, browser tools and connectors by
  entering a license key at `/license`. See [pricing](/pricing/).

## Keeping it updated

The image follows `:latest`. Pair it with a watchtower-style updater, or use the
Studio's built-in **Update** button, for one-click updates. See
[deployment](/docs/deployment/) for a complete stack with updates wired up.
