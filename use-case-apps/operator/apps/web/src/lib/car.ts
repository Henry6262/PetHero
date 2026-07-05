import * as THREE from "three";

const CAR_TEXTURE_SIZE = 256;

export function createCarTexture(bodyColor: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CAR_TEXTURE_SIZE;
  canvas.height = CAR_TEXTURE_SIZE;
  const ctx = canvas.getContext("2d")!;

  // Body paint.
  ctx.fillStyle = bodyColor;
  ctx.fillRect(0, 0, CAR_TEXTURE_SIZE, CAR_TEXTURE_SIZE);

  // Side strip / wheel arches.
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 160, CAR_TEXTURE_SIZE, 40);

  // Windows.
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(45, 50, 166, 50);

  // Headlights.
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(50, 215, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(206, 215, 18, 0, Math.PI * 2);
  ctx.fill();

  // Taillights.
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(50, 40, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(206, 40, 14, 0, Math.PI * 2);
  ctx.fill();

  // Grill line.
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 190);
  ctx.lineTo(CAR_TEXTURE_SIZE, 190);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCarGroup(bodyColor: string): THREE.Group {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: createCarTexture(bodyColor),
    roughness: 0.35,
    metalness: 0.15,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#1e293b",
    roughness: 0.15,
    metalness: 0.4,
  });

  const bumperMaterial = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.7,
    metalness: 0.1,
  });

  // Main body — taller, not smashed.
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.15, 4.0), bodyMaterial);
  body.position.y = 0.58;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Cabin / glass top.
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 2.3), glassMaterial);
  cabin.position.set(0, 1.45, -0.15);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  group.add(cabin);

  // Bumper strips front/back.
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.25, 0.15), bumperMaterial);
  frontBumper.position.set(0, 0.45, 2.02);
  group.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.25, 0.15), bumperMaterial);
  rearBumper.position.set(0, 0.45, -2.02);
  group.add(rearBumper);

  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#1f2937", roughness: 0.9 });
  const wheelPositions: [number, number, number][] = [
    [-0.95, 0.32, 1.3],
    [0.95, 0.32, 1.3],
    [-0.95, 0.32, -1.3],
    [0.95, 0.32, -1.3],
  ];
  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(...pos);
    wheel.castShadow = true;
    group.add(wheel);
  }

  return group;
}
