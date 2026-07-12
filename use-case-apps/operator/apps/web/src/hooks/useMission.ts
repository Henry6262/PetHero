import { useCallback, useEffect, useState } from "react";
import type { TheaterMission, TheaterOperation } from "../types/data";

export type MissionEngineState = "idle" | "running" | "paused" | "complete";

export interface MissionStateResponse {
  active: boolean;
  operation: TheaterOperation;
  mission?: TheaterMission;
  state?: MissionEngineState;
  elapsedMs?: number;
  tickCount?: number;
}

export interface UseMissionResult {
  operation: TheaterOperation | null;
  mission: TheaterMission | null;
  state: MissionEngineState | null;
  elapsedMs: number;
  tickCount: number;
  loading: boolean;
  error: string | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;

async function fetchState(): Promise<MissionStateResponse | null> {
  try {
    const res = await fetch("/api/missions/state");
    if (!res.ok) return null;
    return (await res.json()) as MissionStateResponse;
  } catch {
    return null;
  }
}

function deriveMission(
  operation: TheaterOperation,
  activeMission?: TheaterMission
): TheaterMission | null {
  if (activeMission) return activeMission;
  return operation.missions.find((m) => m.active) ?? operation.missions[0] ?? null;
}

export function useMission(): UseMissionResult {
  const [operation, setOperation] = useState<TheaterOperation | null>(null);
  const [mission, setMission] = useState<TheaterMission | null>(null);
  const [state, setState] = useState<MissionEngineState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await fetchState();
    if (!data) {
      setError("Mission state unavailable");
      setLoading(false);
      return;
    }
    setOperation(data.operation);
    setMission(deriveMission(data.operation, data.mission));
    setState(data.active ? data.state ?? "idle" : "idle");
    setElapsedMs(data.elapsedMs ?? 0);
    setTickCount(data.tickCount ?? 0);
    setError(null);
    setLoading(false);
  }, []);

  const postAction = useCallback(
    async (action: "start" | "pause" | "resume" | "reset") => {
      try {
        const res = await fetch(`/api/missions/${action}`, { method: "POST" });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? `Failed to ${action} mission`);
          return;
        }
        await refresh();
      } catch (err) {
        setError(String(err));
      }
    },
    [refresh]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await refresh();
    }

    load();
    const interval = setInterval(() => {
      if (!cancelled) refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    operation,
    mission,
    state,
    elapsedMs,
    tickCount,
    loading,
    error,
    start: () => postAction("start"),
    pause: () => postAction("pause"),
    resume: () => postAction("resume"),
    reset: () => postAction("reset"),
  };
}
