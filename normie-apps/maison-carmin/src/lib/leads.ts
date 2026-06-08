// Lead-capture seam. Phase 1 has no backend — enquiries are captured client-side
// and (optionally) forwarded to a no-code endpoint set via VITE_LEADS_ENDPOINT
// (e.g. a Formspree/Basin URL). With no endpoint configured it resolves
// successfully after logging, so the form is fully demoable. Phase 2 swaps in a
// real backend behind this identical interface — nothing else changes.

export interface Lead {
  name: string;
  email: string;
  phone?: string;
  piece?: string; // piece of interest (id or name)
  budget?: string;
  message?: string;
  // anti-spam honeypot — must stay empty
  company?: string;
}

const ENDPOINT = import.meta.env.VITE_LEADS_ENDPOINT as string | undefined;

/** Store / forward an enquiry. Throws on transport failure so the UI can react. */
export async function storeLead(lead: Lead): Promise<void> {
  // Honeypot tripped → silently succeed (don't tip off bots).
  if (lead.company) return;

  const payload = { ...lead, source: "maison-carmin", ts: new Date().toISOString() };
  delete (payload as Partial<Lead>).company;

  if (!ENDPOINT) {
    // No backend yet — log so it's visible in dev and resolve as success.
    // eslint-disable-next-line no-console
    console.info("[lead] captured (no endpoint configured):", payload);
    await new Promise((r) => setTimeout(r, 500));
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lead transport failed: ${res.status}`);
}
