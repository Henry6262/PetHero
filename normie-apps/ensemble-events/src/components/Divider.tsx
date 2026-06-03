import { cn } from "@app/lib/cn";

type Tone = "cream" | "espresso";

/**
 * Editorial section separator: a centred gold ornament on a hairline, with an
 * optional roman numeral + kicker. Sits between sections to give the page a
 * deliberate, magazine-like cadence.
 */
export function Divider({
  numeral,
  kicker,
  tone = "espresso",
  className,
}: {
  numeral?: string;
  kicker?: string;
  tone?: Tone;
  className?: string;
}) {
  const line = tone === "cream" ? "bg-ink/15" : "bg-cream/15";
  const text = tone === "cream" ? "text-ink/55" : "text-cream/55";
  const bg = tone === "cream" ? "bg-cream" : "bg-espresso";

  return (
    <div className={cn("w-full px-6 md:px-10", bg, className)}>
      <div className="mx-auto flex max-w-6xl items-center gap-6 py-10 md:py-14">
        <span className={cn("h-px flex-1", line)} />
        {(numeral || kicker) && (
          <span className={cn("flex items-center gap-3 whitespace-nowrap", text)}>
            {numeral && <span className="font-display text-lg text-gold">{numeral}</span>}
            {kicker && <span className="label">{kicker}</span>}
          </span>
        )}
        <Ornament tone={tone} />
        <span className={cn("h-px flex-1", line)} />
      </div>
    </div>
  );
}

function Ornament({ tone }: { tone: Tone }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden>
      <path
        d="M7 0 L9 5 L14 7 L9 9 L7 14 L5 9 L0 7 L5 5 Z"
        fill={tone === "cream" ? "#16140f" : "#c0a160"}
        opacity={tone === "cream" ? 0.5 : 1}
      />
    </svg>
  );
}
