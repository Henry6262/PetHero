import * as THREE from "three";
import { getTerrainHeight } from "./terrain";

// Original CSS route points from the dashboard SVG.
const CSS_ROUTE_POINTS: [number, number][] = [
  [76, 426],
  [220, 426],
  [202, 333],
  [346, 333],
  [382, 240],
  [526, 240],
  [508, 147],
  [688, 147],
  [688, 54],
];

const CSS_BOARD_WIDTH = 880;
const CSS_BOARD_HEIGHT = 640;
const WORLD_WIDTH = 78;
const WORLD_DEPTH = 49;

function cssToWorld(cssX: number, cssY: number): THREE.Vector3 {
  const x = (cssX - CSS_BOARD_WIDTH / 2) * (WORLD_WIDTH / CSS_BOARD_WIDTH);
  const z = (cssY - CSS_BOARD_HEIGHT / 2) * (WORLD_DEPTH / CSS_BOARD_HEIGHT);
  const y = getTerrainHeight(x, z) + 0.3;
  return new THREE.Vector3(x, y, z);
}

export function buildRouteCurve(): THREE.CatmullRomCurve3 {
  const points = CSS_ROUTE_POINTS.map(([cx, cy]) => cssToWorld(cx, cy));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}
