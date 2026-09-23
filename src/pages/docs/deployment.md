---
layout: ../../layouts/Docs.astro
title: Deployment
description: Run AI with UI on a NAS or server with persistent data and one-click updates.
---

# Deployment

AI with UI is a single public image, so it runs anywhere Docker does — a NAS
(ASUSTOR, Synology, Unraid), a home server, or a small VM. This page covers a
durable setup with persistent data and one-click updates.

## A complete stack

```yaml
services:
  ai-with-ui:
    image: ghcr.io/jmavieira/ai-with-ui:latest
    container_name: ai-with-ui
    restart: unless-stopped
    init: true
    network_mode: host
    labels:
      com.centurylinklabs.watchtower.enable: "true"
    environment:
      AIUI_PROJECTS_DIR: /projects
      AIUI_VAULT_KEY: ${AIUI_VAULT_KEY}
      AIUI_UPDATE_URL: http://127.0.0.1:8080/v1/update
      AIUI_UPDATE_TOKEN: ${AIUI_UPDATE_TOKEN}
      PORT: "3701"
    volumes:
      - ./projects:/projects
      - ./vault:/home/node/.aiui/vault

  updater:
    image: containrrr/watchtower:1.7.1
    container_name: ai-with-ui-updater
    restart: unless-stopped
    command: --label-enable --cleanup --http-api-update
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      WATCHTOWER_HTTP_API_TOKEN: ${AIUI_UPDATE_TOKEN}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

Set two secrets in your environment (or your NAS's stack settings):

- **`AIUI_VAULT_KEY`** — a long random string that encrypts stored credentials
  and connection tokens.
- **`AIUI_UPDATE_TOKEN`** — any long random string, shared by the Studio and the
  updater so the in-Studio **Update** button works.

## Persistent data

Everything you care about is on mounted volumes, independent of the image:

- `./projects` — your projects (and the seeded examples).
- `./vault` — the Studio's own store: the owner login, credentials, connection
  tokens and agent conversations, all sealed with AES-256-GCM under
  `AIUI_VAULT_KEY`. Your project files stay plain files in `./my-project`, by
  design — that is what lets agents, editors and Git work on them — so encrypt
  that volume at the disk level if the machine is shared.

Updating or replacing the image never touches these.

## One-click updates

The Studio's **Update** button calls the Watchtower HTTP API to pull the latest
image and recreate the container. Because the image follows `:latest`, you can
also let Watchtower update on a schedule. Your volumes persist across the
recreate, so no data is lost.

## HTTPS and remote access

Keep the container bound to the loopback or your LAN, and put HTTPS in front of
it rather than exposing the port directly:

- A reverse proxy (Caddy, nginx, Traefik) that terminates TLS, or
- A private overlay network (for example a Tailscale sidecar) so only your own
  devices can reach the Studio.

An HTTPS origin is also what the OAuth connectors need for their redirect, so a
proxy or overlay is the recommended way to reach the Studio from outside the
LAN.

## Sign-in

To keep a deployment private, enable sign-in from the Studio's account menu:
create an owner account, and the Studio then requires signing in. It is off by
default (the Studio is open to anyone who can reach it), and the owner-only
controls (connections, credentials, updates) stay restricted either way.
