const ALLOWED_PROPERTY_TYPES = new Set([
  "Home",
  "Business",
  "Multifamily / managed property"
]);

const ALLOWED_TOWNS = new Set([
  "Cranston", "Warwick", "Providence", "East Providence", "Johnston",
  "North Providence", "Pawtucket", "West Warwick", "Coventry",
  "East Greenwich", "North Kingstown", "Barrington", "Bristol", "Warren",
  "Seekonk", "Rehoboth", "Swansea", "Walpole", "Sharon", "Little Compton",
  "Other"
]);

const ALLOWED_CONNECTIONS = new Set(["Municipal sewer", "Septic", "Not sure"]);
const ALLOWED_TIMING = new Set(["Active backup now", "Today / next available", "Schedule ahead"]);
const ALLOWED_AUTHORITY = new Set(["Owner", "Authorized manager", "Tenant / employee"]);
const ATTRIBUTION_FIELDS = [
  "landing_page_url", "referrer", "first_landing_timestamp", "gclid", "gbraid",
  "wbraid", "campaign", "ad_group", "keyword", "match_type", "device",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"
];

function noStoreHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    ...extra
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: noStoreHeaders({ "Content-Type": "application/json; charset=utf-8" })
  });
}

function htmlResponse(title, message, status = 200) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} | Honest Drain</title><style>body{margin:0;padding:40px 20px;color:#17222c;background:#f3f6f4;font:17px/1.55 system-ui,sans-serif}.panel{max-width:620px;margin:5vh auto;padding:28px;background:#fff;border:1px solid #d6dee2;border-left:5px solid #087c82;border-radius:6px}h1{margin:0 0 14px;color:#101036;font-size:2rem;line-height:1.1}a{color:#171353;font-weight:800}p{margin:12px 0}</style></head><body><main class="panel"><h1>${safeTitle}</h1><p>${safeMessage}</p><p><a href="tel:14015935553">Call (401) 593-5553</a></p><p><a href="/main-sewer-line-cleaning/">Return to the main sewer service page</a></p></main></body></html>`;
  return new Response(html, {
    status,
    headers: noStoreHeaders({ "Content-Type": "text/html; charset=utf-8" })
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function clean(value, maxLength = 200) {
  return String(value || "").trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maxLength);
}

function digitsOnly(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function validSubmissionToken(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

async function parseRequestBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return request.json();
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

function validateAndNormalize(raw) {
  const data = {
    propertyType: clean(raw.property_type),
    symptoms: clean(raw.symptoms, 2000),
    town: clean(raw.town),
    sewerConnection: clean(raw.sewer_connection),
    timing: clean(raw.timing),
    authority: clean(raw.authority),
    name: clean(raw.name),
    phone: clean(raw.phone, 40),
    email: clean(raw.email, 254),
    company: clean(raw.company),
    attribution: {}
  };
  const errors = {};

  if (!ALLOWED_PROPERTY_TYPES.has(data.propertyType)) errors.property_type = "Choose a valid property type.";
  if (!data.symptoms) errors.symptoms = "Tell us what is backing up.";
  if (!ALLOWED_TOWNS.has(data.town)) errors.town = "Choose a valid property town.";
  if (!ALLOWED_CONNECTIONS.has(data.sewerConnection)) errors.sewer_connection = "Choose a valid sewer connection.";
  if (!ALLOWED_TIMING.has(data.timing)) errors.timing = "Choose a valid timing option.";
  if (!ALLOWED_AUTHORITY.has(data.authority)) errors.authority = "Choose a valid authority option.";
  if (!data.name) errors.name = "Enter your full name.";
  if (digitsOnly(data.phone).length !== 10) errors.phone = "Enter a valid 10-digit US phone number.";
  if (!isValidEmail(data.email)) errors.email = "Enter a valid email address or leave this blank.";

  ATTRIBUTION_FIELDS.forEach((field) => {
    data.attribution[field] = clean(raw[field], 500);
  });

  return { data, errors };
}

async function hashValue(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function enforceRateLimit(namespace, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `rate:${await hashValue(ip)}`;
  const current = Number(await namespace.get(key) || "0");
  if (current >= 5) return false;
  try {
    await namespace.put(key, String(current + 1), { expirationTtl: 600 });
    return true;
  } catch (_) {
    return false;
  }
}

async function sendOperationalLead(env, lead) {
  if (!env.MAIN_SEWER_LEAD_WEBHOOK_URL) {
    throw new Error("MAIN_SEWER_LEAD_WEBHOOK_URL is not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Honest-Drain-Lead-ID": lead.leadId
  };
  if (env.MAIN_SEWER_LEAD_WEBHOOK_SECRET) {
    headers.Authorization = `Bearer ${env.MAIN_SEWER_LEAD_WEBHOOK_SECRET}`;
  }

  const response = await fetch(env.MAIN_SEWER_LEAD_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(lead)
  });
  if (!response.ok) {
    throw new Error(`Lead webhook returned HTTP ${response.status}`);
  }
}

async function alertFailure(env, leadId, error) {
  if (!env.MAIN_SEWER_ERROR_WEBHOOK_URL) return;
  try {
    await fetch(env.MAIN_SEWER_ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "main-sewer-line-cleaning",
        leadId,
        error: clean(error && error.message, 300),
        timestamp: new Date().toISOString()
      })
    });
  } catch (_) {
    // The primary response remains a failure even when the alert destination is unavailable.
  }
}

function wantsJson(request) {
  return (request.headers.get("accept") || "").includes("application/json");
}

async function handlePost(context) {
  const { request, env } = context;
  const json = wantsJson(request);
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if ((origin && origin !== url.origin) || fetchSite === "cross-site") {
    return json
      ? jsonResponse({ ok: false, message: "The request origin was not accepted." }, 403)
      : htmlResponse("Request not accepted", "Please return to the service page and try again.", 403);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 30000) {
    return json
      ? jsonResponse({ ok: false, message: "The request was too large." }, 413)
      : htmlResponse("Request not accepted", "The submitted request was too large. Please call instead.", 413);
  }

  if (!env.MAIN_SEWER_LEADS) {
    await alertFailure(env, "not-created", new Error("MAIN_SEWER_LEADS KV binding is not configured"));
    return json
      ? jsonResponse({ ok: false, message: "Callback requests are temporarily unavailable. Please call instead." }, 503)
      : htmlResponse("Please call instead", "Callback requests are temporarily unavailable, and we did not confirm receipt.", 503);
  }

  if (!(await enforceRateLimit(env.MAIN_SEWER_LEADS, request))) {
    return json
      ? jsonResponse({ ok: false, message: "Too many requests. Please call or try again later." }, 429)
      : htmlResponse("Please call instead", "Too many callback requests were received from this connection.", 429);
  }

  let raw;
  try {
    raw = await parseRequestBody(request);
  } catch (_) {
    return json
      ? jsonResponse({ ok: false, message: "The request could not be read." }, 400)
      : htmlResponse("Request not accepted", "The submitted request could not be read. Your service request was not confirmed.", 400);
  }

  if (clean(raw.website)) {
    return json
      ? jsonResponse({ ok: true, leadId: "received" })
      : htmlResponse("Request received", "We received your request. This does not confirm dispatch. Honest Drain will call or text to confirm fit and current availability.");
  }

  const startedAt = Number(raw.form_started_at || "0");
  if (startedAt && Date.now() - startedAt < 1500) {
    return json
      ? jsonResponse({ ok: true, leadId: "received" })
      : htmlResponse("Request received", "We received your request. This does not confirm dispatch. Honest Drain will call or text to confirm fit and current availability.");
  }

  const { data, errors } = validateAndNormalize(raw);
  if (Object.keys(errors).length) {
    return json
      ? jsonResponse({ ok: false, message: "Check the highlighted fields and try again.", errors }, 422)
      : htmlResponse("Check your request", "Required details were missing or invalid. Return to the form and try again; your service request was not confirmed.", 422);
  }

  const suppliedToken = clean(raw.submission_token, 50);
  const submissionToken = validSubmissionToken(suppliedToken) ? suppliedToken : crypto.randomUUID();
  const leadId = `MSL-${submissionToken}`;
  const lead = {
    leadId,
    source: "main-sewer-line-cleaning",
    receivedAt: new Date().toISOString(),
    qualificationStatus: "pending_manual_verification",
    authorityUnconfirmed: data.authority === "Tenant / employee",
    ...data
  };
  const key = `lead:${leadId}`;
  const attemptKey = `lead-attempt:${leadId}`;

  const priorRecord = await env.MAIN_SEWER_LEADS.get(key);
  if (priorRecord) {
    try {
      const priorLead = JSON.parse(priorRecord);
      if (priorLead.deliveryStatus === "delivered") {
        return json
          ? jsonResponse({ ok: true, leadId, duplicate: true }, 200)
          : htmlResponse("Request received", "We received your request. This does not confirm dispatch. Honest Drain will call or text to confirm fit and current availability.");
      }
    } catch (_) {
      // A malformed prior record is replaced by the validated retry below.
    }
  }

  try {
    await env.MAIN_SEWER_LEADS.put(attemptKey, JSON.stringify({
      leadId,
      receivedAt: lead.receivedAt,
      deliveryStatus: "pending"
    }), {
      expirationTtl: 60 * 60 * 24 * 90
    });
    await sendOperationalLead(env, lead);
    await env.MAIN_SEWER_LEADS.put(key, JSON.stringify({ ...lead, deliveryStatus: "delivered" }), {
      expirationTtl: 60 * 60 * 24 * 90
    });
  } catch (error) {
    try {
      await env.MAIN_SEWER_LEADS.put(key, JSON.stringify({
        ...lead,
        deliveryStatus: "failed",
        deliveryError: clean(error.message, 300)
      }), { expirationTtl: 60 * 60 * 24 * 90 });
    } catch (_) {
      // The user-facing response still reports that receipt was not confirmed.
    }
    await alertFailure(env, leadId, error);
    return json
      ? jsonResponse({ ok: false, message: "We could not confirm delivery. Your entries are still available; please try again or call." }, 503)
      : htmlResponse("Receipt not confirmed", "We could not confirm delivery of your callback request. Please call or return to the form and try again.", 503);
  }

  return json
    ? jsonResponse({ ok: true, leadId }, 201)
    : htmlResponse("Request received", "We received your request. This does not confirm dispatch. Honest Drain will call or text to confirm fit and current availability.", 201);
}

export function onRequest(context) {
  if (context.request.method === "POST") return handlePost(context);
  return new Response("Method not allowed", {
    status: 405,
    headers: noStoreHeaders({ Allow: "POST", "Content-Type": "text/plain; charset=utf-8" })
  });
}
