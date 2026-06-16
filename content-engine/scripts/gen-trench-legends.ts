/**
 * Generate Trench Royale "Earth's Mightiest Degens" character reference stills
 * via the native Kling image API. ORIGINAL characters only (no real names).
 *
 * Usage:
 *   bun scripts/gen-trench-legends.ts                 # all characters, n from prompts.json
 *   bun scripts/gen-trench-legends.ts 01 05 08        # only matching slugs (prefix match)
 *   bun scripts/gen-trench-legends.ts --n=2           # override images-per-character
 *   bun scripts/gen-trench-legends.ts --model=kling-v2 --n=1
 *
 * Output: brands/trench-royale/characters/<slug>/<slug>-<i>.png
 */
import { accountCosts, generateImages, downloadFile, type T2IOpts } from '../src/lib/kling';

interface Char {
  slug: string;
  name: string;
  prompt: string;
  aspectRatio?: T2IOpts['aspectRatio'];
}
interface PromptFile {
  style: string;
  negative: string;
  aspectRatio: T2IOpts['aspectRatio'];
  resolution: T2IOpts['resolution'];
  n: number;
  characters: Char[];
}

const ROOT = 'brands/trench-royale/characters';
const cfg = (await Bun.file(`${ROOT}/prompts.json`).json()) as PromptFile;

const args = Bun.argv.slice(2);
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => a.replace(/^--/, '').split('=')),
);
const filters = args.filter((a) => !a.startsWith('--'));
const nOverride = flags.n ? Number(flags.n) : undefined;
const model = flags.model as string | undefined;

const targets = filters.length
  ? cfg.characters.filter((c) => filters.some((f) => c.slug.startsWith(f) || c.slug.includes(f)))
  : cfg.characters;

// --- balance check (free) ---
try {
  const d = await accountCosts();
  const pack = d?.resource_pack_subscribe_infos?.[0];
  if (pack) {
    console.log(`💳 Kling pack "${pack.resource_pack_name}" — ${pack.remaining_quantity}/${pack.total_quantity} units left`);
    if (pack.remaining_quantity < 2) {
      console.log('⚠️  Almost no credits. Top up the API resource pack at app.klingai.com/global/dev before generating.');
    }
  }
} catch (e) {
  console.log('⚠️  could not read balance:', (e as Error).message);
}

console.log(`\n🎨 Generating ${targets.length} character(s), n=${nOverride ?? cfg.n} each\n`);

for (const c of targets) {
  const outDir = `${ROOT}/${c.slug}`;
  const fullPrompt = `${cfg.style} ${c.prompt}`;
  console.log(`→ ${c.name}  [${c.slug}]`);
  try {
    const urls = await generateImages({
      prompt: fullPrompt,
      negativePrompt: cfg.negative,
      model,
      aspectRatio: c.aspectRatio ?? cfg.aspectRatio,
      resolution: cfg.resolution,
      n: nOverride ?? cfg.n,
      onTick: (s) => process.stdout.write(`   …${s}\r`),
    });
    let i = 1;
    for (const url of urls) {
      const out = `${outDir}/${c.slug}-${i}.png`;
      await downloadFile(url, out);
      console.log(`   ✓ ${out}`);
      i++;
    }
  } catch (e) {
    console.error(`   ✗ ${c.slug}: ${(e as Error).message}`);
  }
}

console.log('\n✅ done. Pick the best take per character; those become the i2v reference inputs.');
