import { cn } from "@app/lib/cn";

/**
 * Pure-CSS hero backdrop: a painted court-line grid that fades out, a faint
 * halftone field, a single court "key" ghost, and a lime glow pooling up from
 * below. No JS, no WebGL — so it's automatically reduced-motion-safe and cheap.
 */
export function CourtBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {/* court grid */}
      <div className="absolute inset-0 court-lines opacity-60" />
      {/* halftone texture, lower third */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 halftone opacity-40" />
      {/* the painted key, ghosted behind the headline */}
      <div className="court-key absolute left-1/2 top-[12%] h-[320px] w-[240px] -translate-x-1/2 opacity-[0.35]" />
      {/* lime glow rising from the floor */}
      <div
        className="absolute inset-x-0 bottom-[-20%] h-[60%]"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(198,255,46,0.16), transparent 70%)",
        }}
      />
      {/* top vignette so the nav reads */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(to bottom, rgba(7,8,10,0.65), transparent)" }}
      />
    </div>
  );
}
