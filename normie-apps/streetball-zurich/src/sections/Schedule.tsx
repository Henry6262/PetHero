import { Calendar, MapPin } from "lucide-react";
import { useT } from "@app/i18n";
import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";
import { VENUES } from "@app/brand";

export function Schedule() {
  const { t } = useT();

  return (
    <Section id="season" tone="ink">
      <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <Eyebrow>{t("schedule.eyebrow")}</Eyebrow>
          <h2 className="font-display text-[2.4rem] leading-[0.95] text-chalk md:text-[3.4rem]">
            {t("schedule.title")}
          </h2>
          <div className="mt-7 flex items-center gap-3">
            <Calendar className="size-6 text-lime" strokeWidth={1.75} />
            <span className="font-display text-2xl text-chalk">{t("schedule.season")}</span>
          </div>
          <p className="mt-3 max-w-md text-chalk-dim">{t("schedule.seasonNote")}</p>
        </div>

        <Reveal>
          <div className="rounded-2xl border border-line bg-concrete p-6">
            <p className="label mb-4 text-chalk-dim">{t("schedule.venuesLabel")}</p>
            <ul className="space-y-3">
              {VENUES.map((v) => (
                <li key={v.name} className="flex items-center gap-3 border-b border-line/60 pb-3 last:border-0 last:pb-0">
                  <MapPin className="size-5 text-lime" strokeWidth={1.75} />
                  <span className="font-display text-lg text-chalk">{v.name}</span>
                  <span className="ml-auto text-sm text-chalk-dim">{v.area}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-snug text-chalk-dim">{t("schedule.note")}</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
