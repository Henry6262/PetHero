import { useT } from "@app/i18n";

const STEPS = ["discovery", "design", "assembly", "execution", "aftercare"] as const;

export function Process() {
  const { t } = useT();
  return (
    <section className="relative overflow-hidden bg-espresso px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 max-w-2xl">
          <p className="label mb-6 text-gold">{t("process.eyebrow")}</p>
          <h2 className="font-display text-[2.6rem] leading-[1.05] text-cream md:text-6xl">
            {t("process.title")}
          </h2>
        </div>

        {/* drawn gold line through the nodes */}
        <div className="relative">
          <span
            aria-hidden
            className="absolute left-0 top-[7px] hidden h-px w-full origin-left bg-gradient-to-r from-gold/70 via-gold/40 to-transparent md:block"
            style={{ animation: "draw-line 1.6s ease-out both" }}
          />
          <ol className="grid grid-cols-1 gap-12 md:grid-cols-5 md:gap-6">
            {STEPS.map((key, i) => (
              <li key={key} className="relative">
                <span className="mb-6 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold ring-4 ring-espresso" />
                <span className="font-display text-sm text-gold">{`0${i + 1}`}</span>
                <h3 className="mt-2 font-display text-2xl text-cream">
                  {t(`process.steps.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">
                  {t(`process.steps.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
