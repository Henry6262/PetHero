import { validateLead, type Lead } from "./_validateLead";

// Vercel serverless function. All integrations are env-gated, so the endpoint
// runs (and returns 200) even before any keys are configured.
//
// Env (all optional):
//   SLACK_WEBHOOK_URL  — instant team notification
//   LEAD_WEBHOOK_URL   — generic store (Google Sheet / Make / Zapier / CRM)
//   RESEND_API_KEY     — send the branded autoresponder
//   LEAD_NOTIFY_EMAIL  — where internal notifications go
//   LEAD_FROM_EMAIL    — verified sender for the autoresponder

interface VercelReq {
  method?: string;
  body?: unknown;
}
interface VercelRes {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
  setHeader: (k: string, v: string) => void;
  end: (body?: string) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const body: Record<string, unknown> =
    typeof req.body === "string" ? safeParse(req.body) : ((req.body as Record<string, unknown>) ?? {});

  const result = validateLead(body);

  if (!result.ok) {
    // Honeypot hit → pretend success so bots get no signal.
    if (result.spam) {
      res.status(200).json({ ok: true });
      return;
    }
    res.status(422).json({ ok: false, errors: result.errors });
    return;
  }

  const lead = result.data;

  // Fire side-effects, but never fail the user's request on an integration error.
  await Promise.allSettled([notifySlack(lead), storeLead(lead), notifyEmail(lead), autoresponder(lead)]);

  res.status(200).json({ ok: true });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function summary(lead: Lead): string {
  const parts = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Type: ${lead.eventType}`,
    lead.date ? `Date: ${lead.date}` : null,
    lead.guests ? `Guests: ${lead.guests}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

async function notifySlack(lead: Lead) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `🕯️ New enquiry\n${summary(lead)}` }),
  });
}

async function storeLead(lead: Lead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    console.log("[lead]", summary(lead));
    return;
  }
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, receivedAt: new Date().toISOString() }),
  });
}

async function notifyEmail(lead: Lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!key || !to || !from) return;
  await sendEmail(key, {
    from,
    to,
    subject: `New enquiry — ${lead.name} (${lead.eventType})`,
    text: summary(lead),
  });
}

async function autoresponder(lead: Lead) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!key || !from) return;
  await sendEmail(key, {
    from,
    to: lead.email,
    subject: "We've received your enquiry",
    text:
      `Dear ${lead.name},\n\n` +
      `Thank you for your enquiry. One of our team will reply to you personally, the same day.\n\n` +
      `In the meantime, anything urgent can reach us directly.\n\n` +
      `Warm regards,\nThe team`,
  });
}

async function sendEmail(
  key: string,
  msg: { from: string; to: string; subject: string; text: string }
) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
}
