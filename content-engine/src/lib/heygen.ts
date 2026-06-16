/**
 * HeyGen avatar-video API client (UGC talking-head ads).
 * No SDK — plain fetch. Key read from HEYGEN_API_KEY (Bun auto-loads .env).
 *
 * Flow mirrors kling.ts: submit -> poll -> download mp4.
 *   - submitAvatarVideo()  : script text + avatar + voice -> video_id
 *   - pollVideo()          : wait until completed -> returns video_url
 *   - generateAvatarVideo(): submit + poll + download to outPath
 *   - listAvatars()/listVoices(): pick a German-speaking actor that fits the brand
 *
 * Use this for the "person talking to camera" spine of an ad; splice Kling
 * clips in as b-roll via the existing ffmpeg assemble pipeline.
 */
const BASE = "https://api.heygen.com";

function key(explicit?: string): string {
  const k = explicit ?? Bun.env.HEYGEN_API_KEY;
  if (!k) throw new Error("HEYGEN_API_KEY not set");
  return k;
}

async function api(method: "GET" | "POST", path: string, body?: unknown, explicitKey?: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "X-Api-Key": key(explicitKey), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { error?: unknown; code?: number; message?: string; data?: any };
  // HeyGen returns either {error:null,data} (v2) or {code:100,data} (v1) on success.
  if (!res.ok || (json.error != null && json.error !== false)) {
    throw new Error(`HeyGen ${method} ${path} -> http ${res.status} ${JSON.stringify(json.error ?? json.message ?? json)}`);
  }
  return json.data;
}

export interface AvatarVideoOpts {
  script: string; // the spoken line (HeyGen does TTS + lip-sync)
  avatarId: string; // from listAvatars()
  voiceId: string; // from listVoices() — pick a German voice for CH ads
  avatarStyle?: "normal" | "closeUp" | "circle"; // framing
  speed?: number; // 0.5..1.5
  background?: string; // hex colour, e.g. "#FAF6EF"; omit for default
  width?: number; // default 720
  height?: number; // default 1280 (9:16 vertical for Reels/Stories)
}

/** Submit an avatar talking-head video. Returns video_id. */
export async function submitAvatarVideo(o: AvatarVideoOpts): Promise<string> {
  const data = await api("POST", "/v2/video/generate", {
    video_inputs: [
      {
        character: { type: "avatar", avatar_id: o.avatarId, avatar_style: o.avatarStyle ?? "normal" },
        voice: { type: "text", input_text: o.script, voice_id: o.voiceId, ...(o.speed != null ? { speed: o.speed } : {}) },
        ...(o.background ? { background: { type: "color", value: o.background } } : {}),
      },
    ],
    dimension: { width: o.width ?? 720, height: o.height ?? 1280 },
  });
  return data.video_id as string;
}

/** Poll a video until it finishes; returns the finished mp4 URL. */
export async function pollVideo(
  videoId: string,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (status: string) => void } = {},
): Promise<string> {
  const intervalMs = opts.intervalMs ?? 6000;
  const deadline = Date.now() + (opts.timeoutMs ?? 900_000); // avatar renders are slower than Kling
  while (Date.now() < deadline) {
    const data = await api("GET", `/v1/video_status.get?video_id=${videoId}`);
    const status = data.status as string;
    opts.onTick?.(status);
    if (status === "completed") return data.video_url as string;
    if (status === "failed") throw new Error(`HeyGen video failed: ${JSON.stringify(data.error ?? "unknown")}`);
    await Bun.sleep(intervalMs);
  }
  throw new Error("HeyGen video timed out");
}

export async function downloadVideo(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  await Bun.write(outPath, await res.arrayBuffer());
}

/** Convenience: submit an avatar video, wait, download to outPath. */
export async function generateAvatarVideo(
  o: AvatarVideoOpts & { outPath: string; onTick?: (s: string) => void },
): Promise<string> {
  const id = await submitAvatarVideo(o);
  const url = await pollVideo(id, { onTick: o.onTick });
  await downloadVideo(url, o.outPath);
  return o.outPath;
}

export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  gender?: string;
  preview_image_url?: string;
}

/** List available avatars (and talking photos) so you can pick an actor that fits the brand. */
export async function listAvatars(explicitKey?: string): Promise<Avatar[]> {
  const data = await api("GET", "/v2/avatars", undefined, explicitKey);
  const avatars = (data.avatars ?? []) as Avatar[];
  return avatars;
}

export interface Voice {
  voice_id: string;
  name?: string;
  language?: string;
  gender?: string;
}

/** List voices; pass language e.g. "German" to filter to Swiss/DE-friendly voices. */
export async function listVoices(language?: string, explicitKey?: string): Promise<Voice[]> {
  const data = await api("GET", "/v2/voices", undefined, explicitKey);
  let voices = (data.voices ?? []) as Voice[];
  if (language) {
    const want = language.toLowerCase();
    voices = voices.filter((v) => (v.language ?? "").toLowerCase().includes(want));
  }
  return voices;
}

/** Free-ish sanity check that the key works (lists 1 page of avatars). */
export async function ping(explicitKey?: string): Promise<number> {
  const avatars = await listAvatars(explicitKey);
  return avatars.length;
}
