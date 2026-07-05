import type { BentoCardProps } from "../react-bits/MagicBento/MagicBento";

// Landing page exports (legacy shapes)
export const events = [
  "00:00 Q1 launched without prior map context.",
  "00:11 Q1 observed sector B14 and uploaded 18 cell deltas.",
  "00:18 Dock merged context revision v18.",
  "00:22 H1 initialized from dock memory before launch.",
  "00:31 H1 skipped three dead ends from Q1 route.",
  "00:41 Conflict at F6 assigned to re-check playbook.",
  "00:47 D1 switched to relay posture for low-bandwidth sync.",
];

export const fleet = [
  { id: "Q1", kind: "Ground scout", status: "Docked / synced", trust: "trusted", accent: "#34d399" },
  { id: "H1", kind: "Aerial scout", status: "Scanning", trust: "trusted", accent: "#5fb2ff" },
  { id: "D1", kind: "Relay drone", status: "Packet relay", trust: "trusted", accent: "#cbd5e1" },
  { id: "OP-7", kind: "Field operator", status: "Command link", trust: "operator", accent: "#fbbf24" },
];

export const playbooks: [string, string][] = [
  ["Area Scan", "Fan out and build first context fast."],
  ["Perimeter Watch", "Keep a ring fresh around dock or convoy halt."],
  ["Relay Chain", "Stretch context sync through difficult terrain."],
  ["Re-check Stale Zones", "Refresh old cells by age, risk, and distance."],
  ["Lost-link Recovery", "Store locally, move to sync point, upload later."],
];

export const contextCards: BentoCardProps[] = [
  {
    label: "Dock Memory",
    title: "Every launch inherits the last mission picture.",
    description: "Returning agents upload deltas. The dock merges context and initializes the next robot with known cells, stale zones, and conflicts.",
    color: "#07110f",
  },
  {
    label: "Delta Sync",
    title: "Send meaning first, video only when it matters.",
    description: "Operator prioritizes cells, detections, confidence, freshness, and provenance so teams still coordinate on weak links.",
    color: "#081016",
  },
  {
    label: "Provenance",
    title: "Every claim keeps its source attached.",
    description: "Map state carries who saw it, when they saw it, and how confident they were. No anonymous tactical truth.",
    color: "#10100b",
  },
  {
    label: "Conflicts",
    title: "Disagreement becomes an assignment.",
    description: "Conflicting reports stay visible and trigger re-check playbooks instead of being flattened into false certainty.",
    color: "#120b0b",
  },
  {
    label: "Freshness",
    title: "Old context decays into tasking.",
    description: "Cells age out automatically, feeding a priority queue for agents to refresh the highest-risk stale zones.",
    color: "#0f0f14",
  },
  {
    label: "Trust",
    title: "Unknown agents can report, but cannot rewrite the mission.",
    description: "Dock and transport checks separate trusted initialization from untrusted or replayed packets.",
    color: "#0a1014",
  },
];

export type TimelineEvent = {
  t: string;
  tag: string;
  type: string;
  color: string;
  text: string;
  live?: boolean;
};

export const timeline: TimelineEvent[] = [
  { t: "10s ago", tag: "H1", type: "CONFLICT", color: "#fbbf24", text: "Cell F6 — H1 blocked vs Q1 open", live: true },
  { t: "14s ago", tag: "H1", type: "AGENT INIT", color: "#5fb2ff", text: "H1 initialized with context v.18", live: true },
  { t: "16s ago", tag: "STATION", type: "MERGE", color: "#34d399", text: "Context merged → version 18", live: true },
  { t: "37s ago", tag: "Q1", type: "DOCK CHECK-IN", color: "#34d399", text: "Q1 docked · uploaded 41 deltas", live: false },
  { t: "1m ago", tag: "OP-7", type: "RELAY", color: "#fbbf24", text: "OP-7 phone relayed 6 packets", live: false },
  { t: "2m ago", tag: "?·U", type: "REJECTED", color: "#f87171", text: "Unknown device packet · no key", live: false },
  { t: "3m ago", tag: "Q1", type: "DEAD END", color: "#f87171", text: "Dead end confirmed @ cell H4", live: false },
];

