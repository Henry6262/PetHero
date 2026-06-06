import { Target, ClipboardCheck, MapPin, Dribbble } from "lucide-react";
import { useT } from "@app/i18n";
import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";

const STEPS = [
  { key: "pick", Icon: Target },
  { key: "register", Icon: ClipboardCheck },
  { key: "show", Icon: MapPin },
  { key: "ball", Icon: Dribbble },
] as const;

export function HowItWorks() {
  const { t } = useT();

  return (
    <Section tone="concrete">
      <Eyebrow>{t("how.eyebrow")}</Eyebrow>
      <h2 className="max-w-2xl font-display text-[2.4rem] leading-[0.95] text-chalk md:text-[3.4rem]">
        {t("how.title")}
      </h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ key, Icon }, i) => (
          <Reveal key={key} delay={i * 0.07}>
            <div className="h-full rounded-2xl border border-line bg-ink p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl text-line">{String(i + 1).padStart(2, "0")}</span>
                <Icon className="size-6 text-lime" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-display text-xl text-chalk">{t(`how.steps.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-snug text-chalk-dim">{t(`how.steps.${key}.body`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
