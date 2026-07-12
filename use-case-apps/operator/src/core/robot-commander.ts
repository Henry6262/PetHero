import type { Asset, AssetRole, AssetStatus, GeoPoint } from "../shared/mission.ts";

export interface RobotCommand {
  command: "move_to_waypoint" | "stop" | "scan" | "return_to_dock" | "actuate";
  waypointId?: string;
  action?: string;
}

export interface RobotCommandAck {
  ok: boolean;
  commandId: string;
  state?: AssetStatus;
  message?: string;
}

export interface Waypoint {
  id: string;
  lat: number;
  lon: number;
}

/**
 * Central registry for mission assets. Simulates movement for adapters
 * that are not backed by real hardware, and issues HTTP commands to real ones.
 */
export class RobotCommander {
  private assets = new Map<string, Asset>();
  private waypoints = new Map<string, Waypoint>();
  private commandCounter = 1;

  registerAssets(...assets: Asset[]) {
    for (const asset of assets) {
      this.assets.set(asset.id, asset);
    }
  }

  registerWaypoints(...waypoints: Waypoint[]) {
    for (const wp of waypoints) {
      this.waypoints.set(wp.id, wp);
    }
  }

  getAssets(): Asset[] {
    return [...this.assets.values()];
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  updateAsset(id: string, patch: Partial<Asset>): Asset | undefined {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    const updated = { ...asset, ...patch };
    this.assets.set(id, updated);
    return updated;
  }

  async sendCommand(assetId: string, command: RobotCommand): Promise<RobotCommandAck> {
    const asset = this.assets.get(assetId);
    if (!asset) return { ok: false, commandId: this.nextCommandId(), message: "Asset not found" };

    // Simulated assets: update state immediately.
    if (asset.isSimulated) {
      this.applySimulatedCommand(asset, command);
      return { ok: true, commandId: this.nextCommandId(), state: asset.status };
    }

    // Real assets: POST to adapter URL.
    if (!asset.adapterUrl) {
      return { ok: false, commandId: this.nextCommandId(), message: "No adapter URL" };
    }

    try {
      const res = await fetch(`${asset.adapterUrl}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RobotCommandAck;
      return data;
    } catch (err) {
      return { ok: false, commandId: this.nextCommandId(), message: String(err) };
    }
  }

  /** Advance simulated assets toward their target waypoints. Call once per second. */
  tickSimulatedAssets() {
    for (const asset of this.assets.values()) {
      if (!asset.isSimulated || asset.status !== "moving") continue;
      const target = asset.currentWaypointId ? this.waypoints.get(asset.currentWaypointId) : undefined;
      if (!target) continue;
      this.stepToward(asset, target, 0.5);
    }
  }

  private applySimulatedCommand(asset: Asset, command: RobotCommand) {
    switch (command.command) {
      case "move_to_waypoint":
        asset.currentWaypointId = command.waypointId;
        asset.status = "moving";
        break;
      case "stop":
        asset.status = "busy";
        break;
      case "scan":
        asset.status = "scanning";
        break;
      case "return_to_dock":
        asset.status = "returning";
        break;
      case "actuate":
        asset.status = "busy";
        break;
    }
  }

  private stepToward(asset: Asset, target: Waypoint, stepMeters: number) {
    const dy = (target.lat - asset.lat) * 111_320;
    const dx = (target.lon - asset.lon) * 111_320 * Math.cos(asset.lat * (Math.PI / 180));
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < stepMeters) {
      asset.lat = target.lat;
      asset.lon = target.lon;
      asset.status = "idle";
      return;
    }
    const ratio = stepMeters / dist;
    asset.lat += (target.lat - asset.lat) * ratio;
    asset.lon += (target.lon - asset.lon) * ratio;
    asset.heading = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
  }

  private nextCommandId(): string {
    return `CMD-${String(this.commandCounter++).padStart(4, "0")}`;
  }
}
