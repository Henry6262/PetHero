import { useEffect, useState } from "react";
import type { FusedTrack, SensorFeed, SensorSource } from "../types/data";

const POLL_INTERVAL_MS = 2000;

export interface UseFusionResult {
  fused: FusedTrack[];
  feeds: SensorFeed[];
  sources: SensorSource[];
  loading: boolean;
}

export function useFusion(): UseFusionResult {
  const [fused, setFused] = useState<FusedTrack[]>([]);
  const [feeds, setFeeds] = useState<SensorFeed[]>([]);
  const [sources, setSources] = useState<SensorSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      try {
        const response = await fetch("/api/fusion/sources");
        if (!response.ok) return;
        const data = (await response.json()) as SensorSource[];
        if (!cancelled) setSources(data);
      } catch {
        // ignore
      }
    }

    async function loadTracks() {
      try {
        const response = await fetch("/api/fusion/tracks");
        if (!response.ok) return;
        const data = (await response.json()) as { fused: FusedTrack[]; feeds: SensorFeed[] };
        if (cancelled) return;
        setFused(data.fused);
        setFeeds(data.feeds);
        setLoading(false);
      } catch {
        // ignore
      }
    }

    loadSources();
    loadTracks();
    const interval = setInterval(loadTracks, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { fused, feeds, sources, loading };
}
