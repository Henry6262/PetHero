/**
 * Shared frontend data types for the Operator dashboard.
 *
 * Keep this file free of runtime demo data so components can import types
 * without pulling in the entire synthetic mission payload.
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
