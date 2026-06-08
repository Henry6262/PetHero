import { test, expect } from "bun:test";
import { buildAssembleArgs } from "../src/lib/assemble";

test("buildAssembleArgs scales+concats clips to vertical and strips metadata", () => {
  const args = buildAssembleArgs({
    clips: ["a.mp4", "b.mp4"],
    outPath: "out.mp4",
  });
  const fc = args[args.indexOf("-filter_complex") + 1];
  expect(fc).toContain("scale=1080:1920:force_original_aspect_ratio=increase");
  expect(fc).toContain("concat=n=2:v=1:a=0");
  expect(args).toContain("-map_metadata");
  expect(args).toContain("-1");
  expect(args.at(-1)).toBe("out.mp4");
});

test("buildAssembleArgs mixes voiceover and ducked music when both provided", () => {
  const args = buildAssembleArgs({
    clips: ["a.mp4"],
    voPath: "vo.m4a",
    musicPath: "music.m4a",
    outPath: "out.mp4",
  });
  const fc = args[args.indexOf("-filter_complex") + 1];
  expect(fc).toContain("volume=0.2"); // music ducked
  expect(fc).toContain("amix=inputs=2");
  expect(args).toContain("-c:a");
});

test("buildAssembleArgs burns captions when provided", () => {
  const args = buildAssembleArgs({
    clips: ["a.mp4"],
    captionsPath: "caps.srt",
    outPath: "out.mp4",
  });
  const fc = args[args.indexOf("-filter_complex") + 1];
  expect(fc).toContain("subtitles=caps.srt");
});
