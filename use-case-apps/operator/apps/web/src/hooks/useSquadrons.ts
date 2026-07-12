import { useEffect, useState } from "react";
import type { Squadron } from "../types/data";

const DEFAULT_POLL_INTERVAL_MS = 5000;

export interface UseSquadronsResult {
  squadrons: Squadron[];
  loading: boolean;
  offline: boolean;
}

/**
 * Poll the backend squadron feed and fall back to static demo data when the
 * API is unreachable. The hook cleans up its interval on unmount.
 */
export function useSquadrons(
  fallback: Squadron[],
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
): UseSquadronsResult {
  const [squadrons, setSquadrons] = useState<Squadron[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/squadrons");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as Squadron[];
        if (cancelled) return;
        setSquadrons(data);
        setOffline(false);
      } catch {
        if (cancelled) return;
        setSquadrons(fallback);
        setOffline(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fallback, pollIntervalMs]);

  return { squadrons, loading, offline };
}
