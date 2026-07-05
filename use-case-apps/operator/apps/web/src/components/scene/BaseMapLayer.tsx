import TerrainLayer from "./TerrainLayer";
import DroneMapLayer from "./DroneMapLayer";

export type BaseMapSource = "procedural" | "drone";

export interface BaseMapLayerProps {
  source: BaseMapSource;
}

/**
 * Base map switcher.
 *
 * Renders the active ground layer underneath tactical overlays (hex grid,
 * buildings, agents). Adding a new map source only requires a new branch here
 * and a matching component.
 */
export default function BaseMapLayer({ source }: BaseMapLayerProps) {
  if (source === "drone") {
    return <DroneMapLayer />;
  }
  return <TerrainLayer />;
}
