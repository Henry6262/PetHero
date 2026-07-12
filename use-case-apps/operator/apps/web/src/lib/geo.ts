import type { FeatureCollection, Point, Polygon, LineString } from "geojson";
import type { Asset, AssetRole, FusedTrack, MissionZone, RouteWaypoint, SensorFeed, Squadron } from "../types/data";
import type { TheaterSubSector, TheaterVector } from "@shared/theater";
import { covarianceToEllipse } from "@shared/geo";
import { AFFILIATION_THEME, SQUADRON_AFFILIATION_THEME, SQUADRON_STATUS_THEME } from "./theme";

/**
 * Convert a front-line polyline into a GeoJSON FeatureCollection.
 */
export function toFrontLineGeoJSON(frontLine: [number, number][]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: frontLine,
        },
        properties: { id: "front-line", label: "Line of Contact" },
      },
    ],
  };
}

export function squadronColor(
  affiliation: Squadron["affiliation"],
  status: Squadron["status"]
): string {
  if (status === "offline") return SQUADRON_STATUS_THEME.offline;
  if (status === "engaging") return SQUADRON_STATUS_THEME.engaging;
  return SQUADRON_AFFILIATION_THEME[affiliation]?.color ?? SQUADRON_AFFILIATION_THEME.unknown.color;
}

/** Single-letter symbol shown inside squadron pucks on the operational map. */
export const SQUADRON_TYPE_SYMBOL: Record<Squadron["type"], string> = {
  infantry: "I",
  armor: "A",
  artillery: "R",
  drone: "D",
  recon: "S",
  logistics: "L",
};

/** Shape symbol for each squadron type — replaces the generic circle puck. */
export const SQUADRON_TYPE_SHAPE: Record<Squadron["type"], string> = {
  infantry: "●",
  armor: "■",
  artillery: "▲",
  drone: "◆",
  recon: "★",
  logistics: "□",
};

export function zoneFillColor(affiliation: MissionZone["affiliation"]): string {
  return AFFILIATION_THEME[affiliation]?.fill ?? AFFILIATION_THEME.unknown.fill;
}

export function zoneBorderColor(affiliation: MissionZone["affiliation"]): string {
  return AFFILIATION_THEME[affiliation]?.color ?? AFFILIATION_THEME.unknown.color;
}

export function subSectorFillColor(affiliation: TheaterSubSector["affiliation"]): string {
  return AFFILIATION_THEME[affiliation]?.fill ?? AFFILIATION_THEME.unknown.fill;
}

export function subSectorBorderColor(affiliation: TheaterSubSector["affiliation"]): string {
  return AFFILIATION_THEME[affiliation]?.color ?? AFFILIATION_THEME.unknown.color;
}

/**
 * Convert dominance sub-sectors into a GeoJSON FeatureCollection.
 */
export function toSubSectorGeoJSON(sectors: TheaterSubSector[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: sectors.map((s) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [s.ring],
      },
      properties: {
        id: s.id,
        name: s.name,
        region: s.region,
        affiliation: s.affiliation,
        fillColor: subSectorFillColor(s.affiliation),
        borderColor: subSectorBorderColor(s.affiliation),
      },
    })),
  };
}

/**
 * Convert a list of squadrons into a GeoJSON FeatureCollection suitable for
 * MapLibre circle/symbol layers. Selection and hover state are attached as
 * feature properties so MapLibre can style them on the GPU.
 */
export function toSquadronGeoJSON(
  squadrons: Squadron[],
  selectedId?: string | null,
  hoveredId?: string | null
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: squadrons.map((sq) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [sq.lon, sq.lat],
      },
      properties: {
        id: sq.id,
        callsign: sq.callsign,
        type: sq.type,
        status: sq.status,
        affiliation: sq.affiliation,
        heading: sq.heading,
        speed: sq.speed,
        battery: sq.battery,
        selected: selectedId === sq.id,
        hovered: hoveredId === sq.id,
        color: squadronColor(sq.affiliation, sq.status),
        symbol: SQUADRON_TYPE_SYMBOL[sq.type] ?? "?",
        shape: SQUADRON_TYPE_SHAPE[sq.type] ?? "●",
      },
    })),
  };
}

const KM_PER_DEGREE_LAT = 111.32;

