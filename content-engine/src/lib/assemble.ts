export interface AssembleOpts {
  clips: string[];          // >= 1 input video paths (in order)
  voPath?: string;          // voiceover audio (full volume)
  musicPath?: string;       // music bed (ducked)
  captionsPath?: string;    // .srt to burn in
  outPath: string;
  width?: number;           // default 1080
  height?: number;          // default 1920
  fps?: number;             // default 30
  musicVolume?: number;     // default 0.2
  zoom?: boolean;           // subtle ken-burns, default true
}

/** Build the full ffmpeg argv for assembling one vertical video. */
export function buildAssembleArgs(o: AssembleOpts): string[] {
  if (o.clips.length === 0) throw new Error("buildAssembleArgs: need >=1 clip");
  const W = o.width ?? 1080;
  const H = o.height ?? 1920;
  const FPS = o.fps ?? 30;

  const args: string[] = ["-y"];
  for (const c of o.clips) args.push("-i", c);

  let idx = o.clips.length;
  let voIdx = -1;
  let musicIdx = -1;
  if (o.voPath) { args.push("-i", o.voPath); voIdx = idx++; }
  if (o.musicPath) { args.push("-i", o.musicPath); musicIdx = idx++; }

  const filters: string[] = [];

  // 1. normalize each clip to the vertical canvas
  o.clips.forEach((_, i) => {
    filters.push(
      `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,` +
        `crop=${W}:${H},setsar=1,fps=${FPS}[v${i}]`,
    );
  });

  // 2. concat video streams
  const vlabels = o.clips.map((_, i) => `[v${i}]`).join("");
  filters.push(`${vlabels}concat=n=${o.clips.length}:v=1:a=0[vcat]`);
  let vout = "vcat";

  // 3. subtle slow zoom
  if (o.zoom ?? true) {
    filters.push(
      `[${vout}]zoompan=z='min(zoom+0.0005,1.1)':d=1:` +
        `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}[vz]`,
    );
    vout = "vz";
  }

  // 4. burn captions
  if (o.captionsPath) {
    filters.push(`[${vout}]subtitles=${o.captionsPath}[vsub]`);
    vout = "vsub";
  }

  // 5. audio: VO (full) + music (ducked), mixed
  let aout: string | null = null;
  const parts: string[] = [];
  if (voIdx >= 0) { filters.push(`[${voIdx}:a]volume=1[vo]`); parts.push("vo"); }
  if (musicIdx >= 0) {
    filters.push(`[${musicIdx}:a]volume=${o.musicVolume ?? 0.2}[bg]`);
    parts.push("bg");
  }
  if (parts.length === 2) {
    filters.push(`[${parts[0]}][${parts[1]}]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
    aout = "aout";
  } else if (parts.length === 1) {
    aout = parts[0];
  }

  args.push("-filter_complex", filters.join(";"));
  args.push("-map", `[${vout}]`);
  if (aout) args.push("-map", `[${aout}]`);
  args.push("-map_metadata", "-1"); // strip metadata (avoids false AI-flag)
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS));
  if (aout) args.push("-c:a", "aac", "-shortest");
  args.push(o.outPath);
  return args;
}
