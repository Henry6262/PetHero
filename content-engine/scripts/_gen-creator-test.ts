import { mkdirSync } from "node:fs";
import { generateText2Video } from "../src/lib/kling";
const dir = "brands/krava/assets/clips/creator-test";
mkdirSync(dir, { recursive: true });
const p = await Bun.file("brands/krava/concepts/creator-test/prompts.json").json();
for (const shot of p.shots) {
  const out = `${dir}/s${shot.id}.mp4`;
  console.log(`Generating creator shot ${shot.id}...`);
  await generateText2Video({
    prompt: `${shot.prompt} ${p.styleSuffix}`,
    negativePrompt: p.negative,
    mode: "pro", aspectRatio: "9:16", duration: "5",
    outPath: out, onTick: (s) => console.log(`shot ${shot.id}: ${s}`),
  });
  console.log(`Done s${shot.id}: ${out}`);
}
console.log("ALL DONE");
