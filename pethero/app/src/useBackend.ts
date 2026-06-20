import { useEffect, useState } from "react";
import { WS_URL } from "./config";
import type {
  ActivityEvent,
  Detection,
  DispenseDecision,
  SystemStatus,
  WsMessage,
} from "./types";

export interface BackendState {
  connected: boolean;
  status: SystemStatus | null;
  detection: Detection | null;
  decision: DispenseDecision | null;
  lastEvent: ActivityEvent | null;
  log: ActivityEvent[];
  frame: string | null; // base64 jpeg
}

const EMPTY: BackendState = {
  connected: false,
  status: null,
  detection: null,
  decision: null,
  lastEvent: null,
  log: [],
  frame: null,
};

export function useBackend(): BackendState {
  const [state, setState] = useState<BackendState>(EMPTY);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => setState((s) => ({ ...s, connected: true }));

      ws.onmessage = (e) => {
        let msg: WsMessage;
        try {
          msg = JSON.parse(e.data as string);
        } catch {
          return;
        }
        setState((s) => reduce(s, msg));
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!closed) retry = setTimeout(connect, 1500);
      };

      ws.onerror = () => ws?.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return state;
}

function reduce(s: BackendState, msg: WsMessage): BackendState {
  switch (msg.type) {
    case "status": {
      const { type, ...status } = msg;
      return { ...s, status };
    }
    case "detection": {
      const { type, ...detection } = msg;
      return { ...s, detection };
    }
    case "decision": {
      const { type, ...decision } = msg;
      return { ...s, decision };
    }
    case "event": {
      const { type, ...event } = msg;
      return { ...s, lastEvent: event, log: [event, ...s.log].slice(0, 50) };
    }
    case "frame":
      return { ...s, frame: msg.jpeg_b64 };
    default:
      return s;
  }
}
