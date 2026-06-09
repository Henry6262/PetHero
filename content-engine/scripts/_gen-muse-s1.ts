import { mkdirSync } from "node:fs";
import { generateText2Video } from "../src/lib/kling";
const dir = "brands/krava/assets/clips/breakfast-muse-en";
mkdirSync(dir, { recursive: true });
const p = await Bun.file("brands/krava/concepts/breakfast-muse-en/prompts.json").json();
const shot = p.shots[0];
console.log("Generating muse shot 1 (establishing)...");
await generateText2Video({
  prompt: `${shot.prompt} ${p.styleSuffix}`,
  negativePrompt: p.negative,
  mode: "pro", aspectRatio: "9:16", duration: "5",
  outPath: `${dir}/s1.mp4`, onTick: (s) => console.log(`s1: ${s}`),
});
console.log("DONE s1");
