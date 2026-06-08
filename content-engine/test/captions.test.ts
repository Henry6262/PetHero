import { test, expect } from "bun:test";
import { formatSrtTime, segmentsToSrt } from "../src/lib/captions";

test("formatSrtTime formats zero", () => {
  expect(formatSrtTime(0)).toBe("00:00:00,000");
});

test("formatSrtTime formats hours/minutes/seconds/millis", () => {
  expect(formatSrtTime(3661.5)).toBe("01:01:01,500");
});

test("segmentsToSrt builds numbered cues", () => {
  const srt = segmentsToSrt([
    { start: 0, end: 1.5, text: "Before the maps." },
    { start: 1.5, end: 3, text: "The Maya guarded a fire." },
  ]);
  expect(srt).toContain("1\n00:00:00,000 --> 00:00:01,500\nBefore the maps.");
  expect(srt).toContain("2\n00:00:01,500 --> 00:00:03,000\nThe Maya guarded a fire.");
});
