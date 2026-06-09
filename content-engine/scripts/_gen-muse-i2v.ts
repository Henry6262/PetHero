// Drive shots 2 & 3 from a locked frame of shot 1 -> same woman across the scene.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { submitImage2Video, pollTask } from "../src/lib/kling";

async function dl(url: string, out: string) {
  for (let i = 1; i <= 4; i++) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(`http ${r.status}`); await Bun.write(out, await r.arrayBuffer()); return; }
    catch (e) { console.log(`download try ${i} failed: ${e.message}`); await Bun.sleep(3000); }
  }
  throw new Error(`download failed: ${out}`);
}

const dir = "brands/krava/assets/clips/breakfast-muse-en";
const anchorT = process.argv[2] ?? "4.2";            // seconds into s1 to grab her face
const anchor = `${dir}/_anchor.jpg`;
spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", anchorT, "-i", `${dir}/s1.mp4`, "-frames:v", "1", "-q:v", "3", anchor]);
const b64 = readFileSync(anchor).toString("base64");
console.log(`anchor @ ${anchorT}s, ${Math.round(b64.length/1024)}KB b64`);

const neg = "deformed face, asymmetric eyes, extra fingers, fused fingers, deformed hands, plastic skin, waxy skin, uncanny, distorted mouth, distorted teeth, multiple people, duplicate face, watermark, text, blurry, low resolution";
const shots = [
  { id: 2, prompt: "Camera slowly pushes in to an extreme close-up as the same woman closes her eyes and savors the spoonful, a serene content smile spreading. Intimate soft morning light, subtle head tilt." },
  { id: 3, prompt: "The same woman turns her head slightly to a three-quarter profile, glances away and then back toward the camera with a soft confident smile. Gentle camera drift, slightly different angle, soft morning light." },
];
for (const s of shots) {
  console.log(`i2v shot ${s.id}...`);
  const id = await submitImage2Video({ image: b64, prompt: s.prompt, negativePrompt: neg, mode: "pro", duration: "5" });
  const url = await pollTask("image2video", id, { onTick: (st) => console.log(`s${s.id}: ${st}`) });
  await dl(url, `${dir}/s${s.id}.mp4`);
  console.log(`DONE s${s.id}`);
}
console.log("ALL DONE i2v");
