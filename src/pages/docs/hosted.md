---
layout: ../../layouts/Docs.astro
title: The hosted service
description: Use AI with UI without running anything — sign up, bring your own model key, and import your projects.
---

# The hosted service

If you would rather not run a container, use the hosted service at
[app.aiwithui.net](https://app.aiwithui.net). It is the same Studio, run by
us: hosting, updates and backups are taken care of, and every workspace has
its own encryption key and its own projects.

## Signing up

Go to [app.aiwithui.net/signup](https://app.aiwithui.net/signup), name your
workspace, and choose the email and password of its owner account. New
workspaces are **approved by hand** before they can be used, usually within a
day; until then the page says so and you can sign out and come back. You will
know it is ready when signing in opens the Studio instead of the waiting
screen.

## Bring your own model key

The hosted service never resells model usage. Your agents run on **your own
Anthropic or OpenAI API key**, which you add in **Settings → Models** once the
workspace is approved: an org-wide key for everyone in the workspace, and
optionally a personal key that takes precedence for your own sessions. The key
is sealed with the workspace's encryption key and is never shown again.

The hosted Studio runs the API-backed agents (Claude and OpenAI models). The
terminal-based Claude Code and Codex agents, the agent-driven browser and the
file watcher need a real machine and are only available self-hosted.

## Projects, members and what is included

- **Projects.** Create as many as you like from the project switcher; each is
  set up by an agent from a short description, exactly as self-hosted.
- **Members.** The owner can add members with a login of their own and choose
  which projects each may open, from **Settings → Members**.
- **Connectors.** The first-party connectors (Gmail, Notion) are included; the
  access tokens stay server-side, sealed under your workspace's key.

## Moving a project in or out

A project travels as one zip, and the hosted service and a self-hosted Studio
read the same archive:

1. In the Studio that has the project, click the **download icon** next to the
   project name (or run `aiui export <folder>` on a project on disk). The
   archive holds every file: the manifest, the agent instructions, all records,
   documents and attachments.
2. In the Studio that should receive it, click the **upload icon** next to the
   project name — or, on a brand-new hosted workspace, use the *bring a
   project with you* form on the first screen — and drop the zip in. The
   project opens ready to use; nothing is re-generated.

The same steps move a project from the hosted service back to a folder, so
your data is never locked in.

## Your data

Everything the hosted service stores for a workspace is **encrypted at rest**
before it is written to the database, under a key that exists only for that
workspace:

- **Project files** — every record, document and attachment, sealed with
  AES-256-GCM. The revision token the editor uses to detect conflicts is a
  keyed digest, so it does not reveal whether a file equals a known document.
- **Agent conversations** — the chat feed, the model conversation state, the
  log and any queued message.
- **Secrets** — passwords, model API keys, connection tokens and credential
  vault entries.
- **Sessions** — the database holds only a digest of each session id, so a
  copy of it cannot be turned into a login.

Each workspace's key is itself wrapped by one key for the deployment, kept
outside the database. A backup, a database dump or a database console
therefore yields no file, no conversation, no secret and no usable cookie.
What stays readable is what lookups need: email addresses, workspace and
project names, file paths and sizes, timestamps, and who owns what. The
service itself can of course read your data while it serves you — this is
encryption against access to the database, not against the service.

Deleting a workspace deletes its key, and with it everything sealed under it.
Project files are stored in the same format the self-hosted Studio uses, which
is what makes [moving a project out](#moving-a-project-in-or-out) possible.
