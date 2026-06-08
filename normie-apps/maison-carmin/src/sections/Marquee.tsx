import { useT } from "@app/i18n";

/** A slow assurance ribbon between hero and collection — gold on obsidian. */
export function Marquee() {
  const { t } = useT();
  const items = ["a", "b", "c", "d", "e"].map((k) => t(`marquee.${k}`));
  const row = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-line py-4">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap will-change-transform">
        {row.map((item, idx) => (
          <span key={idx} className="flex items-center gap-10">
            <span className="label text-silver/70">{item}</span>
            <span className="size-1 rotate-45 bg-gold/60" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