export const logFilters = ["ALL", "TRUST", "MAP"];

export type CommandPlaybook = {
  name: string;
  tag: string;
  rec: boolean;
};

export const commandPlaybooks: CommandPlaybook[] = [
  { name: "AREA SCAN", tag: "8 unk", rec: false },
  { name: "STALE RECHECK", tag: "1", rec: false },
  { name: "CONFLICT RECHECK", tag: "F6", rec: true },
  { name: "RELAY CHAIN", tag: "", rec: false },
  { name: "RETURN TO DOCK", tag: "", rec: false },
];

export const demoStages = ["EXPLORE", "DOCK", "MERGE", "SOLVE"];

export type AgentAction = {
  label: string;
  icon: string;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  accent: string;
  status: string;
  activity: string;
  battery: number;
  icon: string;
  image?: string;
  section: "human" | "robot";
  actions: AgentAction[];
};

export const agents: Agent[] = [
  {
    id: "OP-7",
    name: "OP-7",
    role: "FIELD OPERATOR",
    accent: "#fbbf24",
    status: "ON FOOT · RELAY · cell F11",
    activity: "Awaiting orders",
    battery: 64,
    section: "human",
    icon: "op",
    image: "/operators/op-lion.png",
    actions: [
      { label: "Send advisory", icon: "advise" },
      { label: "Direct to location", icon: "goto" },
      { label: "Request photo", icon: "photo" },
      { label: "Voice check-in", icon: "call" },
    ],
  },
  {
    id: "V-02",
    name: "V-02",
    role: "CQB SPOTTER",
    accent: "#a78bfa",
    status: "ACTIVE · NORTH WING · cell C7",
    activity: "Heading Alpha",
    battery: 82,
    section: "human",
    icon: "op",
    image: "/operators/op-gas.png",
    actions: [
      { label: "Send advisory", icon: "advise" },
      { label: "Direct to location", icon: "goto" },
      { label: "Request photo", icon: "photo" },
      { label: "Voice check-in", icon: "call" },
    ],
  },
  {
    id: "A-03",
    name: "A-03",
    role: "PERIMETER LEAD",
    accent: "#60a5fa",
    status: "ACTIVE · SOUTH GATE · cell P10",
    activity: "Active at south gate",
    battery: 91,
    section: "human",
    icon: "op",
    image: "/operators/op-fbi.png",
    actions: [
      { label: "Send advisory", icon: "advise" },
      { label: "Direct to location", icon: "goto" },
      { label: "Request photo", icon: "photo" },
      { label: "Voice check-in", icon: "call" },
    ],
  },
  {
    id: "R-04",
    name: "R-04",
    role: "BREACH OBSERVER",
    accent: "#f87171",
    status: "ACTIVE · EAST DOCK · cell H13",
    activity: "Observing east dock",
    battery: 77,
    section: "human",
    icon: "op",
    image: "/operators/op-riot.png",
    actions: [
      { label: "Send advisory", icon: "advise" },
      { label: "Direct to location", icon: "goto" },
      { label: "Request photo", icon: "photo" },
      { label: "Voice check-in", icon: "call" },
    ],
  },
  {
    id: "Q1",
    name: "Q1",
    role: "QUADRUPED SCOUT",
    accent: "#34d399",
    status: "DOCKED · SYNCING · cell B14",
    activity: "Docked · syncing",
    battery: 88,
    section: "robot",
    icon: "quad",
    actions: [
      { label: "Go to cell", icon: "goto" },
      { label: "Re-scan area", icon: "scan" },
      { label: "Set mode", icon: "mode" },
      { label: "Recall to dock", icon: "recall" },
    ],
  },
  {
    id: "H1",
    name: "H1",
    role: "HEXAPOD MEDIC",
    accent: "#5fb2ff",
    status: "EXPLORING · cell J5",
    activity: "Exploring sector J",
    battery: 73,
    section: "robot",
    icon: "hexapod",
    actions: [
      { label: "Go to cell", icon: "goto" },
      { label: "Re-scan area", icon: "scan" },
      { label: "Hold position", icon: "hold" },
      { label: "Return to dock", icon: "dock" },
    ],
  },
  {
    id: "D1",
    name: "D1",
    role: "DRONE · SIM",
    accent: "#94a3b8",
    status: "STANDBY · AERIAL · cell N8",
    activity: "Standby · aerial",
    battery: 100,
    section: "robot",
    icon: "drone",
    actions: [
      { label: "Launch", icon: "launch" },
      { label: "Orbit building", icon: "orbit" },
      { label: "Capture frames", icon: "photo" },
      { label: "Return to dock", icon: "dock" },
    ],
  },
];

