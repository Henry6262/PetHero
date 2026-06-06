import { describe, it, expect } from "vitest";
import en from "./en";
import de from "./de";

/** Recursively collect all dot-path leaf keys of a nested string dictionary. */
function leafKeys(obj: unknown, prefix = ""): string[] {
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      leafKeys(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [prefix];
}

describe("i18n dictionaries", () => {
  it("en and de have identical key sets", () => {
    const enKeys = leafKeys(en).sort();
    const deKeys = leafKeys(de).sort();
    expect(deKeys).toEqual(enKeys);
  });

  it("no leaf value is empty", () => {
    for (const dict of [en, de]) {
      for (const key of leafKeys(dict)) {
        const value = key.split(".").reduce<any>((acc, part) => acc?.[part], dict);
        expect(typeof value, key).toBe("string");
        expect(value.length, key).toBeGreaterThan(0);
      }
    }
  });
});
