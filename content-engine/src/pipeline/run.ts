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
  // persist the record before expensive steps so state is resumable on crash.
  saveManifest(o.manifestPath, m);

  transition(rec, "generating");
  saveManifest(o.manifestPath, m);

  try {
    let captionsPath: string | undefined;
    if (o.caption && o.voPath) {
      const segs = await transcribe(o.voPath);
      captionsPath = o.outPath.replace(/\.\w+$/, ".srt");
      await Bun.write(captionsPath, segmentsToSrt(segs));
      rec.captionsPath = captionsPath;
    }

    await runFfmpeg(
      buildAssembleArgs({
        clips: o.clips,
        voPath: o.voPath,
        musicPath: o.musicPath,
        captionsPath,
        outPath: o.outPath,
      }),
    );
  } catch (err) {
    // leave the record in its `generating` state on disk for resume, then re-throw.
    saveManifest(o.manifestPath, m);
    throw err;
  }

  rec.outputPath = o.outPath;
  transition(rec, "assembled");

  saveManifest(o.manifestPath, m);
  return o.outPath;
}
