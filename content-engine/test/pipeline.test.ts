import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, existsSync } from "node:fs";
import { runFfmpeg, ffprobeHasVideo } from "../src/lib/ffmpeg";
import { runVideo } from "../src/pipeline/run";
import { loadManifest } from "../src/manifest";

async function hasFfmpeg(): Promise<boolean> {
  try { await runFfmpeg(["-version"]); return true; } catch { return false; }
}

async function synthClip(path: string, color: string, seconds: number) {
  await runFfmpeg([
    "-y", "-f", "lavfi", "-i", `color=c=${color}:s=1280x720:d=${seconds}:r=30`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path,
  ]);
}
async function synthAudio(path: string, freq: number, seconds: number) {
  await runFfmpeg(["-y", "-f", "lavfi", "-i", `sine=frequency=${freq}:duration=${seconds}`, "-c:a", "aac", path]);
}

test.skipIf(!(await hasFfmpeg()))(
  "runVideo assembles output and records manifest transitions",
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "ce-pipe-"));
    const a = join(dir, "a.mp4");
    const vo = join(dir, "vo.m4a");
    const out = join(dir, "out.mp4");
    const manifestPath = join(dir, "manifest.json");
    await synthClip(a, "orange", 3);
    await synthAudio(vo, 280, 3);

    const result = await runVideo({
      manifestPath,
      brand: "sauce-empire",
      concept: "mayan-ember",
      clips: [a],
      voPath: vo,
      outPath: out,
      caption: false, // skip whisper API in CI
    });

    expect(result).toBe(out);
    expect(existsSync(out)).toBe(true);
    expect(await ffprobeHasVideo(out)).toBe(true);

    const m = loadManifest(manifestPath);
    const rec = m.videos[0]!;
    expect(rec.status).toBe("assembled");
    expect(rec.outputPath).toBe(out);
    expect(rec.history.map((h) => h.status)).toContain("generating");
  },
  60_000,
);
