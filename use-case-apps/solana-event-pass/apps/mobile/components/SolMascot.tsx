import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { colors } from "../app/theme";

const MASCOT_MODEL = require("../assets/mascot/sol-mascot-notex.glb");

if (typeof navigator === "undefined") {
	(globalThis as any).navigator = {};
}
if (!(globalThis.navigator as any).userAgent) {
	(globalThis.navigator as any).userAgent = "react-native";
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

function MascotModel({ scene }: { scene: THREE.Group }) {
	const groupRef = useRef<THREE.Group>(null);

	const centeredScene = useMemo(() => {
		const box = new THREE.Box3().setFromObject(scene);
		const center = box.getCenter(new THREE.Vector3());
		scene.position.set(-center.x, -center.y, -center.z);
		return scene;
	}, [scene]);

	useFrame(({ clock }) => {
		if (groupRef.current) {
			const t = clock.getElapsedTime();
			groupRef.current.position.y = Math.sin(t * 1.5) * 0.04;
			groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
		}
	});

	return (
		<group ref={groupRef} scale={1.6} position={[0, -0.25, 0]}>
			<primitive object={centeredScene} />
		</group>
	);
}

export function SolMascot({ size = 220 }: { size?: number }) {
	const [scene, setScene] = useState<THREE.Group | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const asset = Asset.fromModule(MASCOT_MODEL);
				await asset.downloadAsync();
				console.log("[SolMascot] asset downloaded", asset.localUri || asset.uri);
				const uri = asset.localUri || asset.uri;
				if (!uri) throw new Error("Mascot asset URI is missing");

				const base64 = await FileSystem.readAsStringAsync(uri, {
					encoding: FileSystem.EncodingType.Base64,
				});
				console.log("[SolMascot] base64 length", base64.length);
				const buffer = base64ToArrayBuffer(base64);

				const loader = new GLTFLoader();
				loader.parse(
					buffer,
					"",
					(gltf) => {
						console.log("[SolMascot] parsed scene children", gltf.scene.children.length);
						if (!mounted) return;
						setScene(gltf.scene);
					},
					(err) => {
						console.log("[SolMascot] parse error", err);
						if (!mounted) return;
						setError(err?.message || "Failed to parse mascot");
					},
				);
			} catch (err) {
				console.log("[SolMascot] load error", err, err instanceof Error ? err.stack : "");
				if (!mounted) return;
				setError(err instanceof Error ? err.message : String(err));
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	if (error || !scene) {
		return (
			<View style={[styles.loader, { width: size, height: size }]}>
				<ActivityIndicator color={error ? colors.live : colors.purple} />
			</View>
		);
	}

	return (
		<View style={[styles.container, { width: size, height: size }]}>
			<Canvas
				style={{ width: size, height: size }}
				camera={{ position: [0, 0, 3.5], fov: 45 }}
				gl={{ antialias: true }}
			>
				<ambientLight intensity={0.8} />
				<directionalLight position={[2, 4, 4]} intensity={1.2} />
				<directionalLight
					position={[-3, 2, -2]}
					intensity={0.6}
					color="#cba6ff"
				/>
				<MascotModel scene={scene} />
			</Canvas>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		overflow: "hidden",
		borderRadius: 24,
	},
	loader: {
		alignItems: "center",
		justifyContent: "center",
	},
});
