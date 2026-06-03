import { Reveal } from "@app/components/Reveal";
import { useT } from "@app/i18n";
import { BRIGADE_SHOTS, TEAM } from "@app/assets/placeholders";

export function Brigade() {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden bg-espresso px-6 py-28 md:px-10 md:py-40">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-10 font-display text-[30vw] leading-none text-cream/[0.03]"
      >
        II
      </span>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 className="font-display text-[2.6rem] leading-[1.03] text-cream md:text-[4rem]">
              {t("brigade.title")}
            </h2>
          </div>
          <p className="text-base leading-relaxed text-cream/70 md:col-span-5">{t("brigade.body")}</p>
        </div>

        {/* Action-shot rail — lightweight CSS scroll-snap, no second WebGL context */}
        <div className="no-bar mt-16 flex snap-x gap-4 overflow-x-auto pb-4">
          {BRIGADE_SHOTS.map((src, i) => (
            <figure
              key={i}
              className="relative aspect-[3/4] w-60 shrink-0 snap-start overflow-hidden rounded-sm md:w-72"
            >
              <img
                src={src}
                alt="The brigade at work"
                loading="lazy"
                className="h-full w-full object-cover grayscale transition duration-700 hover:scale-[1.04] hover:grayscale-0"
              />
              <span className="absolute left-3 top-3 font-display text-sm text-cream/70">
                {`0${i + 1}`}
              </span>
            </figure>
          ))}
        </div>

        {/* Named, recurring faces */}
        <div className="mt-16 grid grid-cols-1 gap-8 border-t border-cream/12 pt-14 sm:grid-cols-3">
          {TEAM.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.1}>
              <figure className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                  <img
                    src={m.img}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale transition duration-700 group-hover:grayscale-0"
                  />
                </div>
                <figcaption className="mt-5">
                  <p className="font-display text-2xl text-cream">{m.name}</p>
                  <p className="label mt-1 text-gold">{m.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <p className="mt-16 max-w-md font-display text-2xl italic text-cream/65">
          {t("brigade.caption")}
        </p>
      </div>
    </section>
  );
}
