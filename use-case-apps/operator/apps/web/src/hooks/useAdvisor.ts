import { useCallback, useEffect, useState } from "react";
import type { AdvisorRecommendation, ReasoningLogEntry } from "../types/data";

export interface AdvisorBriefResponse {
  brief: AdvisorRecommendation;
  pendingDecision: AdvisorRecommendation | null;
  state: string;
  elapsedMs: number;
}

export interface UseAdvisorResult {
  brief: AdvisorRecommendation | null;
  pendingDecision: AdvisorRecommendation | null;
  reasoning: ReasoningLogEntry[];
  loading: boolean;
  error: string | null;
  submitDecision: (decisionId: string, approved: boolean, note?: string) => Promise<void>;
  injectContact: (lat: number, lon: number, classification?: string) => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;

export function useAdvisor(): UseAdvisorResult {
  const [brief, setBrief] = useState<AdvisorRecommendation | null>(null);
  const [pendingDecision, setPendingDecision] = useState<AdvisorRecommendation | null>(null);
  const [reasoning, setReasoning] = useState<ReasoningLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [briefRes, reasoningRes] = await Promise.all([
        fetch("/api/advisor/brief"),
        fetch("/api/advisor/reasoning"),
      ]);
      if (!briefRes.ok) throw new Error(`brief HTTP ${briefRes.status}`);
      if (!reasoningRes.ok) throw new Error(`reasoning HTTP ${reasoningRes.status}`);

      const briefData = (await briefRes.json()) as AdvisorBriefResponse;
      const reasoningData = (await reasoningRes.json()) as { log: ReasoningLogEntry[] };

      setBrief(briefData.brief);
      setPendingDecision(briefData.pendingDecision);
      setReasoning(reasoningData.log);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const submitDecision = useCallback(async (decisionId: string, approved: boolean, note?: string) => {
    const res = await fetch("/api/advisor/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisionId, approved, note }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await load();
  }, [load]);

  const injectContact = useCallback(async (lat: number, lon: number, classification?: string) => {
    const res = await fetch("/api/advisor/inject-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, classification }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (!cancelled) await load();
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  return { brief, pendingDecision, reasoning, loading, error, submitDecision, injectContact };
}
