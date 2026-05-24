// src/betting/coinflip.ws.ts
import type { WSContext } from "hono/ws";

const connections = new Map<string, WSContext>();

export const coinflipWs = {
  register(userId: string, ws: WSContext) {
    connections.set(userId, ws);
  },
  unregister(userId: string) {
    connections.delete(userId);
  },
  notifyMatched(creatorId: string, joinerId: string, game: object) {
    const msg = JSON.stringify({ type: "coinflip:matched", game });
    connections.get(creatorId)?.send(msg);
    connections.get(joinerId)?.send(msg);
  },
  notifyResult(
    creatorId: string,
    joinerId: string,
    payload: { winnerId: string; game: object }
  ) {
    const msg = JSON.stringify({ type: "coinflip:result", ...payload });
    connections.get(creatorId)?.send(msg);
    connections.get(joinerId)?.send(msg);
  },
};
