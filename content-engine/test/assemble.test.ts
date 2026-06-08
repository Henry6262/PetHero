import { test, expect } from "bun:test";
import { buildAssembleArgs } from "../src/lib/assemble";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, existsSync } from "node:fs";
import { runFfmpeg, ffprobeDuration, ffprobeHasVideo } from "../src/lib/ffmpeg";

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

async function hasFfmpeg(): Promise<boolean> {
  try { await runFfmpeg(["-version"]); return true; } catch { return false; }
}

// Generate a synthetic color clip with no audio (so assembly takes audio from VO/music).
async function synthClip(path: string, color: string, seconds: number) {
  await runFfmpeg([
    "-y", "-f", "lavfi", "-i", `color=c=${color}:s=1280x720:d=${seconds}:r=30`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path,
  ]);
}

async function synthAudio(path: string, freq: number, seconds: number) {
  await runFfmpeg([
    "-y", "-f", "lavfi", "-i", `sine=frequency=${freq}:duration=${seconds}`,
    "-c:a", "aac", path,
  ]);
}

test.skipIf(!(await hasFfmpeg()))(
  "assembles two synthetic clips + VO + music into a valid vertical mp4",
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "ce-asm-"));
    const a = join(dir, "a.mp4");
    const b = join(dir, "b.mp4");
    const vo = join(dir, "vo.m4a");
    const music = join(dir, "music.m4a");
    const out = join(dir, "out.mp4");

    await synthClip(a, "red", 2);
    await synthClip(b, "blue", 2);
    await synthAudio(vo, 300, 4);
    await synthAudio(music, 220, 4);

    const { buildAssembleArgs } = await import("../src/lib/assemble");
    await runFfmpeg(buildAssembleArgs({ clips: [a, b], voPath: vo, musicPath: music, outPath: out }));

    expect(existsSync(out)).toBe(true);
    expect(await ffprobeHasVideo(out)).toBe(true);
    expect(await ffprobeDuration(out)).toBeGreaterThan(3); // ~4s
  },
  60_000,
);
