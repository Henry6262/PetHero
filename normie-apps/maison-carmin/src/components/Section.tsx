import React from "react";
import { cn } from "@app/lib/cn";

type Tone = "obsidian" | "ink";

interface SectionProps {
  id?: string;
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/** Vertical-rhythm section wrapper with two surface tones. */
export function Section({
  id,
  tone = "obsidian",
  className,
  containerClassName,
  children,
}: SectionProps) {
  // Transparent so the shared global backdrop shows through every section.
  // `ink` lays a faint dark wash for a touch of rhythm between sections.
  const tones: Record<Tone, string> = {
    obsidian: "bg-transparent text-platinum",
    ink: "bg-ink/40 text-platinum",
  };
  return (
    <section
      id={id}
      className={cn("w-full px-6 py-24 md:px-10 md:py-32", tones[tone], className)}
    >
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>{children}</div>
    </section>
  );
}

/** Small uppercase gold eyebrow used to open most sections. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mb-5 label text-gold/90", className)}>{children}</p>;
}
