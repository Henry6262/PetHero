import type { FusedTrack, SensorFeed, SensorSource, SensorTrack } from "../shared/index.ts";
import {
  covarianceFromUncertainty,
  covarianceIntersection,
  mahalanobis2,
  metersPerDegreeLat,
  metersPerDegreeLon,
} from "../shared/geo.ts";
import { mulberry32 } from "../shared/rng.ts";

const EARTH_RADIUS_M = 6_371_000;

export interface TrackFusionEngineOptions {
  seed?: number;
  // Association gate: a track is associated if Mahalanobis distance^2 is below this.
  // 5.991 = chi2, 95%, 2 DOF.
  gateThreshold?: number;
}

/**
 * Lightweight multi-source track fusion engine.
 *
 * - Maintains fused tracks in flat memory.
 * - Associates incoming sensor tracks by Mahalanobis distance on position covariance.
 * - Fuses position using Covariance Intersection.
 * - Emits 2x2 covariance for uncertainty-ellipse rendering.
 */
export class TrackFusionEngine {
  private fusedTracks = new Map<string, FusedTrack>();
  private nextFusedId = 1;
  private gateThreshold: number;

  constructor(options: TrackFusionEngineOptions = {}) {
    this.gateThreshold = options.gateThreshold ?? 5.991;
  }

  reset() {
    this.fusedTracks.clear();
    this.nextFusedId = 1;
  }

