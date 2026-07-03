import { useEffect, useRef } from "react";
import * as THREE from "three";

type DroneRig = {
  group: THREE.Group;
  core: THREE.Mesh;
  rotors: THREE.Mesh[];
  phase: number;
  speed: number;
  xBase: number;
  xDrift: number;
  zOffset: number;
  yBase: number;
};

const DRONE_PLAN = [
  { xBase: -24, xDrift: 2.4, yBase: 8.8, zOffset: 0, speed: 8.2, phase: 0, color: 0x34d399 },
  { xBase: -10, xDrift: 3.2, yBase: 10.6, zOffset: 13, speed: 7.4, phase: 1.8, color: 0x5fb2ff },
  { xBase: 6, xDrift: 3.8, yBase: 9.4, zOffset: 27, speed: 8.9, phase: 3.1, color: 0x34d399 },
  { xBase: 20, xDrift: 2.8, yBase: 11.2, zOffset: 41, speed: 6.9, phase: 4.4, color: 0x5fb2ff },
  { xBase: 31, xDrift: 2.2, yBase: 7.9, zOffset: 55, speed: 8.5, phase: 5.7, color: 0xfbbf24 },
];

function makeDroneRig(plan: (typeof DRONE_PLAN)[number]): DroneRig {
  const group = new THREE.Group();

  const coreMaterial = new THREE.MeshBasicMaterial({ color: plan.color, wireframe: true });
  const armMaterial = new THREE.MeshBasicMaterial({ color: plan.color, transparent: true, opacity: 0.85 });
  const rotorMaterial = new THREE.MeshBasicMaterial({
    color: plan.color,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.05), coreMaterial);
  group.add(core);

  const armA = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 0.05), armMaterial);
  const armB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2.5), armMaterial);
  group.add(armA, armB);

  const rotors = [
    [-1.85, 0, -1.35],
    [1.85, 0, -1.35],
    [-1.85, 0, 1.35],
    [1.85, 0, 1.35],
  ].map(([x, y, z]) => {
    const rotor = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 30), rotorMaterial);
    rotor.position.set(x, y, z);
    rotor.rotation.x = -Math.PI / 2;
    group.add(rotor);
    return rotor;
  });

  const scanner = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.58, 48), rotorMaterial);
  scanner.rotation.x = -Math.PI / 2;
  scanner.position.y = -0.32;
  group.add(scanner);

  return { group, core, rotors, ...plan };
}

export default function DroneHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mouse = { x: 0, y: 0 };
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.021);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 220);
    camera.position.set(0, 9, 27);
    camera.lookAt(0, 0, -8);

    const size = 78;
    const seg = 84;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y =
        Math.sin(x * 0.24) * Math.cos(z * 0.21) * 1.25 +
        Math.sin(x * 0.62 + z * 0.4) * 0.5 +
        Math.random() * 0.28;
      pos.setY(i, y);
    }

    geo.computeVertexNormals();
    const colors = new Float32Array(pos.count * 3);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      wireframe: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const drones = DRONE_PLAN.map(makeDroneRig);
    drones.forEach(({ group }) => scene.add(group));

    const pcount = 420;
    const pg = new THREE.BufferGeometry();
    const parr = new Float32Array(pcount * 3);
    for (let i = 0; i < pcount; i += 1) {
      parr[i * 3] = (Math.random() - 0.5) * size;
      parr[i * 3 + 1] = Math.random() * 17;
      parr[i * 3 + 2] = (Math.random() - 0.5) * size;
    }
    pg.setAttribute("position", new THREE.BufferAttribute(parr, 3));
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x5fb2ff,
      size: 0.085,
      transparent: true,
      opacity: 0.55,
    });
    const points = new THREE.Points(pg, pointsMaterial);
    scene.add(points);

    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const w2 = canvas.clientWidth;
      const h2 = canvas.clientHeight;
      renderer.setSize(w2, h2, false);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
    };

    const move = (event: MouseEvent) => {
      mouse.x = event.clientX / window.innerWidth - 0.5;
      mouse.y = event.clientY / window.innerHeight - 0.5;
    };

    const animate = () => {
      const t = (performance.now() - start) / 1000;
      const span = size + 22;
      const scanZ = ((t * 8) % span) - (size / 2 + 11);
      const band = 3.6;

      for (let i = 0; i < pos.count; i += 1) {
        const z = pos.getZ(i);
        const d = Math.abs(z - scanZ);
        if (d < band) {
          const k = 1 - d / band;
          colors[i * 3] = 0.18 + 0.22 * k;
          colors[i * 3 + 1] = 0.66 + 0.17 * k;
          colors[i * 3 + 2] = 0.52 + 0.16 * k;
        } else {
          colors[i * 3] = 0.2;
          colors[i * 3 + 1] = 0.29;
          colors[i * 3 + 2] = 0.36;
        }
      }
      geo.attributes.color.needsUpdate = true;

      drones.forEach((drone) => {
        const z = ((t * drone.speed + drone.zOffset) % span) - (size / 2 + 11);
        drone.group.position.set(
          drone.xBase + Math.sin(t * 0.55 + drone.phase) * drone.xDrift,
          drone.yBase + Math.sin(t * 1.4 + drone.phase) * 0.62,
          z,
        );
        drone.group.rotation.y = t * 0.45 + drone.phase;
        drone.group.rotation.z = Math.sin(t * 0.85 + drone.phase) * 0.08;
        drone.core.rotation.x = t * 0.9 + drone.phase;
        drone.core.rotation.z = t * 0.6;
        drone.rotors.forEach((rotor, index) => {
          rotor.rotation.z = t * 10 + index;
        });
      });

      for (let i = 0; i < parr.length; i += 3) {
        parr[i + 1] += 0.016;
        if (parr[i + 1] > 17) parr[i + 1] = 0;
      }
      points.geometry.attributes.position.needsUpdate = true;

      camera.position.x += (mouse.x * 4.5 - camera.position.x) * 0.04;
      camera.position.y += (9 - mouse.y * 3 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, -8);

      frame = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", move);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", move);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      drones.forEach(({ group }) => {
        group.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
      });
      pg.dispose();
      pointsMaterial.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="drone-hero" aria-hidden="true" />;
}
