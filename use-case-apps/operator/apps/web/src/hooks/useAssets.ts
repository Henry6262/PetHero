import { useEffect, useState } from "react";
import type { Asset } from "../types/data";

export interface UseAssetsResult {
  assets: Asset[];
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 2000;

export function useAssets(): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/assets");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Asset[];
        if (cancelled) return;
        setAssets(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { assets, loading, error };
}
