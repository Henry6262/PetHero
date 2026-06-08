import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";
import { Frame } from "@app/components/Frame";
import { CtaButton } from "@app/components/CtaButton";
import { useT } from "@app/i18n";

const STEPS = ["consult", "design", "forge"] as const;

export function Bespoke() {
  const { t } = useT();
  return (
    <Section id="bespoke">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("bespoke.eyebrow")}</Eyebrow>
        <h2 className="font-display text-[2.6rem] leading-[1.03] text-platinum md:text-[3.4rem]">
          {t("bespoke.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-silver">{t("bespoke.lead")}</p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <Reveal key={step} delay={idx * 0.1}>
            <Frame accent="rgba(201,162,75,0.45)" className="h-full p-8">
              <span className="font-display text-5xl text-ruby-lit/80">
                {t(`bespoke.steps.${step}.k`)}
              </span>
              <h3 className="mt-5 font-display text-2xl text-platinum">
                {t(`bespoke.steps.${step}.title`)}
              </h3>
              <p className="mt-3 text-silver">{t(`bespoke.steps.${step}.body`)}</p>
            </Frame>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <CtaButton as="a" href="#enquiry" variant="gold">{t("bespoke.cta")}</CtaButton>
      </div>
    </Section>
  );
}
