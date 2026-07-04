import { createContext, useContext, useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Chunk } from "../../lib/chunks";
import { getVisibleChunkIds } from "../../lib/chunks";

const VisibleChunksContext = createContext<Set<string>>(new Set());

export function useVisibleChunks(): Set<string> {
  return useContext(VisibleChunksContext);
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}

export default function ChunkVisibility({
  chunks,
  children,
}: {
  chunks: Chunk[];
  children: React.ReactNode;
}) {
  const { camera } = useThree();
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    camera.updateMatrixWorld();
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    const next = getVisibleChunkIds(chunks, frustum);
    setVisible((prev) => (setsEqual(prev, next) ? prev : next));
  });

  return <VisibleChunksContext.Provider value={visible}>{children}</VisibleChunksContext.Provider>;
}
