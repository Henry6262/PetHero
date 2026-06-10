import { lazy, Suspense } from "react";
import { useReducedMotion } from "@app/lib/useReducedMotion";

// The aurora pulls in three.js — lazy-load so it never blocks first paint.
const AuroraBackdrop = lazy(() =>
  import("@app/components/AuroraBackdrop").then((m) => ({ default: m.AuroraBackdrop }))
);

/**
 * One fixed, full-page backdrop shared by every section: a living ruby/gold
 * aurora (WebGL) at the base, then a fine couture grid, a diagonal vitrine
 * sheen, ruby light pooling from the top and floor, and an edge vignette for
 * depth. The aurora animates + drifts on scroll (slow parallax); the CSS layers
 * sit on top for texture. Reduced-motion freezes the aurora.
 */
export function GlobalBackdrop() {
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-obsidian" aria-hidden>
      {/* living ruby/gold aurora — the animated, parallaxing base layer */}
      <Suspense fallback={null}>
        <AuroraBackdrop reduced={reduced} className="absolute inset-0 opacity-70" />
      </Suspense>
      {/* couture grid, faded toward the edges */}
      <div
        className="absolute inset-0 fine-grid opacity-40"
        style={{
          WebkitMaskImage: "radial-gradient(130% 120% at 50% 28%, #000 42%, transparent 95%)",
          maskImage: "radial-gradient(130% 120% at 50% 28%, #000 42%, transparent 95%)",
        }}
      />
      {/* raking vitrine sheen */}
      <div className="absolute inset-0 vitrine-sheen opacity-60" />
      {/* ruby light from the top */}
      <div
        className="absolute inset-x-0 top-0 h-[78vh]"
        style={{ background: "radial-gradient(58% 80% at 62% -8%, rgba(194,16,46,0.16), transparent 70%)" }}
      />
      {/* deep blood glow on the floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh]"
        style={{ background: "radial-gradient(70% 100% at 40% 108%, rgba(138,15,26,0.12), transparent 70%)" }}
      />
      {/* edge vignette for depth */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 120% at 50% 36%, transparent 50%, rgba(6,3,4,0.72) 100%)" }}
      />
    </div>
  );
}
