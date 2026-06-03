import React from "react";
import AnimatedContent from "@/free/Animations/AnimatedContent/AnimatedContent";
import { useReducedMotion } from "@app/lib/useReducedMotion";

/**
 * One restrained on-scroll reveal. Wraps the vault's AnimatedContent with
 * quiet-luxury defaults; renders plainly when reduced motion is requested.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 40,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <AnimatedContent
      distance={distance}
      direction="vertical"
      duration={1.1}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      threshold={0.15}
      delay={delay}
    >
      <div className={className}>{children}</div>
    </AnimatedContent>
  );
}
