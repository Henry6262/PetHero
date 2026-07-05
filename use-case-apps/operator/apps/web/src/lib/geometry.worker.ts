import * as THREE from "three";
import { createHexGeometry } from "./hex";
import { createBuildingGeometry } from "./buildings";

export type HexGeometryPayload = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
};

export type BuildingGeometryPayload = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  index: Uint32Array | null;
};

export type WorkerRequest =
  | { type: "hex"; id: number; size: number; height: number }
  | { type: "building"; id: number; footprint: [number, number][]; height: number };

function serializeGeometry(geometry: THREE.BufferGeometry): {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  index: Uint32Array | null;
} {
  const pos = geometry.attributes.position.array as Float32Array;
  const normal = geometry.attributes.normal?.array as Float32Array;
  const uv = geometry.attributes.uv?.array as Float32Array;
  const idx = geometry.index?.array as Uint32Array | null;
  return {
    positions: pos.slice(),
    normals: normal ? normal.slice() : new Float32Array(),
    uvs: uv ? uv.slice() : new Float32Array(),
    index: idx ? idx.slice() : null,
  };
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (msg.type === "hex") {
    const geometry = createHexGeometry(msg.size, msg.height);
    const { positions, normals, uvs } = serializeGeometry(geometry);
    const payload: HexGeometryPayload = { positions, normals, uvs };
    self.postMessage({ type: "hex", id: msg.id, payload }, [positions.buffer, normals.buffer, uvs.buffer] as any[]);
    geometry.dispose();
  } else if (msg.type === "building") {
    const geometry = createBuildingGeometry(
      msg.footprint.map(([x, y]) => new THREE.Vector2(x, y)),
      msg.height
    );
    const { positions, normals, uvs, index } = serializeGeometry(geometry);
    const payload: BuildingGeometryPayload = { positions, normals, uvs, index };
    const transferables = [positions.buffer, normals.buffer, uvs.buffer];
    if (index) transferables.push(index.buffer);
    self.postMessage({ type: "building", id: msg.id, payload }, transferables as any[]);
    geometry.dispose();
  }
};
