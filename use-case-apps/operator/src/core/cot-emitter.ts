import type { Asset, FusedTrack, TheaterMission } from "../shared/index.ts";

/**
 * Convert a JavaScript Date to the CoT timestamp format: 2026-07-10T06:38:12Z
 */
function cotTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function uid(prefix: string, id: string): string {
  return `operator-${prefix}-${id}`;
}

function classificationToCotType(
  classification: FusedTrack["classification"],
  affiliation: "hostile" | "friendly" | "neutral" | "unknown" = "hostile"
): string {
  // CoT type format: a-[affiliation]-[domain]-...
  // Ground unknown: a-u-G, hostile person: a-h-G-U-C-I, hostile UAV: a-h-A-M-F-q, etc.
  const aff = {
    hostile: "h",
    friendly: "f",
    neutral: "n",
    unknown: "u",
  }[affiliation];

  switch (classification) {
    case "UAV":
      return `a-${aff}-A-M-F-q`;
    case "VEHICLE":
      return `a-${aff}-G-E-V-C-T`;
    case "PERSON":
      return `a-${aff}-G-U-C-I`;
    case "AIRCRAFT":
      return `a-${aff}-A-M-F`;
    case "VESSEL":
      return `a-${aff}-S-M`;
    default:
      return `a-${aff}-G`;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface CotEventOptions {
  staleSeconds?: number;
  how?: string;
  callsign?: string;
  remarks?: string;
}

export function trackToCotXml(track: FusedTrack, options: CotEventOptions = {}): string {
  const now = new Date();
  const stale = new Date(now.getTime() + (options.staleSeconds ?? 30) * 1000);
  const type = classificationToCotType(track.classification ?? "UNKNOWN");
  const callsign = options.callsign ?? track.id;
  const remarks =
    options.remarks ??
    `classification:${track.classification ?? "UNKNOWN"} confidence:${track.confidence} sources:${track.sourceIds.join(
      ","
    )}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0" uid="${uid("track", track.id)}" type="${type}" time="${cotTime(
    now
  )}" start="${cotTime(now)}" stale="${cotTime(stale)}" how="${options.how ?? "m-g"}">
  <detail>
    <contact callsign="${escapeXml(callsign)}"/>
    <remarks>${escapeXml(remarks)}</remarks>
  </detail>
  <point lat="${track.lat}" lon="${track.lon}" hae="${track.altitude ?? 0}" ce="${Math.sqrt(
    track.covariance.ee
  )}" le="9999999"/>
</event>`;
}

export function assetToCotXml(asset: Asset, options: CotEventOptions = {}): string {
  const now = new Date();
  const stale = new Date(now.getTime() + (options.staleSeconds ?? 60) * 1000);
  const type = asset.role === "scout" ? "a-f-A-M-F-q" : "a-f-G-U-C-I";
  const callsign = options.callsign ?? asset.name;
  const remarks =
    options.remarks ??
    `role:${asset.role} status:${asset.status} battery:${asset.batteryPct ?? "unknown"}%`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0" uid="${uid("asset", asset.id)}" type="${type}" time="${cotTime(
    now
  )}" start="${cotTime(now)}" stale="${cotTime(stale)}" how="${options.how ?? "m-g"}">
  <detail>
    <contact callsign="${escapeXml(callsign)}"/>
    <remarks>${escapeXml(remarks)}</remarks>
  </detail>
  <point lat="${asset.lat}" lon="${asset.lon}" hae="0" ce="10" le="9999999"/>
</event>`;
}

export function missionToCotXml(mission: TheaterMission, assets: Asset[], options: CotEventOptions = {}): string {
  const events = assets.map((a) => assetToCotXml(a, options));
  return events.join("\n");
}

export function tracksToCotXml(tracks: FusedTrack[], options: CotEventOptions = {}): string {
  return tracks.map((t) => trackToCotXml(t, options)).join("\n");
}
