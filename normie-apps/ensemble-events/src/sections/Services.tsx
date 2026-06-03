import AnimatedContent from "@/free/Animations/AnimatedContent/AnimatedContent";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";

const KEYS = ["catering", "artists", "brigade", "production"] as const;

export function Services() {
  const { t } = useT();
  const reduced = useReducedMotion();

  return (
    <section id="services" className="bg-cream px-6 py-28 text-ink md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-2xl font-display text-[2.6rem] leading-[1.02] text-ink md:text-6xl">
            {t("services.title")}
          </h2>
          <p className="label text-gold">{t("services.eyebrow")}</p>
        </div>

        <div className="border-t border-ink/15">
          {KEYS.map((key, i) => {
            const Row = (
              <article className="group grid grid-cols-12 items-baseline gap-4 border-b border-ink/15 py-9 transition-colors duration-500 hover:bg-ink/[0.03] md:py-12">
                <span className="col-span-2 font-display text-2xl text-gold md:text-3xl">
                  {`0${i + 1}`}
                </span>
                <h3 className="col-span-10 font-display text-3xl leading-tight text-ink md:col-span-5 md:text-[2.6rem]">
                  {t(`services.items.${key}.title`)}
                </h3>
                <p className="col-span-12 mt-3 max-w-md text-sm leading-relaxed text-ink/65 md:col-span-5 md:col-start-8 md:mt-0">
                  {t(`services.items.${key}.body`)}
                </p>
              </article>
            );
            return reduced ? (
              <div key={key}>{Row}</div>
            ) : (
              <AnimatedContent
                key={key}
                distance={30}
                direction="vertical"
                duration={0.9}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                threshold={0.1}
                delay={i * 0.04}
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
