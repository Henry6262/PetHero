import type { Squadron, SquadronStatus } from "../shared/squadron.ts";
import { squadronAffiliationSchema, SQUADRON_STATUSES } from "../shared/squadron.ts";
import { mulberry32, pick } from "../shared/rng.ts";
import {
  buildTheaterSquadrons,
  THEATER_BATTALIONS,
  THEATER_BOUNDS,
  THEATER_FRONT_LINE,
  THEATER_ZONES,
} from "../shared/theater.ts";

const KM_PER_DEGREE_LAT = 111.32;

export interface SimulatorBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface SquadronSimulatorOptions {
  seed?: number;
  /** @deprecated The simulator now uses fixed theater battalion seeds. */
  count?: number;
  bounds?: SimulatorBounds;
}

/**
 * Deterministic, flat-memory simulator for theater-scale squadron positions.
 *
 * Design choices:
 * - One Map<string, Squadron> stored in-place. `tick()` mutates existing records
 *   instead of reallocating the full set, which keeps the battalion set cheap.
 * - Theater layout comes from `src/shared/theater.ts` so the backend simulator
 *   and frontend demo data stay in sync.
 * - Movement converts speed/heading into degree deltas using a rough spherical
 *   approximation; good enough for an operational COP demo.
 */
export class SquadronSimulator {
  private squadrons = new Map<string, Squadron>();
  private rng: () => number;
  private timer: Timer | null = null;
  private bounds: SimulatorBounds;

  constructor(options: SquadronSimulatorOptions = {}) {
    this.rng = mulberry32(options.seed ?? 20260708);
    this.bounds = options.bounds ?? THEATER_BOUNDS;
    this.generate(options.count);
  }

  start(intervalMs = 2000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get isRunning() {
    return this.timer !== null;
  }

  getAll(): Squadron[] {
    return [...this.squadrons.values()];
  }

  getById(id: string): Squadron | undefined {
    return this.squadrons.get(id);
  }

  getInBbox(minLat: number, maxLat: number, minLon: number, maxLon: number): Squadron[] {
    const result: Squadron[] = [];
    for (const sq of this.squadrons.values()) {
      if (sq.lat >= minLat && sq.lat <= maxLat && sq.lon >= minLon && sq.lon <= maxLon) {
        result.push(sq);
      }
    }
    return result;
  }

  /**
   * Advance the simulation by one tick. Mutates existing squadron records in-place
   * and appends a provenance entry for each update.
   */
  tick() {
    const now = new Date().toISOString();
    for (const sq of this.squadrons.values()) {
      this.updateSquadron(sq, now);
    }
  }

  private updateSquadron(sq: Squadron, now: string) {
    const dtHours = 2 / 3600; // one tick represents 2 seconds of flight/drive time
    const distanceKm = sq.speed * dtHours;
    const kmPerDegreeLon = KM_PER_DEGREE_LAT * Math.cos((sq.lat * Math.PI) / 180);

    const headingRad = (sq.heading * Math.PI) / 180;
    const dLat = (distanceKm * Math.cos(headingRad)) / KM_PER_DEGREE_LAT;
    const dLon = (distanceKm * Math.sin(headingRad)) / kmPerDegreeLon;

    let newLat = sq.lat + dLat;
    let newLon = sq.lon + dLon;
    let newHeading = sq.heading;

    // Bounce off the theater bounds and turn back inward.
    if (newLat < this.bounds.minLat || newLat > this.bounds.maxLat) {
      newHeading = (newHeading + 180) % 360;
      newLat = clamp(newLat, this.bounds.minLat, this.bounds.maxLat);
    }
    if (newLon < this.bounds.minLon || newLon > this.bounds.maxLon) {
      newHeading = (newHeading + 180) % 360;
      newLon = clamp(newLon, this.bounds.minLon, this.bounds.maxLon);
    }

    // Small heading jitter so formations do not look robotic.
    newHeading = (newHeading + (this.rng() - 0.5) * 20 + 360) % 360;

    // Occasionally change status (5% chance per tick), but prefer plausible states.
    let newStatus = sq.status;
    if (this.rng() < 0.05) {
      newStatus = pick(SQUADRON_STATUSES, this.rng) as SquadronStatus;
    }

    sq.lat = newLat;
    sq.lon = newLon;
    sq.heading = Math.round(newHeading);
    sq.status = newStatus;
    sq.updatedAt = now;
    sq.provenance.push({
      source: sq.source,
      receivedAt: now,
      confidence: sq.confidence,
    });
    // Keep provenance bounded so memory stays flat over long runs.
    if (sq.provenance.length > 20) {
      sq.provenance.shift();
    }
  }

  private generate(count?: number) {
    const rng = this.rng;
    const now = new Date().toISOString();
    const seeds = count ? THEATER_BATTALIONS.slice(0, count) : THEATER_BATTALIONS;

    // Start from the deterministic theater battalion seeds.
    for (const seed of seeds) {
      const confidence = Number((0.75 + rng() * 0.22).toFixed(3));
      const squadron: Squadron = {
        ...seed,
        status: "operational",
        altitude: 0,
        speed: Math.floor(5 + rng() * 35),
        battery: Math.floor(45 + rng() * 50),
        missionId: undefined,
        updatedAt: now,
        source: "simulator",
        confidence,
        provenance: [{ source: "simulator", receivedAt: now, confidence }],
      };
      squadron.affiliation = squadronAffiliationSchema.parse(squadron.affiliation);
      this.squadrons.set(squadron.id, squadron);
    }
  }
}

// Re-export theater geometry so consumers can draw the same front line/zones.
export { THEATER_BATTALIONS, THEATER_BOUNDS, THEATER_FRONT_LINE, THEATER_ZONES };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
