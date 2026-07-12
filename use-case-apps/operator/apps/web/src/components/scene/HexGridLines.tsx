import { useMemo } from "react";
import * as THREE from "three";
import { generateCells, HEX_SIZE, cellWorldPosition } from "../../lib/hex";
import { getTerrainHeight } from "../../lib/terrain";

export default function HexGridLines({
  color = "#5a656f",
  opacity = 0.22,
  radius = HEX_SIZE * 0.94,
}: {
  color?: string;
  opacity?: number;
  radius?: number;
}) {
  const geometry = useMemo(() => {
    const cells = generateCells();
    const positions: number[] = [];
    const angleStep = Math.PI / 3;

    for (const cell of cells) {
      const { x, z } = cellWorldPosition(cell.col, cell.row);
      const corners: [number, number, number][] = [];
      for (let i = 0; i < 6; i++) {
        // Match the pointy-top orientation used by createHexGeometry.
        const angle = i * angleStep + Math.PI / 6;
        const cx = x + Math.cos(angle) * radius;
        const cz = z + Math.sin(angle) * radius;
        corners.push([cx, getTerrainHeight(cx, cz) + 0.03, cz]);
      }
      for (let i = 0; i < 6; i++) {
        const [x1, y1, z1] = corners[i];
        const [x2, y2, z2] = corners[(i + 1) % 6];
        positions.push(x1, y1, z1, x2, y2, z2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [radius]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    [color, opacity]
  );

  return <lineSegments geometry={geometry} material={material} />;
}
