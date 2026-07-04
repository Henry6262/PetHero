import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateProps } from "../../lib/props";
import { createCarGeometry, createCarMaterial } from "../../lib/car";
import type { Building } from "../../data/sections";

export default function CarLayer({ buildings }: { buildings: Building[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const cars = useMemo(() => generateProps(buildings).cars, [buildings]);
  const geometry = useMemo(() => createCarGeometry(), []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Group cars by color so each color gets one InstancedMesh.
    const byColor = new Map<string, typeof cars>();
    for (const car of cars) {
      const list = byColor.get(car.color) ?? [];
      list.push(car);
      byColor.set(car.color, list);
    }

    const meshes: THREE.InstancedMesh[] = [];
    const dummy = new THREE.Object3D();

    for (const [color, instances] of byColor.entries()) {
      const material = createCarMaterial(color);
      const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      instances.forEach((car, i) => {
        dummy.position.copy(car.position);
        dummy.rotation.set(0, car.rotation, 0);
        dummy.scale.copy(car.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
      meshes.push(mesh);
    }

    return () => {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
      group.clear();
    };
  }, [cars, geometry]);

  return <group ref={groupRef} />;
}
