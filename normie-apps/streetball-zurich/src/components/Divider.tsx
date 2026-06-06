import { cn } from "@app/lib/cn";

/**
 * Court-cadence separator between sections: a hairline with an optional quarter
 * label (Q1–Q4, OT) + kicker and a lime hash-mark ornament — like the painted
 * marks on a street court.
 */
export function Divider({
  quarter,
  kicker,
  className,
}: {
  quarter?: string;
  kicker?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full bg-concrete px-6 md:px-10", className)}>
      <div className="mx-auto flex max-w-6xl items-center gap-5 py-9 md:py-12">
        <span className="h-px flex-1 bg-line" />
        {(quarter || kicker) && (
          <span className="flex items-center gap-3 whitespace-nowrap">
            {quarter && <span className="font-display text-base text-lime">{quarter}</span>}
            {kicker && <span className="label text-chalk-dim">{kicker}</span>}
          </span>
        )}
        <Hash />
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

function Hash() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" className="shrink-0" aria-hidden>
      <g stroke="#c6ff2e" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="1" x2="1" y2="13" />
        <line x1="10" y1="1" x2="7" y2="13" />
        <line x1="16" y1="1" x2="13" y2="13" />
      </g>
    </svg>
  );
}
