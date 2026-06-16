/**
 * Generate the TRENCH ROYALE trailer SHOTS with Kling image-to-video (like Krava).
 * For each scene: still (init image) + motion prompt -> real animated 5s clip -> clips/<id>.mp4.
 * Then run produce-trench-trailer.ts to assemble with the ElevenLabs VO.
 *
 * Usage:
 *   bun scripts/gen-trench-clips.ts                 # generate all shots that have a still
 *   bun scripts/gen-trench-clips.ts 01 03           # only these scene ids
 *   bun scripts/gen-trench-clips.ts --mode=pro      # 1080p (default std)
 */
import { accountCosts, generateImage2Video } from '../src/lib/kling';

const ROOT = 'brands/trench-royale';
const shotsCfg = (await Bun.file(`${ROOT}/i2v-shots.json`).json()) as any;

// scene id -> still file (heroes/villain). Scenes without a still (assemble/logo) are skipped here.
const STILL: Record<string, string> = {
  '01-alon-hook': 'alon',
  '02-snap-death': 'sbf',
  '03-alon-revive': 'alon',
  '04-toly': 'toly',
  '05-mert': 'mert',
  '06-ansem': 'ansem',
  '07-murad': 'murad',
  '08-dino-spike': 'vucan',
  '09-villain-escalate': 'sbf',
};

const args = Bun.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.replace(/^--/, '').split('=')));
const only = args.filter((a) => !a.startsWith('--'));
const mode = (flags.mode as 'std' | 'pro') ?? 'std';

// balance check
try {
  const d = await accountCosts();
  const p = d?.resource_pack_subscribe_infos?.[0];
  if (p) {
    console.log(`💳 ${p.resource_pack_name}: ${p.remaining_quantity}/${p.total_quantity} units`);
    if (p.remaining_quantity < 5) {
      console.log('⚠️  Not enough Kling API units to generate video. Top up the pack at app.klingai.com/global/dev,');
      console.log('   OR generate each shot in the Kling 3.0 web UI (image-to-video) and drop them in clips/<id>.mp4.');
    }
  }
} catch (e) { console.log('⚠️ balance check failed:', (e as Error).message); }

const shots = shotsCfg.shots.filter((s: any) => STILL[s.id] && (only.length === 0 || only.some((o) => s.id.includes(o))));
console.log(`\n🎥 Generating ${shots.length} shot(s) via Kling i2v (mode=${mode})\n`);

for (const s of shots) {
  const stillPath = `${ROOT}/stills/${STILL[s.id]}.png`;
  const out = `${ROOT}/clips/${s.id}.mp4`;
  if (await Bun.file(out).exists()) { console.log(`  · exists ${s.id}`); continue; }
  const b64 = Buffer.from(await Bun.file(stillPath).arrayBuffer()).toString('base64');
  console.log(`→ ${s.id}  (init: ${STILL[s.id]}.png)`);
  try {
    await generateImage2Video({
      image: b64,
      prompt: s.prompt,
      negativePrompt: shotsCfg.negative,
      mode,
      duration: '5',
      outPath: out,
      onTick: (st) => process.stdout.write(`   …${st}\r`),
    });
    console.log(`   ✓ ${out}`);
  } catch (e) {
    console.error(`   ✗ ${s.id}: ${(e as Error).message}`);
  }
}

console.log('\n✅ shots done. Now: bun scripts/produce-trench-trailer.ts  (assembles clips + VO into the trailer)');
