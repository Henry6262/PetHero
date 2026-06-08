import type { CSSProperties, ReactNode } from "react";
import { cn } from "@app/lib/cn";

interface FrameProps {
  children: ReactNode;
  className?: string;
  /** Bracket colour — tint it ruby/gold for accent. */
  accent?: string;
  /** Corner bracket arm length, px. */
  corner?: number;
  /** Faint surface fill behind the content. */
  fill?: boolean;
}

/**
 * Minimal container ported from the PokeDex landing: instead of a full border,
 * draws four L-shaped corner brackets around the content (sharp corners,
 * premium/technical feel). Used for product cards and the 3D stage.
 */
export function Frame({
  children,
  className,
  accent = "rgba(201, 162, 75, 0.5)",
  corner = 26,
  fill = true,
}: FrameProps) {
  const arm: CSSProperties = { width: corner, height: corner, borderColor: accent, transition: "border-color 0.6s ease" };
  const base = "pointer-events-none absolute z-10";
  return (
    <div className={cn("relative", fill && "bg-white/[0.015] backdrop-blur-sm", className)}>
      <span className={cn(base, "left-0 top-0 border-l border-t")} style={arm} />
      <span className={cn(base, "right-0 top-0 border-r border-t")} style={arm} />
      <span className={cn(base, "bottom-0 left-0 border-b border-l")} style={arm} />
      <span className={cn(base, "bottom-0 right-0 border-b border-r")} style={arm} />
      {children}
    </div>
  );
}
