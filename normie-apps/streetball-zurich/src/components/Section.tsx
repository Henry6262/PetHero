import React from "react";
import { cn } from "@app/lib/cn";

type Tone = "concrete" | "ink";

interface SectionProps {
  id?: string;
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/** Vertical-rhythm section wrapper with the two surface tones. */
export function Section({
  id,
  tone = "concrete",
  className,
  containerClassName,
  children,
}: SectionProps) {
  const tones: Record<Tone, string> = {
    concrete: "bg-concrete text-chalk",
    ink: "bg-concrete-2 text-chalk",
  };
  return (
    <section
      id={id}
      className={cn("w-full px-6 py-20 md:px-10 md:py-28", tones[tone], className)}
    >
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>{children}</div>
    </section>
  );
}

/** Small uppercase lime eyebrow used to open most sections. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-4 label text-lime", className)}>{children}</p>
  );
}
