// Generate all t2v shots for a concept from its prompts.json (skips existing). Reusable.
import { mkdirSync, existsSync } from "node:fs";
import { generateText2Video } from "../src/lib/kling";
const concept = process.argv[2];
if (!concept) { console.error("usage: bun run scripts/_gen-clips.ts <concept>"); process.exit(1); }
const dir = `brands/krava/assets/clips/${concept}`;
mkdirSync(dir, { recursive: true });
const p = await Bun.file(`brands/krava/concepts/${concept}/prompts.json`).json();
for (const shot of p.shots) {
  const out = `${dir}/s${shot.id}.mp4`;
  if (existsSync(out)) { console.log(`reuse s${shot.id}`); continue; }
  console.log(`Generating shot ${shot.id}...`);
  await generateText2Video({
    prompt: `${shot.prompt} ${p.styleSuffix}`,
    negativePrompt: p.negative, mode: "pro", aspectRatio: "9:16", duration: "5",
    outPath: out, onTick: (s) => console.log(`s${shot.id}: ${s}`),
  });
  console.log(`DONE s${shot.id}`);
}
console.log("ALL DONE");
