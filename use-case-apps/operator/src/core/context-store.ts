import type {
  AgentKind,
  AgentRecord,
  AgentStatus,
  CellStatus,
  DetectionLabel,
  GridCell,
  MissionEvent,
  MissionState,
} from "./types.ts";

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;
const MAX_EVENTS = 250;

export interface IncomingEvent {
  kind: MissionEvent["kind"];
  cellId?: string;
  x?: number;
  y?: number;
  label?: DetectionLabel;
  confidence?: number;
  observedAt?: string;
  payload?: Record<string, unknown>;
}

export class MissionContextStore {
  private revision = 0;
  private agents = new Map<string, AgentRecord>();
  private cells = new Map<string, GridCell>();
  private events: MissionEvent[] = [];

  constructor(private staleAfterMs = DEFAULT_STALE_AFTER_MS) {}

  reset() {
    this.revision = 0;
    this.agents.clear();
    this.cells.clear();
    this.events = [];
  }

  upsertAgent(input: {
    id: string;
    kind?: AgentKind;
    status?: AgentStatus;
    trusted?: boolean;
    batteryPct?: number;
    position?: { x: number; y: number };
    localRevision?: number;
  }): AgentRecord {
    const now = new Date().toISOString();
    const existing = this.agents.get(input.id);
    const agent: AgentRecord = {
      id: input.id,
      kind: input.kind ?? existing?.kind ?? "simulated",
      status: input.status ?? existing?.status ?? "active",
      trusted: input.trusted ?? existing?.trusted ?? false,
      lastSeenAt: now,
      batteryPct: input.batteryPct ?? existing?.batteryPct,
      position: input.position ?? existing?.position,
      localRevision: input.localRevision ?? existing?.localRevision,
    };
    this.agents.set(input.id, agent);
    this.revision++;
    return agent;
  }

  ingestEvent(agentId: string, incoming: IncomingEvent): MissionEvent {
    const now = new Date().toISOString();
    const confidence = clamp(incoming.confidence ?? 0.5, 0, 1);
    const event: MissionEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      agentId,
      kind: incoming.kind,
      observedAt: incoming.observedAt ?? now,
      receivedAt: now,
      cellId: incoming.cellId,
      x: incoming.x,
      y: incoming.y,
      label: incoming.label,
      confidence,
      payload: incoming.payload,
    };

    this.events.push(event);
    this.events = this.events.slice(-MAX_EVENTS);
    this.upsertAgent({
      id: agentId,
      status: "active",
      position:
        typeof incoming.x === "number" && typeof incoming.y === "number"
          ? { x: incoming.x, y: incoming.y }
          : undefined,
    });

    if (event.cellId) {
      this.mergeCellEvent(event);
    }

    this.revision++;
    return event;
  }

  ingestDeltaBatch(agentId: string, deltas: IncomingEvent[]): MissionEvent[] {
    return deltas.map((delta) => this.ingestEvent(agentId, delta));
  }

  getState(): MissionState {
    this.refreshStaleness();
    return {
      revision: this.revision,
      generatedAt: new Date().toISOString(),
      agents: [...this.agents.values()],
      cells: [...this.cells.values()],
      events: this.events,
    };
  }

  getStaleCells() {
    this.refreshStaleness();
    return [...this.cells.values()]
      .filter((cell) => cell.status === "stale")
      .sort((a, b) => a.freshnessScore - b.freshnessScore);
  }

  private mergeCellEvent(event: MissionEvent) {
    if (!event.cellId) return;

    const existing = this.cells.get(event.cellId);
    const previousLabels = existing?.labels ?? [];
    const labels = event.label ? unique([...previousLabels, event.label]) : previousLabels;
    const status = this.resolveCellStatus(existing, event, labels);

    const cell: GridCell = {
      id: event.cellId,
      x: event.x ?? existing?.x ?? 0,
      y: event.y ?? existing?.y ?? 0,
      status,
      confidence: event.confidence,
      freshnessScore: 1,
      updatedAt: event.observedAt,
      lastEventId: event.id,
      labels,
      provenance: [
        ...(existing?.provenance ?? []).slice(-7),
        {
          eventId: event.id,
          agentId: event.agentId,
          observedAt: event.observedAt,
          confidence: event.confidence,
          label: event.label,
        },
      ],
    };

    this.cells.set(cell.id, cell);
  }

  private resolveCellStatus(
    existing: GridCell | undefined,
    event: MissionEvent,
    labels: DetectionLabel[]
  ): CellStatus {
    if (event.kind === "change") return "alert";
    if (event.kind === "detection" && event.label && event.label !== "unknown") {
      const hasConflict =
        existing &&
        existing.labels.length > 0 &&
        !existing.labels.includes(event.label) &&
        Date.now() - Date.parse(existing.updatedAt) < this.staleAfterMs;
      return hasConflict ? "conflict" : "alert";
    }
    if (labels.length > 1) return "conflict";
    return "observed";
  }

  private refreshStaleness() {
    const now = Date.now();
    for (const cell of this.cells.values()) {
      const ageMs = Math.max(0, now - Date.parse(cell.updatedAt));
      const freshnessScore = clamp(1 - ageMs / this.staleAfterMs, 0, 1);
      cell.freshnessScore = Number(freshnessScore.toFixed(3));
      if (freshnessScore === 0 && cell.status !== "conflict") {
        cell.status = "stale";
      }
    }
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}
