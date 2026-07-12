/**
 * Shared frontend data types for the Operator dashboard.
 *
 * Keep this file free of runtime demo data so components can import types
 * without pulling in the entire synthetic mission payload.
 *
 * Squadron and theater-level mission types are imported from the project-wide
 * shared modules so the backend and frontend stay in sync.
 */

export type TimelineEvent = {
  t: string;
  tag: string;
  type: string;
  color: string;
  text: string;
  live?: boolean;
};

export type CommandPlaybook = {
  name: string;
  tag: string;
  rec: boolean;
};

export type AgentAction = {
  label: string;
  icon: string;
};

export type AgentSection = "human" | "robot";

export type Agent = {
  id: string;
  name: string;
  role: string;
  accent: string;
  status: string;
  battery: number;
  icon: string;
  image?: string;
  section: AgentSection;
  actions: AgentAction[];
  destination?: {
    x: number;
    z: number;
    label?: string;
  };
};

export type BuildingStatus = "clear" | "partial" | "unmapped" | "conflict" | "stale";

export type BuildingRoom = {
  label: string;
  state: "clear" | "unknown";
};

export type Building = {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  hexCol: number;
  hexRow: number;
  rotation: number;
  status: BuildingStatus;
  w: number;
  h2: number;
  area: number;
  floors: number;
  roomCols: number;
  rooms: BuildingRoom[];
  frames: number;
  by: string;
  ago: string;
};

export type LegendEntry = {
  label: string;
  bg: string;
  border: string;
};

export type BentoCardProps = {
  label: string;
  title: string;
  description: string;
  color: string;
};

export type FleetEntry = {
  id: string;
  kind: string;
  status: string;
  trust: string;
  accent: string;
};

export type PlaybookEntry = [string, string];

export type SectorStatus = "friendly" | "hostile" | "neutral" | "objective";

export type MissionSector = {
  id: string;
  name: string;
  status: SectorStatus;
  polygon: [number, number][];
  height?: number;
};

export type MissionObjective = {
  id: string;
  label: string;
  targetSectorId?: string;
  targetAgentId?: string;
  status: "pending" | "active" | "complete";
};

/** Tactical mission used by the 3D dashboard; distinct from theater-level missions. */
export type Mission = {
  id: string;
  name: string;
  active: boolean;
  sectors: MissionSector[];
  objectives: MissionObjective[];
};

// Re-export shared squadron and theater-hierarchy types so components can keep
// importing from `../types/data`.
export type {
  AdvisorDecision,
  AdvisorRecommendation,
  Asset,
  AssetKind,
  AssetRole,
  AssetStatus,
  AutonomyPolicy,
  Covariance2D,
  FusedTrack,
  GeoPoint,
  MissionPayload,
  MissionType,
  MissionZone,
  MissionZoneType,
  ReasoningLogEntry,
  RouteWaypoint,
  SensorFeed,
  SensorSource,
  Squadron,
  SquadronAffiliation,
  SquadronStatus,
  SquadronType,
  TheaterMission,
  TheaterObjective,
  TheaterOperation,
  TheaterTarget,
  TrackClassification,
  VelocityENU,
} from "@shared";
