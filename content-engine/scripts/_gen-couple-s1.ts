import { mkdirSync } from "node:fs";
import { generateText2Video } from "../src/lib/kling";
const dir = "brands/krava/assets/clips/couple-ritual-en";
mkdirSync(dir, { recursive: true });
const p = await Bun.file("brands/krava/concepts/couple-ritual-en/prompts.json").json();
const s = p.shots[0];
console.log("Generating couple shot 1 (establishing)...");
await generateText2Video({ prompt: `${s.prompt} ${p.styleSuffix}`, negativePrompt: p.negative, mode: "pro", aspectRatio: "9:16", duration: "5", outPath: `${dir}/s1.mp4`, onTick: (st)=>console.log(`s1: ${st}`) });
console.log("DONE s1");
