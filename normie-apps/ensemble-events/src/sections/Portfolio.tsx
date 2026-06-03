import { useMemo, useState } from "react";
import Masonry from "@/free/Components/Masonry/Masonry";
import { useT } from "@app/i18n";
import { PORTFOLIO } from "@app/assets/placeholders";
import { cn } from "@app/lib/cn";

type Tag = "all" | "private" | "corporate" | "wedding";

export function Portfolio() {
  const { t } = useT();
  const [tag, setTag] = useState<Tag>("all");

  const items = useMemo(
    () =>
      PORTFOLIO.filter((p) => tag === "all" || p.tag === tag).map((p) => ({
        id: p.id,
        img: p.img,
        url: "#",
        height: p.height,
      })),
    [tag]
  );

  const filters: Tag[] = ["all", "private", "corporate", "wedding"];

  return (
    <section id="portfolio" className="bg-cream px-6 py-28 text-ink md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-[2.6rem] leading-[1.02] text-ink md:text-6xl">
              {t("portfolio.title")}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setTag(f)}
                className={cn(
                  "rounded-full border px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors",
                  tag === f
                    ? "border-gold bg-gold text-espresso"
                    : "border-ink/20 text-ink/55 hover:border-ink/50 hover:text-ink"
                )}
              >
                {f === "all" ? "All" : t(`portfolio.tags.${f}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[36rem] w-full">
          <Masonry
            key={tag}
            items={items}
            animateFrom="bottom"
            scaleOnHover
            hoverScale={0.97}
            blurToFocus
            duration={0.6}
            stagger={0.05}
          />
        </div>

        <p className="mt-10 max-w-md text-sm italic text-ink/55">{t("portfolio.note")}</p>
      </div>
    </section>
  );
}
