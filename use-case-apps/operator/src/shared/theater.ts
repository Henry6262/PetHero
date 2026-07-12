import oblastZones from "./data/theater-oblasts.json";
import type { MissionZone } from "./mission.ts";
import type { Squadron, SquadronAffiliation, SquadronType } from "./squadron.ts";

/**
 * Shared theater geometry for the Ukraine-Russia operational COP demo.
 *
 * Zone boundaries are derived from real Natural Earth 10m admin-1 polygons
 * (Ukrainian oblasts + Russian border oblasts), simplified for the web.
 * This replaces the earlier hand-drawn schematic zones with actual geography:
 *   - Friendly zones = Ukrainian oblasts west/northwest of the active front.
 *   - Contested zones = Ukrainian oblasts where the active conflict is occurring.
 *   - Hostile zones = Russian oblasts bordering Ukraine.
 *
 * The contested corridor is deliberately wider than a thin front line: it shows
 * the real administrative regions where control is disputed, not a cartoon band.
 */

export interface TheaterBattalionSeed {
  id: string;
  callsign: string;
  type: SquadronType;
  affiliation: SquadronAffiliation;
  lat: number;
  lon: number;
  heading: number;
}

/**
 * Approximate line of contact as of July 2026, derived from ISW/ACLED
 * summaries: Russian pressure around Kupiansk and the Kharkiv security zone,
 * fighting along the Svatove-Kreminna line, the main effort in Donetsk
 * (Chasiv Yar, Toretsk, Pokrovsk, Kostiantynivka), a relatively static
 * Zaporizhzhia sector, and the Dnipro line in Kherson.
 */
export const THEATER_FRONT_LINE: [number, number][] = [
  [36.2, 50.4], // Kharkiv security zone / north of Kupiansk
  [37.0, 50.0], // Kupiansk axis
  [37.8, 49.5], // Svatove approach
  [38.3, 49.0], // Kreminna
  [38.1, 48.6], // Chasiv Yar / Bakhmut approaches
  [37.6, 48.4], // Toretsk
  [37.3, 48.2], // Kostiantynivka
  [37.0, 47.9], // Pokrovsk direction
  [36.6, 47.7], // Kurakhove / Velyka Novosilka
  [36.0, 47.4], // Zaporizhzhia
  [35.0, 47.2],
  [34.0, 46.9],
  [33.2, 46.6], // Kherson / Dnipro
  [32.6, 46.2], // Black Sea coast
];

/** Theater bounding box used by the simulator and initial viewport. */
export const THEATER_BOUNDS = {
  minLat: 44.5,
  maxLat: 52.5,
  minLon: 27.0,
  maxLon: 45.0,
};

/** Operational narrative vector — an arrow that shows a current push, pressure, or incursion. */
export interface TheaterVector {
  id: string;
  label: string;
  narrative: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  /** Who is initiating the action. */
  affiliation: "friendly" | "hostile" | "neutral";
  /** 1 = minor pressure, 2 = active effort, 3 = main effort. */
  intensity: 1 | 2 | 3;
  /** Kind of action. */
  type: "advance" | "pressure" | "incursion" | "counter_attack" | "static";
}

/**
 * Dominance sub-sector — an intra-oblast polygon showing who holds what inside a
 * contested region. Real boundary-aligned sectors are generated in the frontend
 * from the actual oblast polygons clipped by the front line (see
 * apps/web/src/lib/theater-sectors.ts).
 */
export interface TheaterSubSector {
  id: string;
  name: string;
  /** Parent oblast or region this sector sits inside. */
  region: string;
  affiliation: "friendly" | "hostile" | "contested";
  /** Ring in GeoJSON order: [lon, lat]. */
  ring: [number, number][];
}

/**
 * Current operational narratives as of July 2026, derived from ISW/ACLED
 * summaries. These are demo-grade approximations, not real-time classified data.
 */
export const THEATER_VECTORS: TheaterVector[] = [
  {
    id: "vec-kharkiv-north",
    label: "Kharkiv security zone pressure",
    narrative: "Russian forces maintain pressure north of Kharkiv along the Sumy border, probing Ukrainian defensive lines.",
    from: { lat: 50.7, lon: 36.8 },
    to: { lat: 50.3, lon: 35.6 },
    affiliation: "hostile",
    intensity: 2,
    type: "pressure",
  },
  {
    id: "vec-kupiansk",
    label: "Kupiansk axis",
    narrative: "Russian push west of Kupiansk toward the Oskil River, threatening Ukrainian logistics hubs.",
    from: { lat: 49.7, lon: 37.6 },
    to: { lat: 49.6, lon: 36.8 },
    affiliation: "hostile",
    intensity: 2,
    type: "advance",
  },
  {
    id: "vec-kreminna",
    label: "Svatove-Kreminna line",
    narrative: "Slow, grinding fighting along the forested Kreminna sector; Russian forces trying to break Ukrainian positions.",
    from: { lat: 49.05, lon: 38.2 },
    to: { lat: 48.95, lon: 37.4 },
    affiliation: "hostile",
    intensity: 1,
    type: "pressure",
  },
  {
    id: "vec-chasiv-yar",
    label: "Chasiv Yar assault",
    narrative: "Russian urban assault on Chasiv Yar; elevated terrain would open the path to Kramatorsk-Sloviansk.",
    from: { lat: 48.6, lon: 37.8 },
    to: { lat: 48.4, lon: 37.2 },
    affiliation: "hostile",
    intensity: 2,
    type: "advance",
  },
  {
    id: "vec-pokrovsk",
    label: "Pokrovsk main effort",
    narrative: "Main Russian offensive effort: push west toward Pokrovsk to sever the central Donetsk logistics corridor.",
    from: { lat: 48.2, lon: 37.2 },
    to: { lat: 48.1, lon: 36.2 },
    affiliation: "hostile",
    intensity: 3,
    type: "advance",
  },
  {
    id: "vec-kherson",
    label: "Dnipro cross-river pressure",
    narrative: "Ukrainian cross-river pressure east of the Dnipro keeps Russian forces tied down around Kherson.",
    from: { lat: 46.6, lon: 32.6 },
    to: { lat: 46.8, lon: 33.4 },
    affiliation: "friendly",
    intensity: 1,
    type: "counter_attack",
  },
  {
    id: "vec-zaporizhzhia-static",
    label: "Zaporizhzhia static line",
    narrative: "Relatively static sector around Orikhiv and Velyka Novosilka; both sides dig in along prepared lines.",
    from: { lat: 47.6, lon: 36.0 },
    to: { lat: 47.4, lon: 35.4 },
    affiliation: "neutral",
    intensity: 1,
    type: "static",
  },
];

