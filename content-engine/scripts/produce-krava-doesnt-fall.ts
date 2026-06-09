import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { buildAssembleArgs } from "../src/lib/assemble";
import { runFfmpeg } from "../src/lib/ffmpeg";
import { generateText2Video } from "../src/lib/kling";
import { tts } from "../src/lib/elevenlabs";

interface PromptFile {
  styleSuffix: string;
  negative: string;
  shots: { id: number; seconds: number; prompt: string }[];
}

const brand = "krava";
const concept = "doesnt-fall";
const base = `brands/${brand}`;
const conceptDir = `${base}/concepts/${concept}`;
const clipsDir = `${base}/assets/clips/${concept}`;
const voDir = `${base}/assets/vo`;
const outDir = `${base}/output`;
const outPath = `${outDir}/${concept}-15s.mp4`;
const captionsPath = `${outDir}/${concept}-15s.ass`;

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function escAss(text: string): string {
  return text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function makeAss(): string {
  const events = [
    ["0:00:00.00", "0:00:03.80", "THIS SPOON\\NDOESN'T FALL."],
    ["0:00:03.80", "0:00:07.80", "4,000 YEARS\\NOF BULGARIAN CRAFT."],
    ["0:00:07.80", "0:00:10.80", "LIVING CULTURES.\\NNOTHING ADDED."],
    ["0:00:10.80", "0:00:13.10", "MADE FRESH\\NIN ZURICH."],
    ["0:00:13.10", "0:00:15.00", "KRAVA.CH\\NORDER TODAY"],
  ];

  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00282420,&H99000000,-1,0,0,0,100,100,0,0,1,3,1,2,80,80,170,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.map(([start, end, text]) => `Dialogue: 0,${start},${end},Default,,0,0,0,,${escAss(text)}`).join("\n")}
`;
}

ensureDir(clipsDir);
ensureDir(voDir);
ensureDir(outDir);

const prompts = (await Bun.file(`${conceptDir}/prompts.json`).json()) as PromptFile;
const voText = (await Bun.file(`${conceptDir}/vo.txt`).text()).trim();
const voPath = `${voDir}/${concept}.mp3`;

console.log(`Producing ${brand}/${concept}`);

if (!existsSync(voPath)) {
  console.log("Generating ElevenLabs voiceover...");
  const audio = await tts({
    text: voText,
    stability: 0.55,
    similarityBoost: 0.88,
    style: 0.2,
  });
  await Bun.write(voPath, audio);
  console.log(`Voiceover written: ${voPath}`);
} else {
  console.log(`Reusing voiceover: ${voPath}`);
}

const clipPaths: string[] = [];
for (const shot of prompts.shots) {
  const clipPath = `${clipsDir}/s${shot.id}.mp4`;
  clipPaths.push(clipPath);
  if (existsSync(clipPath)) {
    console.log(`Reusing clip ${shot.id}: ${clipPath}`);
    continue;
  }

  const prompt = `${shot.prompt} ${prompts.styleSuffix}`;
  console.log(`Generating Kling shot ${shot.id} (${shot.seconds}s)...`);
  await generateText2Video({
    prompt,
    negativePrompt: prompts.negative,
    mode: "pro",
    aspectRatio: "9:16",
    duration: String(shot.seconds) as "5" | "10",
    outPath: clipPath,
    onTick: (status) => console.log(`shot ${shot.id}: ${status}`),
  });
  console.log(`Clip ${shot.id} written: ${clipPath}`);
}

await Bun.write(captionsPath, makeAss());
console.log(`Captions written: ${captionsPath}`);

console.log("Assembling final reel...");
await runFfmpeg(
  buildAssembleArgs({
    clips: clipPaths,
    voPath,
    captionsPath,
    outPath,
    zoom: false,
  }),
);

console.log(`Done: ${outPath}`);
