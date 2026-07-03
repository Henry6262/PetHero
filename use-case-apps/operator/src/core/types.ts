export type MissionIntent =
  | "area_scan"
  | "perimeter_watch"
  | "building_approach"
  | "lost_link_recovery"
  | "recheck_stale_zones"
  | "relay_chain";

export type AgentKind = "ground" | "aerial" | "dock" | "operator" | "simulated";

export type AgentStatus = "ready" | "active" | "returning" | "syncing" | "offline";

export type CellStatus = "unknown" | "observed" | "stale" | "alert" | "conflict";

export type EventKind =
  | "map_cell"
  | "detection"
  | "change"
  | "agent_status"
  | "link_status";

export type DetectionLabel =
  | "person"
  | "vehicle"
  | "obstacle"
  | "open_door"
  | "closed_door"
  | "signal_loss"
  | "unknown";

export interface GridCell {
  id: string;
  x: number;
  y: number;
  status: CellStatus;
  confidence: number;
  freshnessScore: number;
  updatedAt: string;
  lastEventId: string;
  provenance: Provenance[];
  labels: DetectionLabel[];
}

export interface Provenance {
  eventId: string;
  agentId: string;
  observedAt: string;
  confidence: number;
  label?: DetectionLabel;
}

export interface MissionEvent {
  id: string;
  agentId: string;
  kind: EventKind;
  observedAt: string;
  receivedAt: string;
  cellId?: string;
  x?: number;
  y?: number;
  label?: DetectionLabel;
  confidence: number;
  payload?: Record<string, unknown>;
}

export interface AgentRecord {
  id: string;
  kind: AgentKind;
  status: AgentStatus;
  trusted: boolean;
  lastSeenAt: string;
  batteryPct?: number;
  position?: { x: number; y: number };
  localRevision?: number;
}

export interface MissionState {
  revision: number;
  generatedAt: string;
  agents: AgentRecord[];
  cells: GridCell[];
  events: MissionEvent[];
}

export interface FormationTask {
  agentId: string;
  role: string;
  targetCellId?: string;
  instruction: string;
  priority: number;
}

export interface FormationPlan {
  intent: MissionIntent;
  formation: string;
  rationale: string;
  tasks: FormationTask[];
}
