import { cn } from "@app/lib/cn";

/**
 * Lightweight coach tile: initials avatar (no photo needed), name, role and a
 * one-line credential. Lime accent rail on the left. Drop in a photo later by
 * extending with an optional `photo` prop.
 */
export function CoachCard({
  name,
  initials,
  role,
  credential,
  className,
}: {
  name: string;
  initials: string;
  role: string;
  credential: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-2xl border border-line bg-ink p-5 transition-colors hover:border-lime/40",
        className
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-lime/70 transition-all group-hover:w-1.5" />
      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-lime/25 to-lime/5 font-display text-xl text-lime">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight text-chalk">{name}</p>
        <p className="label mt-1 text-[0.6rem] text-lime">{role}</p>
        <p className="mt-2 text-sm leading-snug text-chalk-dim">{credential}</p>
      </div>
    </div>
  );
}
