import AnimatedContent from "@/free/Animations/AnimatedContent/AnimatedContent";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { SERVICE_IMG } from "@app/assets/placeholders";
import { cn } from "@app/lib/cn";

const KEYS = ["catering", "artists", "brigade", "production"] as const;

export function Services() {
  const { t } = useT();
  const reduced = useReducedMotion();

  return (
    <section id="services" className="bg-cream px-6 py-28 text-ink md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-2xl font-display text-[2.8rem] leading-[1.0] text-ink md:text-[5rem]">
            {t("services.title")}
          </h2>
          <p className="label text-gold">{t("services.eyebrow")}</p>
        </div>

        <div className="flex flex-col gap-20 md:gap-28">
          {KEYS.map((key, i) => {
            const flip = i % 2 === 1;
            const Row = (
              <article className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <figure
                  className={cn(
                    "frame-gold relative aspect-[4/5] overflow-hidden md:aspect-[5/6]",
                    flip && "md:order-2"
                  )}
                >
                  <img
                    src={SERVICE_IMG[key]}
                    alt={t(`services.items.${key}.title`)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1.2s] hover:scale-[1.04]"
                  />
                  <span className="absolute left-5 top-5 z-[3] font-display text-2xl text-cream drop-shadow">
                    {`0${i + 1}`}
                  </span>
                </figure>

                <div className={cn(flip && "md:order-1")}>
                  <span className="label text-gold">{`0${i + 1} — ${t("services.eyebrow")}`}</span>
                  <h3 className="mt-5 font-display text-4xl leading-tight text-ink md:text-[3.4rem]">
                    {t(`services.items.${key}.title`)}
                  </h3>
                  <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70 md:text-lg">
                    {t(`services.items.${key}.body`)}
                  </p>
                  <span className="mt-8 block h-px w-16 bg-gold" />
                </div>
              </article>
            );
            return reduced ? (
              <div key={key}>{Row}</div>
            ) : (
              <AnimatedContent
                key={key}
                distance={50}
                direction="vertical"
                duration={1}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                threshold={0.12}
              >
                {Row}
              </AnimatedContent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
