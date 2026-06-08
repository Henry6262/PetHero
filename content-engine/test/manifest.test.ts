import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  emptyManifest,
  addVideo,
  transition,
  saveManifest,
  loadManifest,
  STATUS_ORDER,
} from "../src/manifest";

test("emptyManifest is version 1 with no videos", () => {
  const m = emptyManifest();
  expect(m.version).toBe(1);
  expect(m.videos).toEqual([]);
});

test("addVideo starts at idea and is stored in the manifest", () => {
  const m = emptyManifest();
  const rec = addVideo(m, { brand: "sauce-empire", concept: "mayan-ember" });
  expect(rec.status).toBe("idea");
  expect(rec.history).toHaveLength(1);
  expect(m.videos[0]).toBe(rec);
  expect(rec.id).toContain("sauce-empire");
});

test("transition moves forward and records history", () => {
  const m = emptyManifest();
  const rec = addVideo(m, { brand: "b", concept: "c" });
  transition(rec, "scripted", "2026-06-08T00:00:00.000Z");
  expect(rec.status).toBe("scripted");
  expect(rec.history.at(-1)).toEqual({ status: "scripted", at: "2026-06-08T00:00:00.000Z" });
});

test("transition forbids backward moves", () => {
  const m = emptyManifest();
  const rec = addVideo(m, { brand: "b", concept: "c" });
  transition(rec, "assembled", "2026-06-08T00:00:00.000Z");
  expect(() => transition(rec, "scripted")).toThrow(/not forward/);
});

test("transition rejects unknown status", () => {
  const m = emptyManifest();
  const rec = addVideo(m, { brand: "b", concept: "c" });
  // @ts-expect-error intentionally invalid
  expect(() => transition(rec, "bogus")).toThrow(/unknown status/);
});

test("save then load round-trips", () => {
  const m = emptyManifest();
  addVideo(m, { brand: "b", concept: "c" });
  const path = join(tmpdir(), `manifest-${Date.now()}.json`);
  saveManifest(path, m);
  const loaded = loadManifest(path);
  expect(loaded.videos[0]?.brand).toBe("b");
});

test("STATUS_ORDER is the full linear lifecycle", () => {
  expect(STATUS_ORDER[0]).toBe("idea");
  expect(STATUS_ORDER.at(-1)).toBe("measured");
});