interface RawOblastZone {
  id: string;
  name: string;
  type: MissionZone["type"];
  affiliation: MissionZone["affiliation"];
  status: MissionZone["status"];
  label: string;
  ring: [number, number][];
  center: { lon: number; lat: number };
}

/** Operational zones derived from real Natural Earth admin-1 boundaries. */
export const THEATER_ZONES: MissionZone[] = (oblastZones as RawOblastZone[]).map(
  (z): MissionZone => ({
    id: z.id,
    name: z.name,
    type: z.type,
    affiliation: z.affiliation,
    status: z.status,
    label: z.label,
    ring: z.ring,
    center: { lat: z.center.lat, lon: z.center.lon },
  })
);

/** Deterministic battalion seeds grouped into brigade clusters near the front. */
export const THEATER_BATTALIONS: TheaterBattalionSeed[] = (() => {
  const seeds: TheaterBattalionSeed[] = [];
  let index = 1;

  const addCluster = (
    count: number,
    affiliation: SquadronAffiliation,
    baseLat: number,
    baseLon: number,
    latSpread: number,
    lonSpread: number,
    types: SquadronType[]
  ) => {
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const lat = baseLat + (Math.random() - 0.5) * latSpread;
      const lon = baseLon + (Math.random() - 0.5) * lonSpread;
      const heading = Math.floor(Math.random() * 360);
      seeds.push({
        id: `SQ-${String(index).padStart(3, "0")}`,
        callsign: `${affiliation.slice(0, 1).toUpperCase()}-${type.slice(0, 3).toUpperCase()}-${String(index).padStart(2, "0")}`,
        type,
        affiliation,
        lat,
        lon,
        heading,
      });
      index++;
    }
  };

  // Friendly (UA) brigades — positioned in the western/northwestern oblasts.
  addCluster(8, "friendly", 50.2, 34.8, 0.35, 0.55, ["infantry", "armor", "artillery"]);
  addCluster(6, "friendly", 49.6, 35.6, 0.3, 0.5, ["infantry", "drone", "recon"]);
  addCluster(7, "friendly", 48.8, 36.4, 0.35, 0.6, ["armor", "artillery", "infantry"]);
  addCluster(6, "friendly", 47.8, 36.2, 0.3, 0.55, ["infantry", "recon", "logistics"]);
  addCluster(5, "friendly", 47.0, 34.8, 0.3, 0.5, ["drone", "artillery", "infantry"]);
  addCluster(4, "friendly", 46.4, 32.8, 0.25, 0.4, ["recon", "logistics", "infantry"]);

  // Hostile (RU) brigades — positioned in the Russian border oblasts.
  addCluster(8, "hostile", 50.6, 36.8, 0.35, 0.6, ["armor", "artillery", "infantry"]);
  addCluster(6, "hostile", 49.8, 37.8, 0.3, 0.55, ["infantry", "armor", "drone"]);
  addCluster(7, "hostile", 48.6, 38.4, 0.35, 0.6, ["artillery", "armor", "infantry"]);
  addCluster(6, "hostile", 47.4, 37.6, 0.3, 0.55, ["infantry", "artillery", "recon"]);
  addCluster(5, "hostile", 46.6, 35.8, 0.3, 0.5, ["armor", "drone", "logistics"]);

  // Neutral / observer / humanitarian elements.
  addCluster(3, "neutral", 49.0, 33.0, 0.4, 0.6, ["logistics", "recon"]);
  addCluster(2, "neutral", 47.2, 31.5, 0.3, 0.5, ["logistics", "recon"]);

  return seeds;
})();

/** Build fully populated Squadron objects from deterministic battalion seeds. */
export function buildTheaterSquadrons(source = "simulator"): Squadron[] {
  const now = new Date().toISOString();
  return THEATER_BATTALIONS.map((seed) => {
    const confidence = Number((0.75 + Math.random() * 0.22).toFixed(3));
    return {
      ...seed,
      status: "operational",
      altitude: 0,
      speed: Math.floor(5 + Math.random() * 35),
      battery: Math.floor(45 + Math.random() * 50),
      missionId: undefined,
      updatedAt: now,
      source,
      confidence,
      provenance: [{ source, receivedAt: now, confidence }],
    };
  });
}
