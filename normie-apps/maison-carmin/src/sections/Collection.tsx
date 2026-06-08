import { Section, Eyebrow } from "@app/components/Section";
import { Reveal } from "@app/components/Reveal";
import { JewelryShowcase } from "@app/components/JewelryShowcase";
import { useT } from "@app/i18n";

export function Collection() {
  const { t } = useT();
  return (
    <Section id="collection">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t("collection.eyebrow")}</Eyebrow>
        <h2 className="font-display text-[2.8rem] leading-[1.02] text-platinum md:text-[3.6rem]">
          {t("collection.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-silver">{t("collection.lead")}</p>
      </div>

      <Reveal className="mt-14">
        <JewelryShowcase />
      </Reveal>
    </Section>
  );
}
