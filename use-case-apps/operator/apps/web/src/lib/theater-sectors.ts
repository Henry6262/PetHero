import * as turf from "@turf/turf";
import type { Feature, LineString, Polygon, MultiPolygon, Position } from "geojson";
import oblastZones from "@shared/data/theater-oblasts.json";
import { THEATER_FRONT_LINE, type TheaterSubSector } from "@shared/theater";

const CONTESTED_BUFFER_KM = 12;

interface RawOblastZone {
  id: string;
  name: string;
  type: string;
  affiliation: string;
  status: string;
  label: string;
  ring: [number, number][];
  center: { lon: number; lat: number };
}

/**
 * Determine which side of a polyline a point lies on.
 * Returns a signed distance-like number; the sign is consistent for a given
 * line orientation. We compare against a reference point to label sides.
 */
function signedDistanceToPolyline(
  point: [number, number],
  line: [number, number][]
): number {
  let minDist = Infinity;
  let bestSign = 0;

  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;

    // Project point onto segment, clamped to [0,1].
    const t = Math.max(0, Math.min(1, ((point[0] - x1) * dx + (point[1] - y1) * dy) / len2));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;

    const distPx = point[0] - cx;
    const distPy = point[1] - cy;
    const dist = Math.hypot(distPx, distPy);

    if (dist < minDist) {
      minDist = dist;
      // 2D cross product (B-A) x (P-A) — sign tells which side.
      bestSign = dx * (point[1] - y1) - dy * (point[0] - x1);
    }
  }

  return bestSign;
}

function isFriendlySide(point: [number, number], line: [number, number][]): boolean {
  // Kyiv is well west/northwest of the entire front line — use it as the
  // reference for the friendly side.
  const friendlyRef: [number, number] = [30.52, 50.45];
  return Math.sign(signedDistanceToPolyline(point, line)) ===
    Math.sign(signedDistanceToPolyline(friendlyRef, line));
}

function toTurfPolygon(ring: [number, number][]): Feature<Polygon> {
  return turf.polygon([ring]);
}

function toLineString(line: [number, number][]): Feature<LineString> {
  return turf.lineString(line);
}

function centroidOf(feature: Feature<Polygon | MultiPolygon>): [number, number] {
  const c = turf.centroid(feature);
  return c.geometry.coordinates as [number, number];
}

function asRing(positions: Position[]): [number, number][] {
  return positions.map((p) => [p[0], p[1]]) as [number, number][];
}

function flattenPolygon(feature: Feature<Polygon | MultiPolygon>): [number, number][][] {
  if (feature.geometry.type === "Polygon") {
    return [asRing(feature.geometry.coordinates[0])];
  }
  return feature.geometry.coordinates.map((poly) => asRing(poly[0]));
}

/**
 * Build real boundary-aligned dominance sectors from the actual oblast
 * polygons and the approximate front line. Contested oblasts are split into
 * friendly-held (west of the front), hostile-held (east of the front), and a
 * contested ribbon along the line of contact.
 */
export function buildSubSectors(): TheaterSubSector[] {
  const frontLine = toLineString(THEATER_FRONT_LINE);
  const contestedCorridor = turf.buffer(frontLine, CONTESTED_BUFFER_KM, {
    units: "kilometers",
    steps: 32,
  }) as Feature<Polygon>;

  const contestedOblasts = new Set([
    "Kharkiv",
    "Donets'k",
    "Luhans'k",
    "Kherson",
    "Zaporizhzhya",
  ]);

  const sectors: TheaterSubSector[] = [];

  for (const raw of oblastZones as RawOblastZone[]) {
    if (!contestedOblasts.has(raw.name)) continue;

    const oblast = toTurfPolygon(raw.ring);
    if (!turf.booleanIntersects(oblast, contestedCorridor)) continue;

    const contested = turf.intersect(
      turf.featureCollection([oblast, contestedCorridor])
    ) as Feature<Polygon | MultiPolygon> | null;

    if (contested) {
      for (const ring of flattenPolygon(contested)) {
        sectors.push({
          id: `sub-${raw.id}-contested`,
          name: `${raw.name} — contested corridor`,
          region: raw.name,
          affiliation: "contested",
          ring,
        });
      }
    }

    const remaining = turf.difference(
      turf.featureCollection([oblast, contestedCorridor])
    ) as Feature<Polygon | MultiPolygon> | null;

    if (remaining) {
      for (const ring of flattenPolygon(remaining)) {
        const centroid = centroidOf(turf.polygon([ring.map((p) => [p[0], p[1]])]));
        const affiliation = isFriendlySide(centroid, THEATER_FRONT_LINE)
          ? "friendly"
          : "hostile";
        sectors.push({
          id: `sub-${raw.id}-${affiliation}`,
          name: `${raw.name} — ${affiliation}-held`,
          region: raw.name,
          affiliation,
          ring,
        });
      }
    }
  }

  return sectors;
}

export const demoSubSectors = buildSubSectors();
