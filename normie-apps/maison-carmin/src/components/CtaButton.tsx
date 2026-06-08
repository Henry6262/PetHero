import React from "react";
import { cn } from "@app/lib/cn";

type Variant = "ruby" | "ghost" | "gold";
type Common = { children: React.ReactNode; className?: string; variant?: Variant };
type AsLink = Common & { as?: "a"; href: string };
type AsButton = Common & {
  as: "button";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};
type Props = AsLink | AsButton;

// Editorial CTA. `ruby` = solid ruby fill (primary). `ghost` = gold hairline on
// transparent (secondary). `gold` = solid gold fill (rare emphasis). Sharp 2px
// corners to match the couture/technical aesthetic.
const base =
  "group inline-flex items-center gap-3 rounded-[2px] px-7 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 disabled:cursor-default disabled:opacity-60";

const variants: Record<Variant, string> = {
  ruby: "bg-ruby text-platinum hover:bg-ruby-lit",
  ghost: "border border-gold/45 text-gold hover:border-gold hover:bg-gold/10",
  gold: "bg-gold text-obsidian hover:bg-gold-soft",
};

const lineColor: Record<Variant, string> = {
  ruby: "bg-platinum",
  ghost: "bg-gold",
  gold: "bg-obsidian",
};

export function CtaButton(props: Props) {
  const variant = props.variant ?? "ruby";
  const inner = (
    <>
      <span>{props.children}</span>
      <span
        className={cn(
          "h-px w-5 transition-all duration-200 group-hover:w-9",
          lineColor[variant]
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
