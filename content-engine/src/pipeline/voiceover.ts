/**
 * Generate a concept's voiceover from its vo.txt via ElevenLabs.
 * Usage: bun run src/pipeline/voiceover.ts <brand> <concept> [voiceId]
 * Writes: brands/<brand>/assets/vo/<concept>.mp3
 */
import { tts } from "../lib/elevenlabs";

const [brand, concept, voiceId] = process.argv.slice(2);
if (!brand || !concept) {
  console.error("usage: bun run src/pipeline/voiceover.ts <brand> <concept> [voiceId]");
  process.exit(1);
}

const scriptPath = `brands/${brand}/concepts/${concept}/vo.txt`;
const text = (await Bun.file(scriptPath).text()).trim();
if (!text) throw new Error(`empty script: ${scriptPath}`);

console.log(`Generating voiceover for ${brand}/${concept} — ${text.length} chars...`);
const audio = await tts({ text, voiceId });
const out = `brands/${brand}/assets/vo/${concept}.mp3`;
await Bun.write(out, audio);
console.log(`✓ Voiceover written: ${out} (${(audio.byteLength / 1024).toFixed(1)} KB)`);
