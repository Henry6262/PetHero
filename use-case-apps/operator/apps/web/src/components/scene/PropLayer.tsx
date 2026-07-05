import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateProps, propGeometry, type PropType } from "../../lib/props";
import type { Building } from "../../types/data";

export default function PropLayer({ buildings }: { buildings: Building[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const props = useMemo(() => generateProps(buildings).props, [buildings]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Build one InstancedMesh per prop type.
    const byType = new Map<PropType, THREE.InstancedMesh>();
    const types: PropType[] = [
      "wrecked-car",
      "truck",
      "barrier",
      "sandbag-wall",
      "crate",
      "barrel",
      "tire-stack",
      "wall",
      "gate",
      "dock-beacon",
    ];

    for (const type of types) {
      const geometry = propGeometry(type);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.75,
        metalness: 0.1,
      });
      const instances = props.filter((p) => p.type === type);
      const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      instances.forEach((p, i) => {
        dummy.position.copy(p.position);
        dummy.position.y += p.scale.y * 0.5;
        dummy.rotation.y = p.rotation;
        dummy.scale.copy(p.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color.set(p.color));
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      group.add(mesh);
      byType.set(type, mesh);
    }

    return () => {
      for (const mesh of byType.values()) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
      group.clear();
    };
  }, [props]);

  return <group ref={groupRef} />;
}