export type BuildingStatus = "clear" | "partial" | "unmapped" | "conflict" | "stale";

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
  rooms: { label: string; state: "clear" | "unknown" }[];
  frames: number;
  by: string;
  ago: string;
};

export const buildings: Building[] = [
  {
    id: "B-12",
    label: "B12",
    kind: "OFFICE BLOCK",
    x: 0,
    y: 0,
    hexCol: 8,
    hexRow: 4,
    rotation: 0,
    status: "partial",
    w: 4,
    h2: 5,
    area: 620,
    floors: 3,
    roomCols: 3,
    rooms: [
      { label: "R1", state: "clear" },
      { label: "R2", state: "clear" },
      { label: "R3", state: "unknown" },
      { label: "R4", state: "unknown" },
      { label: "HALL", state: "clear" },
      { label: "R5", state: "unknown" },
    ],
    frames: 3,
    by: "Q1",
    ago: "2m",
  },
  {
    id: "B-18",
    label: "B18",
    kind: "WAREHOUSE",
    x: 0,
    y: 0,
    hexCol: 15,
    hexRow: 6,
    rotation: -15,
    status: "clear",
    w: 6,
    h2: 4,
    area: 940,
    floors: 1,
    roomCols: 4,
    rooms: [
      { label: "A1", state: "clear" },
      { label: "A2", state: "clear" },
      { label: "A3", state: "clear" },
      { label: "A4", state: "clear" },
    ],
    frames: 5,
    by: "H1",
    ago: "37s",
  },
  {
    id: "B-21",
    label: "B21",
    kind: "RESIDENTIAL",
    x: 0,
    y: 0,
    hexCol: 5,
    hexRow: 10,
    rotation: 12,
    status: "unmapped",
    w: 3,
    h2: 3,
    area: 280,
    floors: 2,
    roomCols: 2,
    rooms: [
      { label: "?", state: "unknown" },
      { label: "?", state: "unknown" },
      { label: "?", state: "unknown" },
    ],
    frames: 0,
    by: "—",
    ago: "—",
  },
  {
    id: "B-33",
    label: "B33",
    kind: "GARAGE",
    x: 0,
    y: 0,
    hexCol: 17,
    hexRow: 12,
    rotation: -8,
    status: "conflict",
    w: 4,
    h2: 3,
    area: 360,
    floors: 1,
    roomCols: 3,
    rooms: [
      { label: "B1", state: "clear" },
      { label: "B2", state: "unknown" },
      { label: "B3", state: "unknown" },
    ],
    frames: 1,
    by: "Q1",
    ago: "10s",
  },
  {
    id: "B-40",
    label: "B40",
    kind: "SHOPFRONT",
    x: 0,
    y: 0,
    hexCol: 12,
    hexRow: 14,
    rotation: 6,
    status: "stale",
    w: 3,
    h2: 4,
    area: 310,
    floors: 2,
    roomCols: 2,
    rooms: [
      { label: "S1", state: "unknown" },
      { label: "S2", state: "unknown" },
      { label: "S3", state: "unknown" },
    ],
    frames: 0,
    by: "D1",
    ago: "3m",
  },
  {
    id: "B-05",
    label: "B05",
    kind: "WATCH TOWER",
    x: 0,
    y: 0,
    hexCol: 3,
    hexRow: 3,
    rotation: 0,
    status: "clear",
    w: 2,
    h2: 2,
    area: 120,
    floors: 3,
    roomCols: 1,
    rooms: [{ label: "LOOKOUT", state: "clear" }],
    frames: 4,
    by: "H1",
    ago: "1m",
  },
  {
    id: "B-09",
    label: "B09",
    kind: "OFFICE BLOCK",
    x: 0,
    y: 0,
    hexCol: 9,
    hexRow: 9,
    rotation: -10,
    status: "partial",
    w: 3,
    h2: 5,
    area: 580,
    floors: 3,
    roomCols: 3,
    rooms: [
      { label: "R1", state: "clear" },
      { label: "R2", state: "unknown" },
      { label: "R3", state: "unknown" },
      { label: "HALL", state: "clear" },
    ],
    frames: 2,
    by: "V-02",
    ago: "4m",
  },
  {
    id: "B-14",
    label: "B14",
    kind: "WAREHOUSE",
    x: 0,
    y: 0,
    hexCol: 20,
    hexRow: 10,
    rotation: 8,
    status: "clear",
    w: 6,
    h2: 4,
    area: 900,
    floors: 1,
    roomCols: 4,
    rooms: [
      { label: "A1", state: "clear" },
      { label: "A2", state: "clear" },
      { label: "A3", state: "clear" },
      { label: "A4", state: "clear" },
    ],
    frames: 3,
    by: "A-03",
    ago: "2m",
  },
  {
    id: "B-25",
    label: "B25",
    kind: "RESIDENTIAL",
    x: 0,
    y: 0,
    hexCol: 25,
    hexRow: 15,
    rotation: 18,
    status: "unmapped",
    w: 3,
    h2: 3,
    area: 280,
    floors: 2,
    roomCols: 2,
    rooms: [
      { label: "?", state: "unknown" },
      { label: "?", state: "unknown" },
      { label: "?", state: "unknown" },
    ],
    frames: 0,
    by: "—",
    ago: "—",
  },
  {
    id: "B-30",
    label: "B30",
    kind: "BARRACKS",
    x: 0,
    y: 0,
    hexCol: 28,
    hexRow: 7,
    rotation: -5,
    status: "stale",
    w: 6,
    h2: 3,
    area: 640,
    floors: 1,
    roomCols: 3,
    rooms: [
      { label: "B1", state: "unknown" },
      { label: "B2", state: "unknown" },
      { label: "B3", state: "unknown" },
    ],
    frames: 1,
    by: "Q1",
    ago: "5m",
  },
  {
    id: "B-36",
    label: "B36",
    kind: "GARAGE",
    x: 0,
    y: 0,
    hexCol: 24,
    hexRow: 19,
    rotation: 12,
    status: "conflict",
    w: 4,
    h2: 3,
    area: 360,
    floors: 1,
    roomCols: 3,
    rooms: [
      { label: "G1", state: "clear" },
      { label: "G2", state: "unknown" },
      { label: "G3", state: "unknown" },
    ],
    frames: 2,
    by: "R-04",
    ago: "20s",
  },
];

export const legend = [
  { label: "OBSERVED", bg: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.5)" },
  { label: "DEAD END", bg: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.55)" },
  { label: "STALE", bg: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.55)" },
  { label: "CONFLICT", bg: "rgba(248,113,113,0.2)", border: "1px dashed #fbbf24" },
  { label: "STATION", bg: "rgba(52,211,153,0.3)", border: "1px solid #34d399" },
  { label: "GOAL", bg: "rgba(52,211,153,0.42)", border: "1px solid #5fe6b0" },
];
