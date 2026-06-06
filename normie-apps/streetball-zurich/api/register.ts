import { validateRegistration, type Registration } from "./_validateRegistration";

// Vercel serverless function. All integrations are env-gated, so the endpoint
// runs (and returns 200) even before any keys are configured — registrations
// are logged to the server console in that case.
//
// Env (all optional):
//   SLACK_WEBHOOK_URL  — instant team notification
//   LEAD_WEBHOOK_URL   — generic store (Google Sheet / Make / Zapier / CRM)
//   RESEND_API_KEY     — send the autoresponder + internal notification
//   LEAD_NOTIFY_EMAIL  — where internal notifications go
//   LEAD_FROM_EMAIL    — verified sender for the autoresponder
//
// Phase-2 seam: swap `storeLead()` for a real DB insert + class-capacity logic.
// The bracket on `Registration` is already server-trusted.

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

  const result = validateRegistration(body);

  if (!result.ok) {
    // Honeypot hit → pretend success so bots get no signal.
    if (result.spam) {
      res.status(200).json({ ok: true });
      return;
    }
    res.status(422).json({ ok: false, errors: result.errors });
    return;
  }

  const reg = result.data;

  // Fire side-effects, but never fail the user's request on an integration error.
  await Promise.allSettled([notifySlack(reg), storeLead(reg), notifyEmail(reg), autoresponder(reg)]);

  res.status(200).json({ ok: true });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function summary(reg: Registration): string {
  const parts = [
    `Mode: ${reg.mode}`,
    `Name: ${reg.name}`,
    `Email: ${reg.email}`,
    `Bracket: ${reg.bracket} (born ${reg.birthYear})`,
    reg.phone ? `Phone: ${reg.phone}` : null,
    reg.position ? `Position: ${reg.position}` : null,
    reg.skill ? `Level: ${reg.skill}` : null,
    reg.program ? `Program: ${reg.program}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

async function notifySlack(reg: Registration) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const head = reg.mode === "coaching" ? "New coaching enquiry" : "New jam registration";
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `${head}\n${summary(reg)}` }),
  });
}

async function storeLead(reg: Registration) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    console.log("[register]", summary(reg));
    return;
  }
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...reg, receivedAt: new Date().toISOString() }),
  });
}

async function notifyEmail(reg: Registration) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!key || !to || !from) return;
  await sendEmail(key, {
    from,
    to,
    subject: `New ${reg.mode} registration — ${reg.name} (${reg.bracket})`,
    text: summary(reg),
  });
}

async function autoresponder(reg: Registration) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!key || !from) return;
  await sendEmail(key, {
    from,
    to: reg.email,
    subject: "You're on the list — Züri Street Ball",
    text:
      `Hey ${reg.name},\n\n` +
      `We've got your ${reg.mode === "coaching" ? "coaching enquiry" : "jam registration"} for the ${reg.bracket} bracket.\n` +
      `We'll be in touch with the next steps soon.\n\n` +
      `See you on the concrete,\nZüri Street Ball`,
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
