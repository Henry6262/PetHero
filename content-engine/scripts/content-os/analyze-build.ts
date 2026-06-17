/**
 * Content OS — analyze-build CLI
 *
 * Transcribes a build session recording via OpenAI Whisper, then uses Claude
 * to extract viral moments and generate carousel slides. Outputs two markdown
 * files: hooks and carousel breakdown.
 *
 * Usage:
 *   bun run scripts/content-os/analyze-build.ts \
 *     --input <path-to-video-or-transcript> \
 *     [--platform reels|shorts|tiktok]   (default: reels)
 *     [--out <output-dir>]               (default: ./output/content-os)
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY  — Anthropic API key (required)
 *   OPENAI_API_KEY     — OpenAI API key, required only for video input (Whisper)
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Platform = "reels" | "shorts" | "tiktok";

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

interface ViralMoment {
  quote: string;
  why_viral: string;
  hooks: [string, string, string];
}

interface ClaudeResponse {
  moments: ViralMoment[];
  best_carousel_moment: number;
  carousel_slides: string[];
}

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { input: string; platform: Platform; outDir: string } {
  const args = argv.slice(2); // strip "bun" + script path
  let input = "";
  let platform: Platform = "reels";
  let outDir = "./output/content-os";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      input = args[++i];
    } else if (args[i] === "--platform" && args[i + 1]) {
      const p = args[++i];
      if (p === "reels" || p === "shorts" || p === "tiktok") {
        platform = p;
      } else {
        console.error(`Error: --platform must be reels, shorts, or tiktok. Got: ${p}`);
        process.exit(1);
      }
    } else if (args[i] === "--out" && args[i + 1]) {
      outDir = args[++i];
    }
  }

  if (!input) {
    console.error("Error: --input is required.");
    console.error(
      "Usage: bun run scripts/content-os/analyze-build.ts --input <path> [--platform reels|shorts|tiktok] [--out <dir>]",
    );
    process.exit(1);
  }

  return { input, platform, outDir };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isVideo(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".mp4", ".mov", ".mkv", ".webm"].includes(ext);
}

function isText(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".txt", ".md"].includes(ext);
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

function nowTimestamp(): string {
  return String(Date.now());
}

function todayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Step 1 — Transcription
// ---------------------------------------------------------------------------

async function transcribeVideo(
  inputPath: string,
  outDir: string,
): Promise<{ transcript: string; segments: WhisperSegment[] }> {
  const openaiKey = Bun.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error(
      "Warning: OPENAI_API_KEY not set. Cannot transcribe video. Pass a .txt transcript with --input instead.",
    );
    process.exit(1);
  }

  console.log("Transcribing video via Whisper...");
  const openai = new OpenAI({ apiKey: openaiKey });

  const fileBuffer = await Bun.file(inputPath).arrayBuffer();
  const file = new File([fileBuffer], path.basename(inputPath), { type: "video/mp4" });

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments: WhisperSegment[] = (response.segments ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  const segmentsText = segments.map((s) => s.text).join(" ").trim();
  const transcript = segmentsText || ((response as { text?: string }).text ?? "");

  // Save raw transcript
  const transcriptPath = path.join(outDir, `transcript-${nowTimestamp()}.txt`);
  await Bun.write(transcriptPath, transcript);
  console.log(`Transcript saved: ${transcriptPath}`);

  return { transcript, segments };
}

async function readTextTranscript(
  inputPath: string,
): Promise<{ transcript: string; segments: WhisperSegment[] }> {
  console.log("Reading transcript from file...");
  const transcript = await Bun.file(inputPath).text();

  // Treat each non-empty paragraph as a pseudo-segment
  const paragraphs = transcript
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segments: WhisperSegment[] = paragraphs.map((text, i) => ({
    start: i * 30,
    end: (i + 1) * 30,
    text,
  }));

  return { transcript: transcript.trim(), segments };
}

// ---------------------------------------------------------------------------
// Step 2 — Viral moment extraction via Claude
// ---------------------------------------------------------------------------

function buildViralMomentPrompt(transcript: string, platform: Platform): string {
  const platformLabel =
    platform === "reels"
      ? "Instagram Reels 9:16"
      : platform === "shorts"
        ? "YouTube Shorts"
        : "TikTok";

  return `You are a viral content strategist specializing in tech/Web3 content for Instagram Reels.

Here is the transcript of a developer build session:
---
${transcript}
---

Platform target: ${platform} (reels = ${platformLabel}, shorts = YouTube Shorts, tiktok = TikTok)

Identify the 3-5 most viral moments in this transcript. For each moment:
1. Timestamp or quote that marks the moment (be specific — quote a few words from the transcript)
2. Why it's viral (one sentence — what emotion/curiosity does it trigger?)
3. Three hook variants optimized for the platform. Each hook must:
   - Start with something unexpected or emotionally triggering
   - Be under 15 words
   - Work as the first sentence of a video caption or spoken hook

Also identify the BEST single moment for a carousel post (the one with the most educational value or shareability).

For the best carousel moment, generate exactly 8 carousel slides:
- Slide 1 (Hook): The most attention-grabbing hook from that moment
- Slide 2: The setup — what you were building or what problem you hit
- Slide 3: The mistake or the challenge
- Slide 4: The turning point
- Slide 5: The solution or key insight
- Slide 6: Why this matters / the lesson
- Slide 7: How to apply this yourself
- Slide 8 (CTA): Comment "BUILD" to get the full breakdown in your DMs

Return your response as JSON with this exact structure:
{
  "moments": [
    {
      "quote": "exact quote from transcript",
      "why_viral": "one sentence",
      "hooks": ["hook A", "hook B", "hook C"]
    }
  ],
  "best_carousel_moment": 0,
  "carousel_slides": ["Slide 1 text", "Slide 2 text", "Slide 3 text", "Slide 4 text", "Slide 5 text", "Slide 6 text", "Slide 7 text", "Slide 8 text"]
}

Return ONLY the JSON object — no markdown fences, no explanation.`;
}

async function extractViralMoments(
  transcript: string,
  platform: Platform,
): Promise<ClaudeResponse> {
  const anthropicKey = Bun.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error("Error: ANTHROPIC_API_KEY is required.");
    process.exit(1);
  }

  console.log("Extracting viral moments via Claude...");
  const client = new Anthropic({ apiKey: anthropicKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildViralMomentPrompt(transcript, platform),
      },
    ],
  });

  const rawText =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  // Try to parse JSON; fall back to a structured error object
  try {
    // Strip optional markdown fences if Claude wraps anyway
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned) as ClaudeResponse;
  } catch {
    console.warn("Warning: Claude response was not valid JSON. Writing raw text fallback.");
    // Return a minimal valid structure so the rest of the pipeline still runs
    return {
      moments: [
        {
          quote: "See raw Claude output below",
          why_viral: "Could not parse structured response.",
          hooks: [rawText.slice(0, 80), "", ""],
        },
      ],
      best_carousel_moment: 0,
      carousel_slides: Array(8).fill(rawText.slice(0, 120)),
    };
  }
}

// ---------------------------------------------------------------------------
// Step 3 — Output files
// ---------------------------------------------------------------------------

function buildHooksMd(
  parsed: ClaudeResponse,
  platform: Platform,
  inputPath: string,
  date: string,
): string {
  const lines: string[] = [];
  lines.push(`# Viral Hooks — ${date}`);
  lines.push(`Platform: ${platform}`);
  lines.push(`Source: ${inputPath}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  parsed.moments.forEach((moment, i) => {
    lines.push(`## Moment ${i + 1}`);
    lines.push(`**Quote:** "${moment.quote}"`);
    lines.push(`**Why viral:** ${moment.why_viral}`);
    lines.push("");
    lines.push(`**Hook A:** ${moment.hooks[0]}`);
    lines.push(`**Hook B:** ${moment.hooks[1]}`);
    lines.push(`**Hook C:** ${moment.hooks[2]}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  const bestIdx = parsed.best_carousel_moment ?? 0;
  lines.push(`## Best Carousel Moment: Moment ${bestIdx + 1}`);
  lines.push("See carousel breakdown below ↓");

  return lines.join("\n");
}

function buildCarouselMd(parsed: ClaudeResponse, date: string): string {
  const bestIdx = parsed.best_carousel_moment ?? 0;
  const bestMoment = parsed.moments[bestIdx];
  const quote = bestMoment?.quote ?? "—";
  const slides = parsed.carousel_slides ?? [];

  const slideLabels = [
    "Slide 1 (Hook)",
    "Slide 2",
    "Slide 3",
    "Slide 4",
    "Slide 5",
    "Slide 6",
    "Slide 7",
    "Slide 8 (CTA)",
  ];

  const lines: string[] = [];
  lines.push(`# Carousel Breakdown — ${date}`);
  lines.push(`Based on: Moment ${bestIdx + 1} — "${quote}"`);
  lines.push("");
  lines.push("---");
  lines.push("");

  slideLabels.forEach((label, i) => {
    const text = slides[i] ?? "";
    lines.push(`**${label}:** ${text}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("*Generated by Content OS — ultradev.io*");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { input, platform, outDir } = parseArgs(process.argv);

  // Resolve to absolute path relative to cwd
  const inputPath = path.resolve(input);

  if (!existsSync(inputPath)) {
    console.error(`Error: input file not found: ${inputPath}`);
    process.exit(1);
  }

  ensureDir(outDir);

  // Step 1: Transcription
  let transcript: string;

  if (isVideo(inputPath)) {
    const result = await transcribeVideo(inputPath, outDir);
    transcript = result.transcript;
  } else if (isText(inputPath)) {
    const result = await readTextTranscript(inputPath);
    transcript = result.transcript;
  } else {
    const ext = path.extname(inputPath);
    console.error(
      `Error: unsupported file type "${ext}". Supported: .mp4, .mov, .mkv, .webm, .txt, .md`,
    );
    process.exit(1);
  }

  if (!transcript.trim()) {
    console.error("Error: transcript is empty.");
    process.exit(1);
  }

  // Step 2: Viral moment extraction
  const parsed = await extractViralMoments(transcript, platform);

  // Step 3: Write output files
  const date = todayDate();

  const hooksPath = path.join(outDir, `hooks-${date}.md`);
  const carouselPath = path.join(outDir, `carousel-${date}.md`);

  const hooksMd = buildHooksMd(parsed, platform, inputPath, date);
  const carouselMd = buildCarouselMd(parsed, date);

  await Bun.write(hooksPath, hooksMd);
  await Bun.write(carouselPath, carouselMd);

  console.log("");
  console.log(`Hooks written:    ${hooksPath}`);
  console.log(`Carousel written: ${carouselPath}`);
  console.log("");
  console.log(`Found ${parsed.moments.length} viral moment(s). Best carousel: Moment ${(parsed.best_carousel_moment ?? 0) + 1}.`);
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
