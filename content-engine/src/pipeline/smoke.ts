import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { runFfmpeg } from "../lib/ffmpeg";
import { runVideo } from "./run";

async function synthClip(path: string, color: string, seconds: number) {
  await runFfmpeg([
    "-y", "-f", "lavfi", "-i", `color=c=${color}:s=1280x720:d=${seconds}:r=30`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path,
  ]);
}
async function synthAudio(path: string, freq: number, seconds: number) {
  await runFfmpeg(["-y", "-f", "lavfi", "-i", `sine=frequency=${freq}:duration=${seconds}`, "-c:a", "aac", path]);
}

const dir = mkdtempSync(join(tmpdir(), "ce-smoke-"));
const clips = [join(dir, "s1.mp4"), join(dir, "s2.mp4"), join(dir, "s3.mp4")];
const colors = ["#c81d11", "#ff5b1f", "#0a0a0a"];
for (let i = 0; i < clips.length; i++) await synthClip(clips[i]!, colors[i]!, 5);
const vo = join(dir, "vo.m4a");
const music = join(dir, "music.m4a");
await synthAudio(vo, 300, 15);
await synthAudio(music, 220, 15);

const out = join(process.cwd(), "brands/sauce-empire/output/smoke.mp4");
const result = await runVideo({
  manifestPath: join(process.cwd(), "manifest.json"),
  brand: "sauce-empire",
  concept: "mayan-ember",
  clips,
  voPath: vo,
  musicPath: music,
  outPath: out,
  caption: false,
});
console.log("Smoke video written:", result);
