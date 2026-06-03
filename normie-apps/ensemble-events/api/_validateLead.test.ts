import { describe, it, expect } from "vitest";
import { validateLead } from "./_validateLead";

const base = {
  name: "Anna Meier",
  email: "anna@example.com",
  eventType: "private",
  date: "June 2026",
  guests: "120",
  consent: "on",
  company: "", // honeypot empty
};

describe("validateLead", () => {
  it("accepts a valid payload and normalises it", () => {
    const r = validateLead(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe("Anna Meier");
      expect(r.data.email).toBe("anna@example.com");
      expect(r.data.guests).toBe(120);
      expect(r.data.eventType).toBe("private");
    }
  });

  it("rejects a missing name", () => {
    const r = validateLead({ ...base, name: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("name");
  });

  it("rejects an invalid email", () => {
    const r = validateLead({ ...base, email: "not-an-email" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("email");
  });

  it("rejects when consent is absent", () => {
    const r = validateLead({ ...base, consent: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("consent");
  });

  it("flags a filled honeypot as spam (not a field error)", () => {
    const r = validateLead({ ...base, company: "buy-cheap-pills" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.spam).toBe(true);
  });

  it("treats non-numeric guests as undefined rather than failing", () => {
    const r = validateLead({ ...base, guests: "lots" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.guests).toBeUndefined();
  });

  it("falls back to 'other' for an unknown event type", () => {
    const r = validateLead({ ...base, eventType: "rave" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.eventType).toBe("other");
  });

  it("trims and length-caps free text", () => {
    const r = validateLead({ ...base, name: "  " + "x".repeat(300) + "  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name.length).toBeLessThanOrEqual(200);
  });
});
