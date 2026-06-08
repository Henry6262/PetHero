import { cn } from "@app/lib/cn";

/**
 * Editorial separator between sections: a hairline gold rule with a small
 * diamond ornament and an optional kicker — like a maker's mark on the page.
 */
export function Divider({ kicker, className }: { kicker?: string; className?: string }) {
  return (
    <div className={cn("w-full px-6 md:px-10", className)}>
      <div className="mx-auto flex max-w-6xl items-center gap-5 py-10 md:py-14">
        <span className="h-px flex-1 gold-rule" />
        {kicker && <span className="label whitespace-nowrap text-silver/70">{kicker}</span>}
        <Diamond />
        <span className="h-px flex-1 gold-rule" />
      </div>
    </div>
  );
}

function Diamond() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-hidden>
      <rect x="6" y="0.5" width="7" height="7" transform="rotate(45 6 0.5)" fill="none" stroke="#c9a24b" strokeWidth="1" />
    </svg>
  );
}