/** Build short heading lines so squadrons read as oriented units, not just dots. */
export function toSquadronHeadingGeoJSON(
  squadrons: Squadron[],
  lengthKm = 2.0
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: squadrons.map((sq) => {
      const kmPerDegLon = KM_PER_DEGREE_LAT * Math.cos((sq.lat * Math.PI) / 180);
      const rad = (sq.heading * Math.PI) / 180;
      const dLat = (lengthKm * Math.cos(rad)) / KM_PER_DEGREE_LAT;
      const dLon = (lengthKm * Math.sin(rad)) / kmPerDegLon;
      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [sq.lon, sq.lat],
            [sq.lon + dLon, sq.lat + dLat],
          ],
        },
        properties: {
          id: sq.id,
          color: squadronColor(sq.affiliation, sq.status),
        },
      };
    }),
  };
}

/**
 * Convert mission zones into a GeoJSON FeatureCollection. Each zone becomes a
 * polygon feature with styling metadata attached.
 */
export function toZoneGeoJSON(zones: MissionZone[]): FeatureCollection<Polygon | LineString> {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [zone.ring],
      },
      properties: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        affiliation: zone.affiliation,
        status: zone.status,
        label: zone.label ?? zone.name,
        fillColor: zoneFillColor(zone.affiliation),
        borderColor: zoneBorderColor(zone.affiliation),
        center: zone.center,
      },
    })),
  };
}

const SOURCE_COLORS = ["#f87171", "#60a5fa", "#fbbf24", "#34d399", "#a78bfa", "#f472b6"];

export function sourceColor(index: number): string {
  return SOURCE_COLORS[index % SOURCE_COLORS.length];
}

export function confidenceColor(confidence: number): string {
  // Low confidence = red, high confidence = green.
  const safe = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5;
  const r = Math.round(255 * (1 - safe));
  const g = Math.round(255 * safe);
  return `rgb(${r}, ${g}, 128)`;
}

/**
 * Convert fused tracks into a GeoJSON FeatureCollection.
 * Diamonds distinguish fused multi-sensor tracks from squadron pucks.
 */
export function toFusedTrackGeoJSON(tracks: FusedTrack[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: tracks.map((t) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [t.lon, t.lat],
      },
      properties: {
        id: t.id,
        confidence: t.confidence,
        sourceIds: t.sourceIds,
        assessment: t.assessment,
        color: confidenceColor(t.confidence),
        symbol: "◆",
      },
    })),
  };
}

/**
 * Convert raw sensor feeds into a GeoJSON FeatureCollection of ghost dots.
 */
export function toRawTrackGeoJSON(feeds: SensorFeed[]): FeatureCollection<Point> {
  const sourceIndex = new Map<string, number>();
  feeds.forEach((feed, i) => sourceIndex.set(feed.source.id, i));

  return {
    type: "FeatureCollection",
    features: feeds.flatMap((feed) =>
      feed.tracks.map((t) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [t.lon, t.lat],
        },
        properties: {
          id: t.id,
          sourceId: feed.source.id,
          sourceName: feed.source.name,
          color: sourceColor(sourceIndex.get(feed.source.id) ?? 0),
          isPlot: t.isPlot,
        },
      }))
    ),
  };
}

const ROLE_COLORS: Record<AssetRole, string> = {
  payload: "#fbbf24",
  scout: "#34d399",
  checkpoint: "#60a5fa",
  relay: "#a78bfa",
  escort: "#f472b6",
};

export function assetColor(role: AssetRole): string {
  return ROLE_COLORS[role] ?? "#94a3b8";
}

/**
 * Convert an ordered list of route waypoints into a GeoJSON LineString.
 */
export function toRouteGeoJSON(waypoints: RouteWaypoint[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: waypoints.map((wp) => [wp.lon, wp.lat]),
        },
        properties: { id: "route", label: "Route" },
      },
    ],
  };
}

/**
 * Convert mission assets into a GeoJSON FeatureCollection for circle/symbol layers.
 */
export function toAssetGeoJSON(
  assets: Asset[],
  selectedId?: string | null,
  hoveredId?: string | null
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: assets.map((asset) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [asset.lon, asset.lat],
      },
      properties: {
        id: asset.id,
        name: asset.name,
        role: asset.role,
        status: asset.status,
        heading: asset.heading ?? 0,
        battery: asset.batteryPct ?? 0,
        selected: selectedId === asset.id,
        hovered: hoveredId === asset.id,
        color: assetColor(asset.role),
      },
    })),
  };
}

