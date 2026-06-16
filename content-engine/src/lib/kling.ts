/**
 * Kling AI native developer API client (global host).
 * Auth: HS256 JWT from KLING_ACCESS_KEY / KLING_SECRET_KEY (Bun loads .env).
 * Flow: submit task -> poll -> download mp4. Query calls don't cost credits.
 */
import { createHmac } from 'node:crypto';

const HOST = 'https://api-singapore.klingai.com';

const b64url = (s: string) => Buffer.from(s).toString('base64url');

/** Build a short-lived (30 min) HS256 JWT, signed with the secret key. */
function token(): string {
  const ak = Bun.env.KLING_ACCESS_KEY;
  const sk = Bun.env.KLING_SECRET_KEY;
  if (!ak || !sk) throw new Error('KLING_ACCESS_KEY / KLING_SECRET_KEY not set');
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ iss: ak, exp: now + 1800, nbf: now - 5 }));
  const sig = createHmac('sha256', sk).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

async function api(method: 'GET' | 'POST', path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { code?: number; message?: string; data?: any };
  if (!res.ok || json.code !== 0) {
    throw new Error(`Kling ${method} ${path} -> http ${res.status} code=${json.code} ${json.message ?? ''}`);
  }
  return json.data;
}

export type Kind = 'text2video' | 'image2video';

// ---------------------------------------------------------------------------
// Image generation (native Kling text-to-image). Cheaper than video for
// character reference stills, supports up to 9 images/call at 2k.
// ---------------------------------------------------------------------------

export interface T2IOpts {
  prompt: string;
  negativePrompt?: string;
  model?: string; // kling-v1 | kling-v1-5 | kling-v2 | kling-v2-1 (default v2-1)
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '21:9';
  resolution?: '1k' | '2k';
  n?: number; // 1-9
}

export async function submitText2Image(o: T2IOpts): Promise<string> {
  const data = await api('POST', '/v1/images/generations', {
    model_name: o.model ?? 'kling-v2-1',
    prompt: o.prompt,
    negative_prompt: o.negativePrompt,
    aspect_ratio: o.aspectRatio ?? '3:4',
    resolution: o.resolution ?? '2k',
    n: o.n ?? 1,
  });
  return data.task_id as string;
}

/** Poll an image task until it succeeds; returns the generated image URLs. */
export async function pollImages(
  taskId: string,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (status: string) => void } = {},
): Promise<string[]> {
  const intervalMs = opts.intervalMs ?? 4000;
  const deadline = Date.now() + (opts.timeoutMs ?? 300_000);
  while (Date.now() < deadline) {
    const data = await api('GET', `/v1/images/generations/${taskId}`);
    opts.onTick?.(data.task_status);
    if (data.task_status === 'succeed') {
      return (data.task_result?.images ?? []).map((im: { url: string }) => im.url);
    }
    if (data.task_status === 'failed') throw new Error(`Kling image failed: ${data.task_status_msg ?? 'unknown'}`);
    await Bun.sleep(intervalMs);
  }
  throw new Error('Kling image generation timed out');
}

/** Convenience: submit a text-to-image, wait, return image URLs. */
export async function generateImages(o: T2IOpts & { onTick?: (s: string) => void }): Promise<string[]> {
  const id = await submitText2Image(o);
  return pollImages(id, { onTick: o.onTick });
}

/** Download any URL (image or video) to a local path. */
export async function downloadFile(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  await Bun.write(outPath, await res.arrayBuffer());
}

/** Free auth check (QPS<=1). code:0 => keys valid + API plan active. Returns resource packs. */
export async function accountCosts(): Promise<any> {
  const end = Date.now();
  const start = end - 30 * 24 * 3600 * 1000;
  return api('GET', `/account/costs?start_time=${start}&end_time=${end}`);
}

export interface T2VOpts {
  prompt: string;
  negativePrompt?: string;
  model?: string; // default kling-v2-5-turbo
  mode?: 'std' | 'pro';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  duration?: '5' | '10';
}

export async function submitText2Video(o: T2VOpts): Promise<string> {
  const data = await api('POST', '/v1/videos/text2video', {
    model_name: o.model ?? 'kling-v2-5-turbo',
    prompt: o.prompt,
    negative_prompt: o.negativePrompt,
    mode: o.mode ?? 'std',
    aspect_ratio: o.aspectRatio ?? '9:16',
    duration: o.duration ?? '5',
  });
  return data.task_id as string;
}

export interface I2VOpts {
  image: string; // raw base64 (NO data: prefix) OR an https URL
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  mode?: 'std' | 'pro';
  duration?: '5' | '10';
}

export async function submitImage2Video(o: I2VOpts): Promise<string> {
  const data = await api('POST', '/v1/videos/image2video', {
    model_name: o.model ?? 'kling-v2-5-turbo',
    image: o.image,
    prompt: o.prompt,
    negative_prompt: o.negativePrompt,
    mode: o.mode ?? 'std',
    duration: o.duration ?? '5',
  });
  return data.task_id as string;
}

/** Poll a task until it succeeds; returns the finished video URL. */
export async function pollTask(
  kind: Kind,
  taskId: string,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (status: string) => void } = {},
): Promise<string> {
  const intervalMs = opts.intervalMs ?? 5000;
  const deadline = Date.now() + (opts.timeoutMs ?? 600_000);
  while (Date.now() < deadline) {
    const data = await api('GET', `/v1/videos/${kind}/${taskId}`);
    opts.onTick?.(data.task_status);
    if (data.task_status === 'succeed') return data.task_result.videos[0].url as string;
    if (data.task_status === 'failed') throw new Error(`Kling ${kind} failed: ${data.task_status_msg ?? 'unknown'}`);
    await Bun.sleep(intervalMs);
  }
  throw new Error(`Kling ${kind} timed out`);
}

export async function downloadVideo(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  await Bun.write(outPath, await res.arrayBuffer());
}

/** Convenience: submit a text-to-video, wait, download to outPath. */
export async function generateText2Video(o: T2VOpts & { outPath: string; onTick?: (s: string) => void }): Promise<string> {
  const id = await submitText2Video(o);
  const url = await pollTask('text2video', id, { onTick: o.onTick });
  await downloadVideo(url, o.outPath);
  return o.outPath;
}

/** Convenience: submit an image-to-video, wait, download to outPath. */
export async function generateImage2Video(o: I2VOpts & { outPath: string; onTick?: (s: string) => void }): Promise<string> {
  const id = await submitImage2Video(o);
  const url = await pollTask('image2video', id, { onTick: o.onTick });
  await downloadVideo(url, o.outPath);
  return o.outPath;
}
