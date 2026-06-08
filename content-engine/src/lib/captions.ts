export interface Segment {
  start: number;
  end: number;
  text: string;
}

export function formatSrtTime(sec: number): string {
  const ms = Math.round(sec * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const milli = ms % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(milli, 3)}`;
}

export function segmentsToSrt(segs: Segment[]): string {
  return segs
    .map(
      (s, i) =>
        `${i + 1}\n${formatSrtTime(s.start)} --> ${formatSrtTime(s.end)}\n${s.text}\n`,
    )
    .join("\n");
}

/**
 * Transcribe an audio file with OpenAI whisper-1 (returns segment timings).
 * whisper-1 is required: the gpt-4o transcribe models do not expose timestamps.
 */
export async function transcribe(
  audioPath: string,
  apiKey: string | undefined = Bun.env.OPENAI_API_KEY,
): Promise<Segment[]> {
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const form = new FormData();
  form.append("file", new Blob([await Bun.file(audioPath).arrayBuffer()]), "audio.m4a");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`whisper ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { segments: Segment[] };
  return json.segments.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
}
