import { useEffect, useState } from "react";

export interface UseNetworkStatusResult {
  online: boolean;
  /** True when the browser reports itself offline (simulated DDIL). */
  degraded: boolean;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { online, degraded: !online };
}
