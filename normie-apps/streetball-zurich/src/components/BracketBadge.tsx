import { cn } from "@app/lib/cn";
import type { BracketId } from "@app/data/brackets";

/** Small lime-bordered pill: the bracket id, optionally with a born-year note. */
export function BracketBadge({
  id,
  note,
  active = false,
  className,
}: {
  id: BracketId;
  note?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-display text-sm tracking-wide",
        active
          ? "border-lime bg-lime/15 text-lime"
          : "border-line text-chalk-dim",
        className
      )}
    >
      <span>{id}</span>
      {note && <span className="font-body text-[0.7rem] font-medium normal-case tracking-normal text-chalk-dim">{note}</span>}
    </span>
  );
}
