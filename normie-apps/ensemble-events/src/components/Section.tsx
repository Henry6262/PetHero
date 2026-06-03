import React from "react";
import { cn } from "@app/lib/cn";

type Tone = "cream" | "espresso";

interface SectionProps {
  id?: string;
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/** Vertical-rhythm section wrapper with the two brand tones. */
export function Section({
  id,
  tone = "cream",
  className,
  containerClassName,
  children,
}: SectionProps) {
  const tones: Record<Tone, string> = {
    cream: "bg-cream text-ink",
    espresso: "bg-espresso text-cream-dark",
  };
  return (
    <section
      id={id}
      className={cn("w-full px-6 py-24 md:px-10 md:py-36", tones[tone], className)}
    >
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>{children}</div>
    </section>
  );
}

/** Small uppercase gold eyebrow used to open most sections. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-5 text-xs font-medium uppercase tracking-[0.28em] text-gold",
        className
      )}
    >
      {children}
    </p>
  );
}
