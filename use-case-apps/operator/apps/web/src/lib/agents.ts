import * as THREE from "three";
import { getTerrainHeight } from "./terrain";
import type { Agent } from "../types/data";

export interface Agent3D {
  id: string;
  agent: Agent;
  position: THREE.Vector3;
  heading: number;
  altitude: number;
}

// Ground agent positions are (x, z) in the centered world coordinate system.
// Y is injected from terrain height at runtime.
const AGENT_POSITIONS: Record<string, [number, number]> = {
  "OP-7": [-19.9, 7.5],
  "V-02": [-30.3, -4.5],
  "A-03": [16.4, 4.5],
  "R-04": [-13.0, 13.5],
  Q1: [-32.1, 16.5],
  H1: [-6.1, -10.5],
  D1: [9.5, -1.5],
};

const AGENT_HEADINGS: Record<string, number> = {
  "OP-7": 45,
  "V-02": -15,
  "A-03": -80,
  "R-04": 110,
  Q1: 35,
  H1: -120,
  D1: 60,
};

const GROUND_OFFSET = 0.15;

export function buildAgents3D(agents: Agent[]): Agent3D[] {
  return agents.map((agent) => {
    const [x, z] = AGENT_POSITIONS[agent.id] ?? [0, 0];
    const isDrone = agent.id === "D1";
    const terrainY = getTerrainHeight(x, z);
    const altitude = isDrone ? 5.5 : GROUND_OFFSET;
    return {
      id: agent.id,
      agent,
      position: new THREE.Vector3(x, terrainY + altitude, z),
      heading: (AGENT_HEADINGS[agent.id] ?? 0) * (Math.PI / 180),
      altitude,
    };
  });
}
