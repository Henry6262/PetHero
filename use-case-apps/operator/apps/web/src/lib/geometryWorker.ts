import * as THREE from "three";
import type { HexGeometryPayload, BuildingGeometryPayload, WorkerRequest } from "./geometry.worker";

const GeometryWorker = new Worker(new URL("./geometry.worker.ts", import.meta.url), { type: "module" });
let requestId = 0;

function nextId() {
  return ++requestId;
}

export function requestHexGeometry(size: number, height: number): Promise<THREE.BufferGeometry> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent<{ type: "hex"; id: number; payload: HexGeometryPayload }>) => {
      if (e.data.type !== "hex" || e.data.id !== id) return;
      GeometryWorker.removeEventListener("message", onMessage);
      const { positions, normals, uvs } = e.data.payload;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      resolve(geometry);
    };
    GeometryWorker.addEventListener("message", onMessage);
    GeometryWorker.postMessage({ type: "hex", id, size, height } as WorkerRequest);
  });
}

export function requestBuildingGeometry(footprint: [number, number][], height: number): Promise<THREE.BufferGeometry> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent<{ type: "building"; id: number; payload: BuildingGeometryPayload }>) => {
      if (e.data.type !== "building" || e.data.id !== id) return;
      GeometryWorker.removeEventListener("message", onMessage);
      const { positions, normals, uvs, index } = e.data.payload;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      if (index) geometry.setIndex(new THREE.BufferAttribute(index, 1));
      resolve(geometry);
    };
    GeometryWorker.addEventListener("message", onMessage);
    GeometryWorker.postMessage({ type: "building", id, footprint, height } as WorkerRequest);
  });
}
