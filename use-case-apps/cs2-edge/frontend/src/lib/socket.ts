type MessageHandler = (data: unknown) => void;
const handlers = new Map<string, Set<MessageHandler>>();

let ws: WebSocket | null = null;
let userId: string | null = null;

export function initSocket(uid: string) {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  userId = uid;
  const wsUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
    .replace(/^http/, "ws") + "/ws/coinflip";

  ws = new WebSocket(wsUrl);

  ws.addEventListener("open", () => {
    ws!.send(JSON.stringify({ type: "auth", userId: uid }));
  });

  ws.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data as string) as { type: string };
      const set = handlers.get(data.type);
      if (set) set.forEach((fn) => fn(data));
    } catch {
      // ignore
    }
  });

  ws.addEventListener("close", () => {
    // retry after 3s
    setTimeout(() => { if (userId) initSocket(userId); }, 3000);
  });
}

export function closeSocket() {
  ws?.close();
  ws = null;
  userId = null;
}

export function onSocketEvent(type: string, handler: MessageHandler) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => handlers.get(type)?.delete(handler); // returns unsubscribe fn
}
