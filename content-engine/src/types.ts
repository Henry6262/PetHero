export type VideoStatus =
  | "idea"
  | "scripted"
  | "refs-ready"
  | "generating"
  | "assembled"
  | "approved"
  | "scheduled"
  | "posted"
  | "measured";

export interface VideoRecord {
  id: string;
  brand: string;
  concept: string;
  status: VideoStatus;
  shots: string[];          // ordered clip file paths
  voPath?: string;
  musicPath?: string;
  captionsPath?: string;
  outputPath?: string;
  history: { status: VideoStatus; at: string }[];
}

export interface Manifest {
  version: 1;
  videos: VideoRecord[];
}
