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
      # Serve every subfolder of /projects as its own project.
      AIUI_PROJECTS_DIR: /projects
      # A long secret that encrypts stored credentials and connection tokens.
      AIUI_VAULT_KEY: change-me-to-a-long-random-string
    volumes:
      - ./projects:/projects
      - ./vault:/home/node/.aiui/vault
```

Then start it and open the Studio in your browser:

```bash
docker compose up -d
# open http://localhost:3700
```

The first run seeds a couple of example projects so you have something to look
at. Drop your own folder into `./projects/<name>` with an `ai-with-ui.yaml` and
it appears in the project switcher.

## Single project

To serve just one folder, set `AIUI_PROJECT` instead of `AIUI_PROJECTS_DIR`:

```yaml
    environment:
      AIUI_PROJECT: /project
    volumes:
      - ./my-project:/project
```

## What to configure

- **`AIUI_VAULT_KEY`** — required to store credentials or connect Gmail/Notion.
  Keep it safe; losing it makes stored secrets unrecoverable.
- **Connectors** — set `AIUI_GOOGLE_CLIENT_ID` / `_SECRET` for Gmail, or connect
  Notion with an internal-integration token pasted into the Studio.
- **User management** — optional; enable it from the Studio's account menu to
  require sign-in and grant per-user, per-project access.

## Keeping it updated

The image follows `:latest`. Pair it with a watchtower-style updater, or use the
Studio's built-in **Update** button, for one-click updates. See
[deployment](/docs/deployment/) for a complete stack with updates wired up.
