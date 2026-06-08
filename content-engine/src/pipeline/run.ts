import { loadManifest, saveManifest, addVideo, transition } from "../manifest";
import { buildAssembleArgs } from "../lib/assemble";
import { runFfmpeg } from "../lib/ffmpeg";
import { transcribe, segmentsToSrt } from "../lib/captions";

export interface RunVideoOpts {
  manifestPath: string;
  brand: string;
  concept: string;
  clips: string[];          // provided clip paths (Phase 0: generated manually / free tier)
  voPath?: string;
  musicPath?: string;
  outPath: string;
  caption?: boolean;        // when true and voPath set, transcribe vo -> burned .srt
}

/** Phase 0 hybrid path: provided clips -> (optional captions) -> ffmpeg assemble -> output. */
export async function runVideo(o: RunVideoOpts): Promise<string> {
  const m = loadManifest(o.manifestPath);
  const rec = addVideo(m, {
    brand: o.brand,
    concept: o.concept,
    shots: o.clips,
    voPath: o.voPath,
    musicPath: o.musicPath,
  });

  let captionsPath: string | undefined;
  if (o.caption && o.voPath) {
    const segs = await transcribe(o.voPath);
    captionsPath = o.outPath.replace(/\.\w+$/, ".srt");
    await Bun.write(captionsPath, segmentsToSrt(segs));
    rec.captionsPath = captionsPath;
  }

  transition(rec, "generating");
  await runFfmpeg(
    buildAssembleArgs({
      clips: o.clips,
      voPath: o.voPath,
      musicPath: o.musicPath,
      captionsPath,
      outPath: o.outPath,
    }),
  );
  rec.outputPath = o.outPath;
  transition(rec, "assembled");

  saveManifest(o.manifestPath, m);
  return o.outPath;
}
