import { useT } from "@app/i18n";
import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";
import SpotlightCard from "@/free/Components/SpotlightCard/SpotlightCard";
import { BRACKETS } from "@app/data/brackets";

const yy = (year: number) => `'${String(year).slice(2)}`;

export function Brackets() {
  const { t } = useT();

  return (
    <Section id="brackets" tone="concrete">
      <div className="max-w-2xl">
        <Eyebrow>{t("brackets.eyebrow")}</Eyebrow>
        <h2 className="font-display text-[2.4rem] leading-[0.95] text-chalk md:text-[3.4rem]">
          {t("brackets.title")}
        </h2>
        <p className="mt-5 text-chalk-dim">{t("brackets.lead")}</p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {BRACKETS.map((b, i) => (
          <Reveal key={b.id} delay={i * 0.06} className="h-full">
            <SpotlightCard className="flex h-full flex-col p-7 md:p-8">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-5xl text-lime md:text-6xl">{b.id}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-chalk-dim">{b.format}</span>
              </div>
              <p className="mt-3 text-[0.78rem] uppercase tracking-[0.16em] text-chalk-dim">
                {t("brackets.born")} {yy(b.minBorn)}–{yy(b.maxBorn)} · {b.ages}
              </p>
              <p className="mt-6 text-base leading-relaxed text-chalk-dim">
                {t(`brackets.desc${b.id}`)}
              </p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
