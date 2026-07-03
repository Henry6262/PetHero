import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import CameraControls from "camera-controls";

CameraControls.install({ THREE });

export interface TacticalCameraHandle {
  iso: () => void;
  flat: () => void;
  reset: () => void;
  rotate: (deg: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  snapTo: (position: { x: number; y: number; z: number }) => void;
}

const ISO_POSITION = new THREE.Vector3(-8, 24, 36);
const ISO_TARGET = new THREE.Vector3(0, 0, 0);
const FLAT_POSITION = new THREE.Vector3(0, 55, 0);
const FLAT_TARGET = new THREE.Vector3(0, 0, 0);

const TacticalCamera = forwardRef<TacticalCameraHandle>((_, ref) => {
  const controlsRef = useRef<CameraControls | null>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    const controls = new CameraControls(camera, gl.domElement);
    controlsRef.current = controls;

    controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
    controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
    controls.touches.two = CameraControls.ACTION.TOUCH_ZOOM_TRUCK;

    controls.smoothTime = 0.2;
    controls.draggingSmoothTime = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 10;
    controls.maxDistance = 220;
    controls.boundaryEnclosesCamera = false;

    controls.setLookAt(
      ISO_POSITION.x,
      ISO_POSITION.y,
      ISO_POSITION.z,
      ISO_TARGET.x,
      ISO_TARGET.y,
      ISO_TARGET.z,
      false
    );

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    controlsRef.current?.update(delta);
  });

  useImperativeHandle(ref, () => ({
    iso: () => {
      const c = controlsRef.current;
      if (!c) return;
      c.setLookAt(
        ISO_POSITION.x,
        ISO_POSITION.y,
        ISO_POSITION.z,
        ISO_TARGET.x,
        ISO_TARGET.y,
        ISO_TARGET.z,
        true
      );
    },
    flat: () => {
      const c = controlsRef.current;
      if (!c) return;
      c.setLookAt(
        FLAT_POSITION.x,
        FLAT_POSITION.y,
        FLAT_POSITION.z,
        FLAT_TARGET.x,
        FLAT_TARGET.y,
        FLAT_TARGET.z,
        true
      );
      // In flat view, left mouse should pan instead of rotate.
      c.mouseButtons.left = CameraControls.ACTION.TRUCK;
    },
    reset: () => {
      const c = controlsRef.current;
      if (!c) return;
      c.setLookAt(
        ISO_POSITION.x,
        ISO_POSITION.y,
        ISO_POSITION.z,
        ISO_TARGET.x,
        ISO_TARGET.y,
        ISO_TARGET.z,
        true
      );
      c.mouseButtons.left = CameraControls.ACTION.ROTATE;
    },
    rotate: (deg: number) => {
      const c = controlsRef.current;
      if (!c) return;
      c.rotate(deg * (Math.PI / 180), 0, true);
    },
    zoomIn: () => {
      const c = controlsRef.current;
      if (!c) return;
      const next = Math.max(c.distance * 0.87, c.minDistance);
      c.dollyTo(next, true);
    },
    zoomOut: () => {
      const c = controlsRef.current;
      if (!c) return;
      const next = Math.min(c.distance * 1.15, c.maxDistance);
      c.dollyTo(next, true);
    },
    snapTo: (position: { x: number; y: number; z: number }) => {
      const c = controlsRef.current;
      if (!c) return;
      const target = new THREE.Vector3(position.x, position.y, position.z);
      const offset = new THREE.Vector3(-10, 22, 18);
      const eye = target.clone().add(offset);
      c.setLookAt(eye.x, eye.y, eye.z, target.x, target.y, target.z, true);
      c.mouseButtons.left = CameraControls.ACTION.ROTATE;
    },
  }));

  return null;
});

TacticalCamera.displayName = "TacticalCamera";

export default TacticalCamera;
