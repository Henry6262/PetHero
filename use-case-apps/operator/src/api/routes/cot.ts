import { Hono } from "hono";
import { createSocket } from "node:dgram";
import { missionToCotXml, tracksToCotXml } from "../../core/cot-emitter.ts";
import type { FusionSystem } from "./fusion.ts";
import type { RobotCommander } from "../../core/robot-commander.ts";
import type { TheaterOperation } from "../../shared/mission.ts";

export function buildCotRoutes(fusion: FusionSystem, commander: RobotCommander, defaultOperation: TheaterOperation) {
  const app = new Hono();

  app.get("/tracks", (c) => {
    const xml = tracksToCotXml(fusion.engine.getFusedTracks());
    return c.text(xml, 200, { "Content-Type": "application/xml" });
  });

  app.get("/mission", (c) => {
    const mission = defaultOperation.missions[0];
    const xml = missionToCotXml(mission, commander.getAssets());
    return c.text(xml, 200, { "Content-Type": "application/xml" });
  });

  app.post("/send", async (c) => {
    const target = process.env["COT_UDP_TARGET"] ?? "127.0.0.1:8087";
    const [host, portStr] = target.split(":");
    const port = Number(portStr ?? "8087");
    if (!host || Number.isNaN(port)) {
      return c.json({ error: "Invalid COT_UDP_TARGET" }, 400);
    }

    const tracks = fusion.engine.getFusedTracks();
    const mission = defaultOperation.missions[0];
    const xml = `${tracksToCotXml(tracks)}\n${missionToCotXml(mission, commander.getAssets())}`;

    try {
      await sendUdp(host, port, xml);
      return c.json({ ok: true, sent: xml.length, target: `${host}:${port}` });
    } catch (err) {
      return c.json({ ok: false, error: String(err) }, 502);
    }
  });

  return app;
}

function sendUdp(host: string, port: number, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = createSocket("udp4");
    const buffer = Buffer.from(message, "utf-8");
    socket.send(buffer, port, host, (err) => {
      socket.close();
      if (err) reject(err);
      else resolve();
    });
  });
}
