// Cloudflare Worker that fronts the static site (./dist via the ASSETS binding)
// and adds one endpoint: POST /api/contact, which emails the support form to
// the inbox configured in wrangler.jsonc using Cloudflare Email Workers.
//
// Requirements (one-time, in the Cloudflare dashboard):
//   1. Email Routing enabled for aiwithui.net.
//   2. CONTACT_TO must be a verified destination address in Email Routing
//      (or routed to one), otherwise send() is rejected.
//   3. CONTACT_FROM must be an address on the routed domain.
import { EmailMessage } from "cloudflare:email";

const TOPICS = ["Question", "Support", "Bug report", "Pro license", "Hosted waitlist", "Other"];
const LIMITS = { name: 120, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const reply = (status, body, redirectTo) => {
    if (wantsJson) {
      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return Response.redirect(new URL(redirectTo, request.url).href, 303);
  };

  // Only accept same-origin posts (the form on /support/).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return reply(403, { ok: false, error: "Cross-origin requests are not allowed." }, "/support/?error=origin");
  }

  let fields;
  try {
    fields = await readFields(request);
  } catch {
    return reply(400, { ok: false, error: "Could not read the form." }, "/support/?error=invalid");
  }

  // Honeypot: real users never see or fill this field. Pretend success for bots.
  if (fields.website) {
    return reply(200, { ok: true }, "/support/?sent=1");
  }

  const name = clean(fields.name, LIMITS.name);
  const email = clean(fields.email, LIMITS.email);
  const message = (fields.message || "").toString().trim().slice(0, LIMITS.message);
  const topic = TOPICS.includes(fields.topic) ? fields.topic : "Question";

  if (!name || !email || !message) {
    return reply(400, { ok: false, error: "Name, email and message are required." }, "/support/?error=missing");
  }
  if (!EMAIL_RE.test(email)) {
    return reply(400, { ok: false, error: "That email address doesn't look valid." }, "/support/?error=email");
  }

  const to = env.CONTACT_TO;
  const from = env.CONTACT_FROM;
  if (!to || !from || !env.CONTACT_EMAIL) {
    console.error("contact form: CONTACT_TO / CONTACT_FROM / CONTACT_EMAIL binding not configured");
    return reply(500, { ok: false, error: "The contact form is not configured yet." }, "/support/?error=server");
  }

  const subject = `[aiwithui.net] ${topic} from ${name}`;
  const body = [
    `Topic:   ${topic}`,
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Sent:    ${new Date().toISOString()}`,
    `Country: ${request.headers.get("cf-ipcountry") || "unknown"}`,
    `Page:    ${request.headers.get("referer") || "unknown"}`,
    "",
    "Message:",
    "",
    message,
    "",
  ].join("\n");

  const raw = buildMime({ from, fromName: "AI with UI website", to, replyTo: email, subject, body, domain: from.split("@")[1] });

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(from, to, raw));
  } catch (err) {
    console.error("contact form: send failed", err);
    return reply(502, { ok: false, error: "We couldn't send your message. Please email us directly." }, "/support/?error=send");
  }

  return reply(200, { ok: true }, "/support/?sent=1");
}

async function readFields(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const data = await request.json();
    return data && typeof data === "object" ? data : {};
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

// Single-line, header-safe string: strips CR/LF so nothing can inject headers.
function clean(value, max) {
  return (value ?? "").toString().replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

// Minimal RFC 5322 message with UTF-8 support, no external dependency.
function buildMime({ from, fromName, to, replyTo, subject, body, domain }) {
  const id = `<${crypto.randomUUID()}@${domain}>`;
  return [
    `From: ${encodeWord(fromName)} <${from}>`,
    `To: <${to}>`,
    `Reply-To: <${replyTo}>`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${id}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(body).replace(/(.{76})/g, "$1\r\n"),
    "",
  ].join("\r\n");
}

// RFC 2047 encoded-word for non-ASCII header values; plain ASCII passes through.
function encodeWord(text) {
  return /^[\x20-\x7e]*$/.test(text) ? text : `=?utf-8?B?${base64(text)}?=`;
}

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
