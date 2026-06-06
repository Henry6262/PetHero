import { useT } from "@app/i18n";
import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";
import { CoachCard } from "@app/components/CoachCard";
import SpotlightCard from "@/free/Components/SpotlightCard/SpotlightCard";
import { PROGRAMS } from "@app/data/programs";
import { COACHES } from "@app/data/coaches";

/** Fired by Enroll buttons so the Register form opens in coaching mode. */
export function presetCoaching() {
  window.dispatchEvent(new CustomEvent("register:mode", { detail: "coaching" }));
}

export function Coaching() {
  const { t } = useT();

  return (
    <Section id="coaching" tone="ink">
      <div className="max-w-2xl">
        <Eyebrow>{t("coaching.eyebrow")}</Eyebrow>
        <h2 className="font-display text-[2.4rem] leading-[0.95] text-chalk md:text-[3.4rem]">
          {t("coaching.title")}
        </h2>
        <p className="mt-5 text-chalk-dim">{t("coaching.lead")}</p>
      </div>

      {/* Programs — the paid offers */}
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {PROGRAMS.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <SpotlightCard className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label text-[0.6rem] text-lime">{p.ages}</p>
                  <h3 className="mt-2 font-display text-2xl text-chalk md:text-3xl">
                    {t(`coaching.programs.${p.id}.name`)}
                  </h3>
                </div>
                <p className="shrink-0 text-right">
                  <span className="block text-[0.65rem] uppercase tracking-[0.15em] text-chalk-dim">
                    {t("coaching.from")}
                  </span>
                  <span className="font-display text-2xl text-lime">CHF {p.priceFrom}</span>
                  <span className="block text-[0.7rem] text-chalk-dim">{t(`coaching.${p.unitKey}`)}</span>
                </p>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-chalk-dim">
                {t(`coaching.programs.${p.id}.blurb`)}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-chalk-dim">
                <li className="flex gap-2"><Tick />{t(`coaching.programs.${p.id}.bullet1`)}</li>
                <li className="flex gap-2"><Tick />{t(`coaching.programs.${p.id}.bullet2`)}</li>
              </ul>

              <a
                href="#register"
                onClick={presetCoaching}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-lime-soft"
              >
                {t("coaching.cta")}
              </a>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      {/* Coaches — the credibility */}
      <div className="mt-16">
        <h3 className="label mb-6 text-chalk-dim">{t("coaching.coachesTitle")}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {COACHES.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06}>
              <CoachCard
                name={c.name}
                initials={c.initials}
                role={t(`coaching.coaches.${c.id}.role`)}
                credential={t(`coaching.coaches.${c.id}.credential`)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="mt-0.5 shrink-0" aria-hidden>
      <path d="M3 8.5l3 3 7-7.5" fill="none" stroke="#c6ff2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
