import type { IncomingEvent } from "../core/context-store.ts";

export const demoDeltas: IncomingEvent[] = [
  {
    kind: "map_cell",
    cellId: "A1",
    x: 0,
    y: 0,
    confidence: 0.94,
    observedAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    kind: "detection",
    cellId: "A2",
    x: 1,
    y: 0,
    label: "person",
    confidence: 0.81,
    observedAt: new Date(Date.now() - 45_000).toISOString(),
  },
  {
    kind: "change",
    cellId: "B2",
    x: 1,
    y: 1,
    label: "open_door",
    confidence: 0.74,
    observedAt: new Date(Date.now() - 30_000).toISOString(),
  },
];
