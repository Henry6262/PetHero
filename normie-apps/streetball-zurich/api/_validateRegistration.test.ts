import { describe, it, expect } from "vitest";
import { validateRegistration, bracketForBirthYear } from "./_validateRegistration";

const base = {
  mode: "jam",
  name: "Kai",
  email: "kai@example.com",
  birthYear: "2013",
  consent: "on",
};

describe("bracketForBirthYear", () => {
  it("maps birth years to the right bracket", () => {
    expect(bracketForBirthYear(2018)).toBe("U10");
    expect(bracketForBirthYear(2013)).toBe("U14");
    expect(bracketForBirthYear(2009)).toBe("U18");
  });
  it("returns null outside U10–U18", () => {
    expect(bracketForBirthYear(2024)).toBeNull();
    expect(bracketForBirthYear(2005)).toBeNull();
  });
});

describe("validateRegistration", () => {
  it("accepts a valid jam registration and re-derives the bracket", () => {
    const r = validateRegistration({ ...base, position: "guard", skill: "baller" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.mode).toBe("jam");
      expect(r.data.bracket).toBe("U14");
      expect(r.data.position).toBe("guard");
      expect(r.data.program).toBeUndefined();
    }
  });

  it("accepts a valid coaching registration with a program", () => {
    const r = validateRegistration({ ...base, mode: "coaching", program: "weekly" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.mode).toBe("coaching");
      expect(r.data.program).toBe("weekly");
      expect(r.data.position).toBeUndefined();
    }
  });

  it("never trusts a client-supplied bracket", () => {
    const r = validateRegistration({ ...base, birthYear: "2011", bracket: "U10" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.bracket).toBe("U16");
  });

  it("rejects a bad email", () => {
    const r = validateRegistration({ ...base, email: "nope" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("email");
  });

  it("rejects a missing name", () => {
    const r = validateRegistration({ ...base, name: "  " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("name");
  });

  it("requires consent for minors", () => {
    const r = validateRegistration({ ...base, consent: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("consent");
  });

  it("rejects an out-of-range birth year", () => {
    const r = validateRegistration({ ...base, birthYear: "2024" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("birthYear");
  });

  it("silently flags the honeypot as spam", () => {
    const r = validateRegistration({ ...base, company: "bot inc" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.spam).toBe(true);
  });
});
