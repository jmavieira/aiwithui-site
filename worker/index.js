// Cloudflare Worker that fronts the static site (./dist via the ASSETS binding)
// and adds one endpoint: POST /api/contact, which emails the support form to
// CONTACT_TO through Resend (https://resend.com), with the visitor as Reply-To.
//
// Requirements:
//   1. RESEND_API_KEY set as a secret on the Cloudflare project (Settings ->
//      Variables and Secrets); locally in .dev.vars.
//   2. CONTACT_FROM on a domain verified in Resend (aiwithui.net is).
//   3. CONTACT_TO must reach a real inbox: info@aiwithui.net is received by
//      Cloudflare Email Routing, so it needs a routing rule forwarding it.

const TOPICS = ["Question", "Support", "Bug report", "Pro license", "Hosted waitlist", "Other"];
const LIMITS = { name: 120, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sent with every response: HTTPS only, no framing, no sniffing, and a CSP
// that fits the static site (its own scripts and styles; the inline JSON-LD
// block is data, not script).
const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
};

function withSecurityHeaders(response) {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
  return secured;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return withSecurityHeaders(new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } }));
      }
      return withSecurityHeaders(await handleContact(request, env));
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request));
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

  // Only accept same-origin posts (the form on /support/); a missing Origin is
  // refused too. This stops other sites posting through a visitor's browser;
  // a script can still send any Origin, which the rate limit below handles.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return reply(403, { ok: false, error: "Cross-origin requests are not allowed." }, "/support/?error=origin");
  }

  // Per-client limit (Cloudflare's rate limiter), so the inbox and the email
  // quota cannot be flooded.
  if (env.CONTACT_LIMITER) {
    const key = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.CONTACT_LIMITER.limit({ key });
    if (!success) return reply(429, { ok: false, error: "Too many messages. Try again in a minute." }, "/support/?error=rate");
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
  if (!to || !from || !env.RESEND_API_KEY) {
    console.error("contact form: CONTACT_TO / CONTACT_FROM / RESEND_API_KEY not configured");
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

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: `AI with UI website <${from}>`, to: [to], reply_to: email, subject, text: body }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.message || `Resend answered ${res.status}`);
    }
  } catch (err) {
    // The provider's reason goes to the log, not to the visitor.
    console.error("contact form: send failed", err);
    return reply(502, { ok: false, error: "We couldn't send your message." }, "/support/?error=send");
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
