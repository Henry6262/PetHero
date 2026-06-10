/**
 * Generalized Krava ad producer.
 *
 *   bun run scripts/produce-krava-ad.ts <concept>
 *
 * Reads brands/krava/concepts/<concept>/ad.json which declares:
 *   - language / platform / funnel (metadata only)
 *   - voice  : ElevenLabs voice_settings overrides
 *   - reuseClipsFrom : optional concept to borrow already-rendered clips from
 *                      (lets EN + DE variants share one Kling render — saves credits)
 *   - captions : timed ASS cues ({ start, end, text })
 *
 * If reuseClipsFrom is absent, clips are generated from the concept's prompts.json
 * (same shape as produce-krava-doesnt-fall.ts). VO is generated from vo.txt.
 */
import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildAssembleArgs } from "../src/lib/assemble";
import { runFfmpeg } from "../src/lib/ffmpeg";
import { generateText2Video } from "../src/lib/kling";
import { tts } from "../src/lib/elevenlabs";

interface Caption {
  start: string;
  end: string;
  text: string;
}

interface AdFile {
  concept: string;
  language: string;
  platform?: string;
  funnel?: string;
  reuseClipsFrom?: string;
  clips?: string[]; // explicit clip paths (remix existing footage across concepts)
  voice?: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speed?: number;
  };
  captions: Caption[];
}

interface PromptFile {
  styleSuffix: string;
  negative: string;
  shots: { id: number; seconds: number; prompt: string }[];
}

const concept = process.argv[2];
if (!concept) {
  console.error("usage: bun run scripts/produce-krava-ad.ts <concept>");
  process.exit(1);
}

const brand = "krava";
const base = `brands/${brand}`;
const conceptDir = `${base}/concepts/${concept}`;
const voDir = `${base}/assets/vo`;
const outDir = `${base}/output`;
const outPath = `${outDir}/${concept}.mp4`;
const captionsPath = `${outDir}/${concept}.ass`;

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function escAss(text: string): string {
  return text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function audioDuration(path: string): number {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]);
  return parseFloat(r.stdout.toString().trim()) || 15;
}

function toAssTime(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}

/** Build captions FROM the spoken VO text, chunked + timed to the audio so text == voice. */
function captionsFromVo(voText: string, dur: number): Caption[] {
  const parts = voText
    .replace(/[—–]/g, ",")
    .split(/(?<=[,.;:!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const part of parts) {
    const words = part.split(/\s+/);
    if (words.length <= 5) chunks.push(part);
    else for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4).join(" "));
  }
  const clean = chunks.map((c) => c.replace(/[,;:]+$/, "").toLowerCase());
  const total = clean.reduce((a, c) => a + c.length, 0) || 1;
  const caps: Caption[] = [];
  let acc = 0;
  for (const c of clean) {
    const start = (dur * acc) / total;
    acc += c.length;
    const end = (dur * acc) / total;
    caps.push({ start: toAssTime(start), end: toAssTime(end), text: c });
  }
  return caps;
}

function makeAss(captions: Caption[]): string {
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00282420,&H99000000,-1,0,0,0,100,100,0,0,1,3,1,2,80,80,170,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${captions
  .map((c) => `Dialogue: 0,${c.start},${c.end},Default,,0,0,0,,${escAss(c.text)}`)
  .join("\n")}
`;
}

ensureDir(voDir);
ensureDir(outDir);

const ad = (await Bun.file(`${conceptDir}/ad.json`).json()) as AdFile;
const voText = (await Bun.file(`${conceptDir}/vo.txt`).text()).trim();
const voPath = `${voDir}/${concept}.mp3`;

console.log(`Producing ${brand}/${concept} (${ad.language})`);

// 1. Voiceover
if (!existsSync(voPath)) {
  console.log("Generating ElevenLabs voiceover...");
  const audio = await tts({
    text: voText,
    voiceId: ad.voice?.voiceId,
    stability: ad.voice?.stability ?? 0.55,
    similarityBoost: ad.voice?.similarityBoost ?? 0.88,
    style: ad.voice?.style ?? 0.2,
    speed: ad.voice?.speed,
  });
  await Bun.write(voPath, audio);
  console.log(`Voiceover written: ${voPath}`);
} else {
  console.log(`Reusing voiceover: ${voPath}`);
}

// 2. Clips — reuse another concept's renders, or generate fresh from prompts.json
let clipPaths: string[];
if (ad.clips && ad.clips.length > 0) {
  clipPaths = ad.clips;
  for (const p of clipPaths) {
    if (!existsSync(p)) throw new Error(`remix clip missing: ${p}`);
  }
  console.log(`Remixing ${clipPaths.length} explicit clips`);
} else if (ad.reuseClipsFrom) {
  const srcDir = `${base}/assets/clips/${ad.reuseClipsFrom}`;
  clipPaths = ["s1", "s2", "s3"].map((s) => `${srcDir}/${s}.mp4`);
  for (const p of clipPaths) {
    if (!existsSync(p)) throw new Error(`reuse clip missing: ${p}`);
  }
  console.log(`Reusing ${clipPaths.length} clips from ${ad.reuseClipsFrom}`);
} else {
  const prompts = (await Bun.file(`${conceptDir}/prompts.json`).json()) as PromptFile;
  const clipsDir = `${base}/assets/clips/${concept}`;
  ensureDir(clipsDir);
  clipPaths = [];
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
}

// 3. Captions
const captions =
  Bun.env.CAPTION_MODE === "vo" ? captionsFromVo(voText, audioDuration(voPath)) : ad.captions;
await Bun.write(captionsPath, makeAss(captions));
console.log(`Captions written: ${captionsPath}`);

// 4. Assemble
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
