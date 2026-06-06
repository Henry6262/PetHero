import React from "react";
import { cn } from "@app/lib/cn";

type Variant = "lime" | "ghost";
type Common = { children: React.ReactNode; className?: string; variant?: Variant };
type AsLink = Common & { as?: "a"; href: string };
type AsButton = Common & {
  as: "button";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};
type Props = AsLink | AsButton;

// Street CTA. `lime` = solid shock-lime fill with ink text (primary action).
// `ghost` = lime outline on transparent (secondary action).
const base =
  "group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] transition-colors duration-200 disabled:cursor-default disabled:opacity-60";

const variants: Record<Variant, string> = {
  lime: "bg-lime text-ink hover:bg-lime-soft",
  ghost: "border border-lime/60 text-lime hover:bg-lime/10",
};

export function CtaButton(props: Props) {
  const variant = props.variant ?? "lime";
  const inner = (
    <>
      <span>{props.children}</span>
      <span
        className={cn(
          "h-px w-5 transition-all duration-200 group-hover:w-8",
          variant === "lime" ? "bg-ink" : "bg-lime"
        )}
      />
    </>
  );

  if (props.as === "button") {
    return (
      <button
        type={props.type ?? "button"}
        disabled={props.disabled}
        onClick={props.onClick}
        className={cn(base, variants[variant], props.className)}
      >
        {inner}
      </button>
    );
  }
  return (
    <a href={props.href} className={cn(base, variants[variant], props.className)}>
      {inner}
    </a>
  );
}
