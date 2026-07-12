import type { Covariance2D } from "./track.ts";

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6_371_000;

/** Approximate meters per degree latitude at the given latitude. */
export function metersPerDegreeLat(_lat: number): number {
  return (Math.PI / 180) * EARTH_RADIUS_M;
}

/** Approximate meters per degree longitude at the given latitude. */
export function metersPerDegreeLon(lat: number): number {
  return (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(lat * DEG_TO_RAD);
}

/** Build a circular 2x2 covariance from a scalar uncertainty radius. */
export function covarianceFromUncertainty(radiusM: number): Covariance2D {
  const v = radiusM * radiusM;
  return { ee: v, en: 0, ne: 0, nn: v };
}

/** Determinant of a 2x2 matrix. */
export function det2x2(m: Covariance2D): number {
  return m.ee * m.nn - m.en * m.ne;
}

/** Inverse of a 2x2 matrix. Returns null if singular. */
export function invert2x2(m: Covariance2D): Covariance2D | null {
  const d = det2x2(m);
  if (Math.abs(d) < 1e-12) return null;
  return {
    ee: m.nn / d,
    en: -m.en / d,
    ne: -m.ne / d,
    nn: m.ee / d,
  };
}

/** Add two 2x2 matrices. */
export function add2x2(a: Covariance2D, b: Covariance2D): Covariance2D {
  return {
    ee: a.ee + b.ee,
    en: a.en + b.en,
    ne: a.ne + b.ne,
    nn: a.nn + b.nn,
  };
}

/** Scale a 2x2 matrix. */
export function scale2x2(m: Covariance2D, s: number): Covariance2D {
  return {
    ee: m.ee * s,
    en: m.en * s,
    ne: m.ne * s,
    nn: m.nn * s,
  };
}

/** Mahalanobis distance squared for a 2D residual and covariance. */
export function mahalanobis2(dx: number, dy: number, cov: Covariance2D): number {
  const inv = invert2x2(cov);
  if (!inv) return Number.POSITIVE_INFINITY;
  return dx * (inv.ee * dx + inv.en * dy) + dy * (inv.ne * dx + inv.nn * dy);
}

/** Covariance Intersection for two 2x2 covariances. Uses omega = 0.5 for hackathon speed. */
export function covarianceIntersection(
  a: Covariance2D,
  b: Covariance2D,
  omega = 0.5
): Covariance2D {
  const invA = invert2x2(a);
  const invB = invert2x2(b);
  if (!invA || !invB) return a;
  const fusedInv = add2x2(scale2x2(invA, omega), scale2x2(invB, 1 - omega));
  return invert2x2(fusedInv) ?? a;
}

/** Convert meters east/north to degree offsets from a reference lat/lon. */
export function enuToOffsetDegrees(
  eastM: number,
  northM: number,
  refLat: number
): { dLat: number; dLon: number } {
  return {
    dLat: northM / metersPerDegreeLat(refLat),
    dLon: eastM / metersPerDegreeLon(refLat),
  };
}

/**
 * Convert a 2x2 covariance at a reference lat/lon to a GeoJSON uncertainty ellipse.
 * confidence 0.95 → chi2 = 5.991; 0.99 → 9.21; 0.68 → 2.28.
 */
export function covarianceToEllipse(
  lat: number,
  lon: number,
  cov: Covariance2D,
  confidence: number,
  numPoints = 32
): GeoJsonPolygon {
  const chi2Values: Record<number, number> = { 0.68: 2.28, 0.95: 5.991, 0.99: 9.21 };
  const chi2 = chi2Values[confidence] ?? 5.991;

  const trace = cov.ee + cov.nn;
  const det = det2x2(cov);
  const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * det));

  const lambda1 = (trace + discriminant) / 2;
  const lambda2 = (trace - discriminant) / 2;

  const a = Math.sqrt(chi2 * lambda1);
  const b = Math.sqrt(chi2 * lambda2);
  const theta = Math.atan2(2 * cov.en, cov.ee - cov.nn) / 2;

  const coordinates: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const x = a * Math.cos(angle);
    const y = b * Math.sin(angle);
    const rotX = x * Math.cos(theta) - y * Math.sin(theta);
    const rotY = x * Math.sin(theta) + y * Math.cos(theta);
    const { dLat, dLon } = enuToOffsetDegrees(rotX, rotY, lat);
    coordinates.push([lon + dLon, lat + dLat]);
  }

  return { type: "Polygon", coordinates: [coordinates] };
}
