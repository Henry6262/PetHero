/**
 * One fixed, full-page backdrop shared by every section: a fine couture grid, a
 * diagonal vitrine sheen, ruby light pooling from the top and floor, and an edge
 * vignette for depth. Pure CSS — reduced-motion-safe, cheap, and it does NOT
 * include any 3D (those live in the hero + collection canvases only).
 */
export function GlobalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-obsidian" aria-hidden>
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
