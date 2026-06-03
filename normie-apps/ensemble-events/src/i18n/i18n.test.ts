import { describe, it, expect } from "vitest";
import { translate } from "./index";

describe("translate", () => {
  it("returns the English string for a known nested key", () => {
    expect(translate("en", "hero.cta")).toBe("Request a private consultation");
  });

  it("returns the German string when lang is de", () => {
    expect(translate("de", "hero.cta")).toBe("Private Beratung anfragen");
  });

  it("resolves deeply nested keys", () => {
    expect(translate("en", "services.items.brigade.title")).toBe("The Service Brigade");
  });

  it("falls back to the key string when the path is unknown", () => {
    expect(translate("en", "nope.missing.key")).toBe("nope.missing.key");
  });

  it("falls back to the key when the path resolves to a non-string", () => {
    expect(translate("en", "services.items")).toBe("services.items");
  });
});