  getFusedTracks(): FusedTrack[] {
    return [...this.fusedTracks.values()].sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Ingest one or more sensor feeds and update fused tracks.
   * Returns the list of fused tracks after processing.
   */
  processFeeds(...feeds: SensorFeed[]): FusedTrack[] {
    for (const feed of feeds) {
      for (const track of feed.tracks) {
        this.associateOrCreate(
          { ...track, sourceId: feed.source.id, reliability: feed.source.reliability },
          feed.source
        );
      }
    }
    return this.getFusedTracks();
  }

  private associateOrCreate(track: SensorTrack, source: SensorSource) {
    const trackCov = track.covariance ?? covarianceFromUncertainty(track.uncertaintyRadiusM);

    let bestId: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const [id, fused] of this.fusedTracks) {
      const { dx, dy } = residualEnuMeters(fused.lat, fused.lon, track.lat, track.lon);
      const innovationCov = addCovariance(fused.covariance, trackCov);
      const d2 = mahalanobis2(dx, dy, innovationCov);
      if (d2 > this.gateThreshold) continue;

      // Prefer fused tracks that already have more corroboration.
      const score = d2 / (fused.corroborationCount + 1);
      if (score < bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    if (bestId) {
      this.updateFused(bestId, track, source, trackCov);
    } else {
      this.createFused(track, source, trackCov);
    }
  }

  private createFused(track: SensorTrack, source: SensorSource, trackCov: Covariance2D) {
    const id = `F-${String(this.nextFusedId++).padStart(3, "0")}`;
    const fused: FusedTrack = {
      id,
      lat: track.lat,
      lon: track.lon,
      altitude: track.altitude ?? 0,
      heading: track.heading,
      speed: track.speed,
      velocityEnu: track.velocityEnu,
      updatedAt: track.timestamp,
      confidence: roundConfidence(source.reliability * 0.5),
      sourceIds: [source.id],
      sourceTrackIds: [track.id],
      assessment: `Initial detection by ${source.name} (${track.isPlot ? "plot" : "track"}).`,
      covariance: trackCov,
      classification: track.classification ?? "UNKNOWN",
      corroborationCount: 1,
    };
    this.fusedTracks.set(id, fused);
  }

  private updateFused(id: string, track: SensorTrack, source: SensorSource, trackCov: Covariance2D) {
    const fused = this.fusedTracks.get(id);
    if (!fused) return;

    const existingWeight = fused.sourceIds.length * Math.max(0.1, fused.confidence);
    const newWeight = source.reliability;
    const totalWeight = existingWeight + newWeight;

    const lat = weightedAvg(fused.lat, existingWeight, track.lat, newWeight);
    const lon = weightedAvg(fused.lon, existingWeight, track.lon, newWeight);
    const altitude = weightedAvg(fused.altitude, existingWeight, track.altitude ?? 0, newWeight);

    const heading =
      typeof fused.heading === "number" && typeof track.heading === "number"
        ? Math.round(weightedAngleAvg(fused.heading, existingWeight, track.heading, newWeight))
        : track.heading ?? fused.heading;

    const speed =
      typeof fused.speed === "number" && typeof track.speed === "number"
        ? Math.round(weightedAvg(fused.speed, existingWeight, track.speed, newWeight))
        : track.speed ?? fused.speed;

    const sourceIds = unique([...fused.sourceIds, source.id]);
    const sourceTrackIds = unique([...fused.sourceTrackIds, track.id]);
    const corroborationCount = sourceIds.length;

    const fusedCov = covarianceIntersection(fused.covariance, trackCov, 0.5);

    const agreement = corroborationCount / (corroborationCount + 1);
    const kinematicScore = computeKinematicScore(fused, track);
    const confidence = roundConfidence(
      source.reliability * 0.35 + fused.confidence * 0.25 + agreement * 0.25 + kinematicScore * 0.15
    );

    let assessment = `Fused from ${corroborationCount} source${corroborationCount > 1 ? "s" : ""}.`;
    if (corroborationCount === 1) {
      assessment = `Single-source track from ${source.name}; awaiting corroboration.`;
    }

    this.fusedTracks.set(id, {
      ...fused,
      lat,
      lon,
      altitude,
      heading,
      speed,
      velocityEnu: track.velocityEnu ?? fused.velocityEnu,
      updatedAt: track.timestamp,
      confidence,
      sourceIds,
      sourceTrackIds,
      assessment,
      covariance: fusedCov,
      classification: track.classification !== "UNKNOWN" ? track.classification : fused.classification,
      corroborationCount,
    });
  }
}

/**
 * Deterministic simulator that generates multiple sensor feeds observing the
 * same set of true air/ground objects. Each source has its own noise,
 * reliability, update pattern, and ID scheme.
 */
export class SensorSimulator {
  private rng: () => number;
  private sources: SensorSource[];
  private trueObjects: TrueObject[];
  private nextObjectId = 1;
  private timestamp = new Date().toISOString();

  constructor(seed = 20260709, objectCount = 8) {
    this.rng = mulberry32(seed);
    this.sources = buildSources(this.rng);
    this.trueObjects = Array.from({ length: objectCount }, () => this.createTrueObject());
  }

  reset(objectCount = 8) {
    this.trueObjects = Array.from({ length: objectCount }, () => this.createTrueObject());
    this.timestamp = new Date().toISOString();
  }

  tick() {
    const now = new Date().toISOString();
    for (const obj of this.trueObjects) {
      this.moveTrueObject(obj);
    }
    this.timestamp = now;
  }

  generateFeeds(): SensorFeed[] {
    return this.sources.map((source) => ({
      source,
      tracks: this.trueObjects.map((obj) => this.observedTrack(obj, source)),
    }));
  }

  getSources(): SensorSource[] {
    return this.sources;
  }

  private createTrueObject(): TrueObject {
    const t = this.rng();
    const baseLat = 51.0 - t * 4.0;
    const baseLon = 25.0 + t * 15.0;
    return {
      id: `TRUE-${String(this.nextObjectId++).padStart(2, "0")}`,
      lat: baseLat + (this.rng() - 0.5) * 1.5,
      lon: baseLon + (this.rng() - 0.5) * 2.0,
      altitude: Math.floor(this.rng() * 300),
      heading: Math.floor(this.rng() * 360),
      speed: 10 + Math.floor(this.rng() * 40),
    };
  }

  private moveTrueObject(obj: TrueObject) {
    const dtHours = 2 / 3600;
    const distanceKm = obj.speed * dtHours;
    const headingRad = (obj.heading * Math.PI) / 180;

    obj.lat += (distanceKm * Math.cos(headingRad)) / 111.32;
    obj.lon += (distanceKm * Math.sin(headingRad)) / (111.32 * Math.cos((obj.lat * Math.PI) / 180));
    obj.heading = Math.round((obj.heading + (this.rng() - 0.5) * 20 + 360) % 360);

    // Bounce inside theater box.
    if (obj.lat < 46 || obj.lat > 52) {
      obj.heading = (obj.heading + 180) % 360;
      obj.lat = clamp(obj.lat, 46, 52);
    }
    if (obj.lon < 24 || obj.lon > 41) {
      obj.heading = (obj.heading + 180) % 360;
      obj.lon = clamp(obj.lon, 24, 41);
    }
  }

  private observedTrack(obj: TrueObject, source: SensorSource): SensorTrack {
    const noiseM = source.nominalUncertaintyM * (0.5 + this.rng());
    const bearingRad = this.rng() * 2 * Math.PI;
    const offsetLat = (noiseM * Math.cos(bearingRad)) / EARTH_RADIUS_M * (180 / Math.PI);
    const offsetLon =
      (noiseM * Math.sin(bearingRad)) /
      (EARTH_RADIUS_M * Math.cos((obj.lat * Math.PI) / 180)) *
      (180 / Math.PI);

    // Simulate per-source ID schemes: some reuse small integers, some append source prefix.
    const rawId = source.id.startsWith("MAN")
      ? `M-${Math.floor(this.rng() * 90) + 10}`
      : `${source.id.slice(0, 3)}-${Math.floor(this.rng() * 999)}`;

    const headingRad = (obj.heading * Math.PI) / 180;
    const speedMs = (obj.speed * 1000) / 3600;

    return {
      id: rawId,
      sourceId: source.id,
      lat: obj.lat + offsetLat,
      lon: obj.lon + offsetLon,
      altitude: obj.altitude + Math.floor((this.rng() - 0.5) * 50),
      heading: obj.heading + Math.floor((this.rng() - 0.5) * 15),
      speed: obj.speed + Math.floor((this.rng() - 0.5) * 10),
      velocityEnu: {
        east: speedMs * Math.sin(headingRad),
        north: speedMs * Math.cos(headingRad),
        up: 0,
      },
      timestamp: this.timestamp,
      reliability: source.reliability,
      uncertaintyRadiusM: source.nominalUncertaintyM,
      covariance: covarianceFromUncertainty(source.nominalUncertaintyM * (0.75 + this.rng() * 0.5)),
      isPlot: source.type === "manual" || source.type === "simulated",
      classification: randomClassification(this.rng),
      detectionMode: source.type,
    };
  }
}

interface TrueObject {
  id: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  speed: number;
}

function buildSources(rng: () => number): SensorSource[] {
  return [
    {
      id: "RAD-1",
      name: "Long-range radar",
      type: "radar",
      reliability: 0.9,
      nominalUncertaintyM: 150,
      updateIntervalS: 2,
    },
    {
      id: "EO-1",
      name: "Electro-optical turret",
      type: "eo",
      reliability: 0.85,
      nominalUncertaintyM: 80,
      updateIntervalS: 2,
    },
    {
      id: "IR-1",
      name: "Infrared sensor",
      type: "ir",
      reliability: 0.75,
      nominalUncertaintyM: 120,
      updateIntervalS: 2,
    },
    {
      id: "ADS-1",
      name: "ADS-B receiver",
      type: "adsb",
      reliability: 0.8,
      nominalUncertaintyM: 60,
      updateIntervalS: 2,
    },
    {
      id: "MAN-1",
      name: "Manual spotter report",
      type: "manual",
      reliability: 0.5,
      nominalUncertaintyM: 400,
      updateIntervalS: 10,
    },
  ];
}

function residualEnuMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return {
    dy: dLat * metersPerDegreeLat(lat1),
    dx: dLon * metersPerDegreeLon(lat1),
  };
}

function addCovariance(a: Covariance2D, b: Covariance2D): Covariance2D {
  return {
    ee: a.ee + b.ee,
    en: a.en + b.en,
    ne: a.ne + b.ne,
    nn: a.nn + b.nn,
  };
}

function computeKinematicScore(fused: FusedTrack, track: SensorTrack): number {
  if (typeof fused.heading !== "number" || typeof track.heading !== "number") return 0.5;
  const dh = Math.abs(((fused.heading - track.heading + 180) % 360) - 180);
  // Score 1.0 if headings agree within 30°, decaying to 0.0 at 180°.
  return Math.max(0, 1 - dh / 180);
}

function randomClassification(rng: () => number): import("../shared/track.ts").TrackClassification {
  const r = rng();
  if (r > 0.85) return "UAV";
  if (r > 0.7) return "VEHICLE";
  if (r > 0.6) return "PERSON";
  return "UNKNOWN";
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function weightedAvg(a: number, weightA: number, b: number, weightB: number): number {
  return (a * weightA + b * weightB) / (weightA + weightB);
}

function weightedAngleAvg(a: number, weightA: number, b: number, weightB: number): number {
  const radA = (a * Math.PI) / 180;
  const radB = (b * Math.PI) / 180;
  const sin = (Math.sin(radA) * weightA + Math.sin(radB) * weightB) / (weightA + weightB);
  const cos = (Math.cos(radA) * weightA + Math.cos(radB) * weightB) / (weightA + weightB);
  return (Math.atan2(sin, cos) * 180) / Math.PI;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function roundConfidence(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(3))));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Re-export covariance type for local use.
type Covariance2D = import("../shared/track.ts").Covariance2D;
