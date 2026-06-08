import { Gem, Hand, Infinity as InfinityIcon } from "lucide-react";
import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";
import SpotlightCard from "@/free/Components/SpotlightCard/SpotlightCard";
import { useT } from "@app/i18n";

const POINTS = [
  { key: "source", Icon: Gem },
  { key: "set", Icon: Hand },
  { key: "kept", Icon: InfinityIcon },
] as const;

export function Craft() {
  const { t } = useT();
  return (
    <Section id="craft" tone="ink">
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="md:sticky md:top-32 md:self-start">
          <Eyebrow>{t("craft.eyebrow")}</Eyebrow>
          <h2 className="font-display text-[2.6rem] leading-[1.03] text-platinum md:text-[3.4rem]">
            {t("craft.title")}
          </h2>
          <p className="mt-6 max-w-md text-silver">{t("craft.lead")}</p>
        </div>

        <div className="flex flex-col gap-5">
          {POINTS.map(({ key, Icon }, idx) => (
            <Reveal key={key} delay={idx * 0.08}>
              <SpotlightCard className="h-full">
                <div className="flex items-start gap-5">
                  <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-[2px] border border-gold/30 text-gold">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-platinum">
                      {t(`craft.points.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-silver">{t(`craft.points.${key}.body`)}</p>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
