import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";

/**
 * A full-viewport, fixed aurora — ported from the react-bits Aurora (which uses
 * OGL) onto the three.js/R3F stack already in this app, then retuned to ruby +
 * gold. It animates continuously and drifts on scroll for a slow parallax, so a
 * single living glow sits behind every section. Reduced-motion freezes it.
 */

// react-bits Aurora fragment, ported to GLSL1 (gl_FragColor) + a scroll uniform.
const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3  uColorStops[3];
uniform vec2  uResolution;
uniform float uBlend;
uniform float uScroll;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop { vec3 color; float position; };

#define COLOR_RAMP(colors, factor, finalColor) {                 \
  int index = 0;                                                 \
  for (int i = 0; i < 2; i++) {                                  \
     ColorStop currentColor = colors[i];                         \
     bool isInBetween = currentColor.position <= factor;         \
     index = int(mix(float(index), float(i), float(isInBetween)));\
  }                                                              \
  ColorStop currentColor = colors[index];                        \
  ColorStop nextColor = colors[index + 1];                       \
  float range = nextColor.position - currentColor.position;      \
  float lerpFactor = (factor - currentColor.position) / range;   \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  // uScroll pushes the band as the page scrolls -> slow vertical parallax
  height = (uv.y * 2.0 - height + 0.2 + uScroll);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;
  gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

const VERT = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// ruby blood -> ruby highlight -> gold, ramped left to right
const COLOR_STOPS = ["#8a0f1a", "#ff2b46", "#c9a24b"].map((hex) => {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
});

function Aurora({ reduced }: { reduced: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useRef({
    uTime: { value: 0 },
    uAmplitude: { value: 1.0 },
    uBlend: { value: 0.5 },
    uScroll: { value: 0 },
    uColorStops: { value: COLOR_STOPS },
    uResolution: { value: new THREE.Vector2(1, 1) },
  });

  useFrame((state, delta) => {
    const u = uniforms.current;
    u.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    if (reduced) {
      u.uTime.value = 6.0; // a frozen, pleasant frame
      u.uScroll.value = 0;
      return;
    }
    u.uTime.value += delta * 0.32;
    // window scroll progress -> subtle drift (Lenis writes native scroll)
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    // ease toward target so it glides instead of snapping
    u.uScroll.value += (progress * 0.55 - u.uScroll.value) * Math.min(1, delta * 3);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms.current}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </ScreenQuad>
  );
}

export function AuroraBackdrop({ reduced, className }: { reduced: boolean; className?: string }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? "demand" : "always"}
        style={{ width: "100%", height: "100%" }}
      >
        <Aurora reduced={reduced} />
      </Canvas>
    </div>
  );
}
