/**
 * TRENCH ROYALE trailer assembly pipeline (scene-based, iterable).
 *
 *  - Reads brands/trench-royale/edit.json (the scene timeline).
 *  - Each scene -> build/<id>.mp4 at 1080p, graded, with optional on-screen text.
 *      source = clips/<id>.mp4 if it exists (the real i2v shot),
 *               else stills/<still>.png (ken-burns animatic placeholder).
 *  - Concats all scenes, muxes the narrator VO (+ optional music) -> output/trailer.
 *
 * Iterate: drop a real i2v clip in clips/<id>.mp4 and re-run that one scene.
 *
 * Usage:
 *   bun scripts/produce-trench-trailer.ts                # render missing scenes + assemble
 *   bun scripts/produce-trench-trailer.ts --force        # re-render every scene
 *   bun scripts/produce-trench-trailer.ts 03 10          # re-render only these scene ids, then assemble
 */
const ROOT = 'brands/trench-royale';
const cfg = (await Bun.file(`${ROOT}/edit.json`).json()) as any;
const W = cfg.width ?? 1920, H = cfg.height ?? 1080, FPS = cfg.fps ?? 30;
const FONT = cfg.fontFile;
const GRADE = cfg.grade ?? 'eq=contrast=1.08:saturation=1.12';

const args = Bun.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

async function exists(p: string) { return await Bun.file(p).exists(); }

async function run(argv: string[]): Promise<void> {
  const proc = Bun.spawn(['ffmpeg', '-hide_banner', '-loglevel', 'error', ...argv], {
    stdout: 'pipe', stderr: 'pipe',
  });
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`ffmpeg failed (${code}):\n${err}`);
  }
}

/** ffmpeg drawtext, escaped. Text must not contain single quotes. */
function drawtext(text: string, opts: { size: number; color: string; y: string }): string {
  const t = text.replace(/:/g, '\\:').replace(/'/g, '');
  return `drawtext=fontfile=${FONT}:text='${t}':fontcolor=${opts.color}:fontsize=${opts.size}` +
    `:x=(w-tw)/2:y=${opts.y}:shadowcolor=black@0.85:shadowx=4:shadowy=4` +
    `:alpha='if(lt(t,0.4),t/0.4,1)'`;
}

const cover = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS}`;
const kenburns = `zoompan=z='min(zoom+0.0009,1.14)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`;

async function renderScene(s: any): Promise<string> {
  const out = `${ROOT}/build/${s.id}.mp4`;
  const wantOnly = only.length > 0 && !only.some((o) => s.id.includes(o));
  if (wantOnly) return out;
  if (!force && only.length === 0 && (await exists(out))) { console.log(`  · cached ${s.id}`); return out; }

  const txt = s.text ? `,${drawtext(s.text, { size: 80, color: 'white', y: 'h*0.76' })}` : '';

  if (s.logo) {
    // generated title card
    const title = drawtext(s.title ?? 'TRENCH ROYALE', { size: 150, color: '0xE6B422', y: '(h-th)/2-50' });
    const tag = s.text ? `,${drawtext(s.text, { size: 46, color: 'white', y: 'h/2+90' })}` : '';
    await run([
      '-f', 'lavfi', '-t', String(s.dur), '-i', `color=c=0x0a0a0f:s=${W}x${H}:r=${FPS}`,
      '-vf', `${title}${tag},vignette=PI/5`,
      '-an', '-t', String(s.dur), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-y', out,
    ]);
    console.log(`  ✓ logo  ${s.id}`);
    return out;
  }

  const clip = `${ROOT}/clips/${s.id}.mp4`;
  const useClip = await exists(clip);
  const still = `${ROOT}/stills/${s.still}.png`;

  if (useClip) {
    await run([
      '-i', clip,
      '-vf', `${cover},${GRADE}${txt}`,
      '-an', '-t', String(s.dur), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-y', out,
    ]);
    console.log(`  ✓ CLIP  ${s.id}`);
  } else {
    if (!(await exists(still))) { console.log(`  ✗ MISSING ${s.id} (no clip, no still ${s.still})`); throw new Error(`no source for ${s.id}`); }
    await run([
      '-loop', '1', '-t', String(s.dur), '-i', still,
      '-vf', `${cover},${kenburns},${GRADE}${txt}`,
      '-an', '-t', String(s.dur), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-y', out,
    ]);
    console.log(`  ✓ still ${s.id} (animatic)`);
  }
  return out;
}

console.log('🎬 Rendering scenes...');
const built: string[] = [];
for (const s of cfg.scenes) built.push(await renderScene(s));

// concat (all scenes share codec/res/fps -> stream copy)
const listPath = `${ROOT}/build/concat.txt`;
const abs = (p: string) => `${process.cwd()}/${p}`;
await Bun.write(listPath, cfg.scenes.map((s: any) => `file '${abs(`${ROOT}/build/${s.id}.mp4`)}'`).join('\n') + '\n');
const master = `${ROOT}/build/master.mp4`;
await run(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', '-y', master]);
console.log('🎞️  concatenated -> master.mp4');

// mux VO (+ music)
const vo = `${ROOT}/${cfg.voPath}`;
const music = cfg.musicPath ? `${ROOT}/${cfg.musicPath}` : null;
const hasVo = await exists(vo);
const hasMusic = music ? await exists(music) : false;
const outFinal = `${ROOT}/output/trench-royale-trailer.mp4`;

if (hasVo && hasMusic) {
  await run([
    '-i', master, '-i', vo, '-i', music!,
    '-filter_complex', `[1:a]volume=1,apad[vo];[2:a]volume=0.18[bg];[vo][bg]amix=inputs=2:duration=first[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-y', outFinal,
  ]);
} else if (hasVo) {
  await run([
    '-i', master, '-i', vo,
    '-filter_complex', `[1:a]volume=1,apad[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-y', outFinal,
  ]);
} else {
  await run(['-i', master, '-c', 'copy', '-y', outFinal]);
  console.log('  (no VO found — silent cut)');
}

console.log(`\n✅ DONE -> ${outFinal}`);
console.log('   Iterate: drop a real i2v shot in clips/<scene-id>.mp4 and re-run (or `bun scripts/produce-trench-trailer.ts <id>`).');
