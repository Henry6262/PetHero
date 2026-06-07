/**
 * One fixed, full-page backdrop shared by every section: an even court grid, a
 * faint halftone, branded lime light pooling from the top and floor, and an edge
 * vignette for depth. Pure CSS — reduced-motion-safe, cheap, and it does NOT
 * include the 3D model (that lives in the hero only).
 */
export function GlobalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-concrete" aria-hidden>
      {/* court grid, faded toward the edges */}
      <div
        className="absolute inset-0 court-grid opacity-50"
        style={{
          WebkitMaskImage: "radial-gradient(130% 120% at 50% 30%, #000 45%, transparent 95%)",
          maskImage: "radial-gradient(130% 120% at 50% 30%, #000 45%, transparent 95%)",
        }}
      />
      {/* halftone texture */}
      <div className="absolute inset-0 halftone opacity-15" />
      {/* branded lime light from the top */}
      <div
        className="absolute inset-x-0 top-0 h-[75vh]"
        style={{ background: "radial-gradient(60% 80% at 50% -5%, rgba(198,255,46,0.12), transparent 70%)" }}
      />
      {/* soft floor glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh]"
        style={{ background: "radial-gradient(70% 100% at 50% 105%, rgba(198,255,46,0.06), transparent 70%)" }}
      />
      {/* edge vignette for depth */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 120% at 50% 38%, transparent 52%, rgba(7,8,10,0.6) 100%)" }}
      />
    </div>
  );
}