function withAlpha(color: string, alpha: number): string {
  const safeAlpha = Number.isFinite(alpha) ? alpha : 1;
  // Handle #rrggbb hex.
  if (color.startsWith("#") && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(148, 163, 184, ${safeAlpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  // Handle rgb(r, g, b).
  const rgbMatch = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
  if (rgbMatch) {
    const [_, rs, gs, bs] = rgbMatch;
    const r = Number(rs);
    const g = Number(gs);
    const b = Number(bs);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(148, 163, 184, ${safeAlpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }
  // Fallback: return color with alpha appended if possible.
  return color;
}

/**
 * Convert fused tracks into a GeoJSON FeatureCollection of 95% confidence ellipses.
 */
export function toFusedTrackEllipseGeoJSON(tracks: FusedTrack[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: tracks.map((t) => {
      const color = confidenceColor(t.confidence);
      return {
        type: "Feature",
        geometry: covarianceToEllipse(t.lat, t.lon, t.covariance, 0.95),
        properties: {
          id: t.id,
          confidence: t.confidence,
          color,
          fillColor: withAlpha(color, 0.2),
          borderColor: withAlpha(color, 0.7),
          sourceCount: t.sourceIds.length,
          assessment: t.assessment,
        },
      };
    }),
  };
}

function perpVector(x: number, y: number): [number, number] {
  const len = Math.hypot(x, y) || 1;
  return [-y / len, x / len];
}

function scaleForLat(lat: number): number {
  // Longitude degrees are narrower as we move away from the equator.
  return 1 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
}

/**
 * Build a wide polygon arrow for a narrative vector. The result is a filled
 * wedge with a triangular head, similar to NATO APP-6D "axis of advance".
 */
function vectorArrowPolygon(v: TheaterVector): [number, number][] {
  const dx = v.to.lon - v.from.lon;
  const dy = v.to.lat - v.from.lat;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const [px, py] = perpVector(dx, dy);

  const midLat = (v.from.lat + v.to.lat) / 2;
  const lonScale = scaleForLat(midLat);

  // Width and head size scale with intensity (degrees, adjusted for latitude).
  const widthBase = v.intensity === 3 ? 0.18 : v.intensity === 2 ? 0.12 : 0.07;
  const widthDeg = widthBase * lonScale;
  const headLengthDeg = (dist * 0.28 + 0.03) * lonScale;
  const headWidthDeg = widthDeg * 2.4;

  const tailL: [number, number] = [v.from.lon + px * widthDeg * 0.5, v.from.lat + py * widthDeg * 0.5];
  const tailR: [number, number] = [v.from.lon - px * widthDeg * 0.5, v.from.lat - py * widthDeg * 0.5];

  const baseX = v.to.lon - ux * headLengthDeg;
  const baseY = v.to.lat - uy * headLengthDeg;

  const baseL: [number, number] = [baseX + px * widthDeg * 0.5, baseY + py * widthDeg * 0.5];
  const baseR: [number, number] = [baseX - px * widthDeg * 0.5, baseY - py * widthDeg * 0.5];

  const tip: [number, number] = [v.to.lon, v.to.lat];

  const headL: [number, number] = [baseX + px * headWidthDeg * 0.5, baseY + py * headWidthDeg * 0.5];
  const headR: [number, number] = [baseX - px * headWidthDeg * 0.5, baseY - py * headWidthDeg * 0.5];

  return [tailL, baseL, headL, tip, headR, baseR, tailR, tailL];
}

/**
 * Build GeoJSON for narrative attack/pressure vectors.
 * Each vector becomes a wide filled polygon arrow plus a midpoint label.
 */
export function toVectorGeoJSON(vectors: TheaterVector[]): {
  arrows: FeatureCollection<Polygon>;
  labels: FeatureCollection<Point>;
} {
  const arrows: FeatureCollection<Polygon> = { type: "FeatureCollection", features: [] };
  const labels: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };

  for (const v of vectors) {
    const color = AFFILIATION_THEME[v.affiliation]?.color ?? AFFILIATION_THEME.unknown.color;
    const fillColor = AFFILIATION_THEME[v.affiliation]?.fill ?? AFFILIATION_THEME.unknown.fill;

    const mx = (v.from.lon + v.to.lon) / 2;
    const my = (v.from.lat + v.to.lat) / 2;
    const dx = v.to.lon - v.from.lon;
    const dy = v.to.lat - v.from.lat;
    const len = Math.hypot(dx, dy) || 1;

    // Offset label perpendicular to shaft so it does not sit on the arrow.
    const labelOffset = 0.22;
    const [px, py] = perpVector(dx, dy);
    const labelLon = mx + px * labelOffset;
    const labelLat = my + py * labelOffset;

    arrows.features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [vectorArrowPolygon(v)] },
      properties: {
        id: v.id,
        color,
        fillColor,
        intensity: v.intensity,
        type: v.type,
      },
    });

    labels.features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [labelLon, labelLat] },
      properties: {
        id: v.id,
        label: v.label,
        color,
      },
    });
  }

  return { arrows, labels };
}
