import * as THREE from "three";

const SKY_COLOR = new THREE.Color("#14181c");
const FOG_COLOR = new THREE.Color("#14181c");

export default function SkyEnvironment() {
  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 55, 185]} />
    </>
  );
}
