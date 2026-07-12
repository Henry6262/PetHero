import { z } from "zod";

export const TARGET_STATUSES = [
  "discovered",
  "nominated",
  "vetted",
  "validated",
  "approved",
  "scheduled",
  "engaged",
  "assessed",
  "closed",
] as const;

export type TargetStatus = (typeof TARGET_STATUSES)[number];
export const targetStatusSchema = z.enum(TARGET_STATUSES);

export const TASK_STATUSES = ["pending", "active", "complete", "aborted"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const taskStatusSchema = z.enum(TASK_STATUSES);

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface RouteWaypoint extends GeoPoint {
  id: string;
}

export const MISSION_TYPES = [
  "payload_escort",
  "area_scan",
  "perimeter_watch",
  "building_approach",
  "lost_link_recovery",
  "recheck_stale_zones",
  "relay_chain",
] as const;

export type MissionType = (typeof MISSION_TYPES)[number];
export const missionTypeSchema = z.enum(MISSION_TYPES);

export type MissionZoneType =
  | "engagement_area"
  | "no_fire_area"
  | "no_fly_zone"
  | "boundary"
  | "phase_line"
  | "supply_route"
  | "objective"
  | "assembly_area"
  | "kill_zone"
  | "route_corridor"
  | "no_go_area";

export interface MissionZone {
  id: string;
  name: string;
  type: MissionZoneType;
  affiliation: "friendly" | "hostile" | "neutral";
  status: "active" | "planned" | "expired";
  /** Polygon ring in [lon, lat] order for GeoJSON compatibility. */
  ring: [number, number][];
  center?: GeoPoint;
  label?: string;
}

export interface TheaterTarget {
  id: string;
  name: string;
  status: TargetStatus;
  location?: GeoPoint;
  zoneId?: string;
}

export interface TheaterObjective {
  id: string;
  label: string;
  status: TaskStatus;
  targets: TheaterTarget[];
  location?: GeoPoint;
  zoneId?: string;
}

/** A physical or logical asset assigned to a mission (robot, squadron, unit). */
export type AssetRole = "payload" | "scout" | "checkpoint" | "relay" | "escort";
export type AssetKind = "robot" | "squadron" | "unit";
export type AssetStatus = "idle" | "moving" | "scanning" | "busy" | "offline" | "returning";

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  role: AssetRole;
  status: AssetStatus;
  lat: number;
  lon: number;
  heading?: number;
  speed?: number;
  batteryPct?: number;
  currentWaypointId?: string;
  /** URL of the asset's HTTP adapter. If omitted, the asset is simulated. */
  adapterUrl?: string;
  isSimulated: boolean;
}

/** What is being moved / protected in an escort mission. */
export interface MissionPayload {
  id: string;
  label: string;
  status: "in_transit" | "stopped" | "delivered" | "compromised";
  currentWaypointIndex: number;
  /** Asset ID carrying the payload. */
  carrierAssetId: string;
}

/** Per-mission thresholds for autonomous action vs human escalation. */
export interface AutonomyPolicy {
  /** Confidence above which a contact is considered confirmed. */
  confirmConfidence: number;
  /** Confidence below which a scout is dispatched automatically. */
  scoutDispatchConfidence: number;
  /** Distance in meters from route center that counts as "inside corridor". */
  corridorWidthM: number;
  /** Whether the LLM can auto-approve non-critical recommendations. */
  llmAutoApprove: boolean;
}

export interface TheaterMission {
  id: string;
  name: string;
  active: boolean;
  status: TaskStatus;
  /** Mission type determines behavior and available playbooks. */
  type: MissionType;
  objectives: TheaterObjective[];
  zones?: MissionZone[];
  /** Ordered route waypoints for escort/supply missions. */
  route?: RouteWaypoint[];
  /** IDs of assets assigned to this mission. */
  assignedAssetIds?: string[];
  /** Payload being escorted, if applicable. */
  payload?: MissionPayload;
  /** Autonomy thresholds for this mission. */
  autonomyPolicy?: AutonomyPolicy;
}

export interface TheaterOperation {
  id: string;
  name: string;
  active: boolean;
  status: TaskStatus;
  missions: TheaterMission[];
}
