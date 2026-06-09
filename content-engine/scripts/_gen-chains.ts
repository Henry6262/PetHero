// "Chain" existing footage into NEW scenes: extract a frame from a clip we own,
// then image-to-video it with a fresh motion prompt. Outputs reusable b-roll.
import { mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { submitImage2Video, pollTask } from "../src/lib/kling";

const outDir = "public/krava/_broll-ai";
const tmpDir = "brands/krava/assets/clips/chains";
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const neg = "deformed, extra fingers, fused fingers, deformed hands, plastic texture, runny, watery, dripping milk, uncanny, multiple people, watermark, text, logo, blurry, low resolution";

const chains = [
  { name: "honey-drizzle", src: "brands/krava/assets/clips/doesnt-fall/s1.mp4", t: "2.0",
    prompt: "Thick golden honey slowly drizzles down over the silver spoon and the dense white yogurt, glossy and rich, gentle ASMR macro, soft daylight." },
  { name: "berry-drop", src: "brands/krava/assets/clips/farm-to-fridge-en/s3.mp4", t: "2.0",
    prompt: "Fresh raspberries and blueberries drop in slow motion onto the surface of thick white yogurt, creating soft gentle ripples, macro food close-up, natural light." },
  { name: "thick-scoop", src: "brands/krava/assets/clips/thickness-test-en/s2.mp4", t: "2.0",
    prompt: "A spoon slowly scoops a thick portion of dense white yogurt, revealing a clean sharp edge, slow satisfying ASMR macro, soft side light." },
  { name: "muse-window", src: "brands/krava/assets/clips/breakfast-muse-en/s1.mp4", t: "4.2",
    prompt: "The same dark-haired woman turns to gaze out of the bright window with a soft dreamy smile, holding her spoon, gentle side angle, soft morning light." },
];

async function dl(url, out) {
  for (let i = 1; i <= 4; i++) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(`http ${r.status}`); await Bun.write(out, await r.arrayBuffer()); return; }
    catch (e) { console.log(`dl try ${i}: ${e.message}`); await Bun.sleep(3000); }
  }
  throw new Error(`download failed ${out}`);
}

for (const c of chains) {
  const anchor = `${tmpDir}/_anchor-${c.name}.jpg`;
  spawnSync("ffmpeg", ["-y","-loglevel","error","-ss",c.t,"-i",c.src,"-frames:v","1","-q:v","3",anchor]);
  const b64 = readFileSync(anchor).toString("base64");
  console.log(`chain ${c.name}: i2v...`);
  const id = await submitImage2Video({ image: b64, prompt: c.prompt, negativePrompt: neg, mode: "pro", duration: "5" });
  const url = await pollTask("image2video", id, { onTick: (s) => console.log(`${c.name}: ${s}`) });
  await dl(url, `${outDir}/krava-chain-${c.name}.mp4`);
  console.log(`DONE ${c.name}`);
}
console.log("ALL CHAINS DONE");
