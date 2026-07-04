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

  // Roof / cabin darker shade.
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(40, 60, 176, 90);

  // Windows.
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(50, 70, 156, 30);
  ctx.fillRect(50, 110, 156, 25);

  // Headlights.
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(40, 215, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(216, 215, 18, 0, Math.PI * 2);
  ctx.fill();

  // Taillights.
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(40, 40, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(216, 40, 16, 0, Math.PI * 2);
  ctx.fill();

  // Grill / bumper line.
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 160);
  ctx.lineTo(CAR_TEXTURE_SIZE, 160);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCarGeometry(): THREE.BufferGeometry {
  // Simple low-poly sedan body — a single box with a UV-mapped texture.
  return new THREE.BoxGeometry(2.0, 0.95, 4.0);
}

export function createCarMaterial(bodyColor: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: createCarTexture(bodyColor),
    roughness: 0.35,
    metalness: 0.15,
  });
}
