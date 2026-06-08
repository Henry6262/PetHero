import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Manifest, VideoRecord, VideoStatus } from "./types";

export const STATUS_ORDER: VideoStatus[] = [
  "idea", "scripted", "refs-ready", "generating",
  "assembled", "approved", "scheduled", "posted", "measured",
];

function nowIso(): string {
  return new Date().toISOString();
}

export function emptyManifest(): Manifest {
  return { version: 1, videos: [] };
}

export function loadManifest(path: string): Manifest {
  if (!existsSync(path)) return emptyManifest();
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}

export function saveManifest(path: string, m: Manifest): void {
  writeFileSync(path, JSON.stringify(m, null, 2));
}

export function addVideo(
  m: Manifest,
  init: Partial<VideoRecord> & { brand: string; concept: string },
): VideoRecord {
  const id = `${init.brand}-${init.concept}-${m.videos.length + 1}`;
  const rec: VideoRecord = {
    id,
    brand: init.brand,
    concept: init.concept,
    status: "idea",
    shots: init.shots ?? [],
    voPath: init.voPath,
    musicPath: init.musicPath,
    captionsPath: init.captionsPath,
    outputPath: init.outputPath,
    history: [{ status: "idea", at: nowIso() }],
  };
  m.videos.push(rec);
  return rec;
}

export function transition(
  rec: VideoRecord,
  to: VideoStatus,
  now: string = nowIso(),
): VideoRecord {
  const from = STATUS_ORDER.indexOf(rec.status);
  const dest = STATUS_ORDER.indexOf(to);
  if (dest < 0) throw new Error(`unknown status: ${to}`);
  if (dest <= from) throw new Error(`cannot move ${rec.status} -> ${to} (not forward)`);
  rec.status = to;
  rec.history.push({ status: to, at: now });
  return rec;
}
