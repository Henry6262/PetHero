/**
 * Minimal ElevenLabs text-to-speech client (no SDK — just fetch).
 * Key is read from ELEVENLABS_API_KEY (Bun auto-loads content-engine/.env).
 */
export interface TtsOpts {
  text: string;
  voiceId?: string; // default: a deep mythic narrator (Adam)
  modelId?: string; // default: eleven_multilingual_v2 (stable flagship)
  apiKey?: string;
  outputFormat?: string; // default: mp3_44100_128
  stability?: number; // 0..1 — lower = more expressive
  similarityBoost?: number; // 0..1
  style?: number; // 0..1 — exaggeration
  speed?: number; // 0.7..1.2 — <1 = slower / more ASMR
}

/** Generate speech, returning the raw audio bytes (mp3 by default). */
export async function tts(o: TtsOpts): Promise<Uint8Array> {
  const apiKey = o.apiKey ?? Bun.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");
  const voiceId = o.voiceId ?? "pNInz6obpgDQGcFmaJgB"; // "Adam" — deep narrator
  const modelId = o.modelId ?? "eleven_multilingual_v2";
  const fmt = o.outputFormat ?? "mp3_44100_128";

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${fmt}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: o.text,
        model_id: modelId,
        voice_settings: {
          stability: o.stability ?? 0.45,
          similarity_boost: o.similarityBoost ?? 0.9,
          style: o.style ?? 0.35,
          use_speaker_boost: true,
          ...(o.speed != null ? { speed: o.speed } : {}),
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** List the account's available voices (id + name) — handy for picking a narrator. */
export async function listVoices(
  apiKey: string | undefined = Bun.env.ELEVENLABS_API_KEY,
): Promise<{ voice_id: string; name: string; category?: string }[]> {
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { voices: { voice_id: string; name: string; category?: string }[] };
  return json.voices.map((v) => ({ voice_id: v.voice_id, name: v.name, category: v.category }));
}
