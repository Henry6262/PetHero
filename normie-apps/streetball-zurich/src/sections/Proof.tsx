import { useT } from "@app/i18n";
import { Section, Eyebrow } from "@app/components/Section";
import CountUp from "@/free/TextAnimations/CountUp/CountUp";

const STATS = [
  { to: 240, key: "ballers", separator: "" },
  { to: 30, key: "jams", separator: "" },
  { to: 18, key: "courts", separator: "" },
] as const;

// A short scrolling strip of jam-night word-tags — stand-in for a photo marquee
// until real shots land. Two copies + 50% translate = a seamless loop.
const TAGS = ["JAM NIGHT", "U14 FINAL", "BUZZER BEATER", "CROSSOVER", "AND-ONE", "GAME POINT", "STREET RULES"];

export function Proof() {
  const { t } = useT();
  const row = [...TAGS, ...TAGS];

  return (
    <Section tone="concrete" className="overflow-hidden">
      <Eyebrow>{t("proof.eyebrow")}</Eyebrow>
      <h2 className="max-w-2xl font-display text-[2.4rem] leading-[0.95] text-chalk md:text-[3.4rem]">
        {t("proof.title")}
      </h2>

      <dl className="mt-12 grid gap-8 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.key} className="border-l-2 border-lime/40 pl-5">
            <CountUp
              to={s.to}
              duration={1.8}
              separator={s.separator}
              className="font-display text-5xl text-lime md:text-6xl"
            />
            <dt className="mt-2 text-sm uppercase tracking-[0.16em] text-chalk-dim">
              {t(`proof.stats.${s.key}`)}
            </dt>
          </div>
        ))}
      </dl>

      <figure className="mt-14 max-w-3xl">
        <blockquote className="font-display text-2xl leading-tight text-chalk md:text-3xl">
          “{t("proof.quote")}”
        </blockquote>
        <figcaption className="mt-3 label text-lime">{t("proof.quoteBy")}</figcaption>
      </figure>

      <div className="no-bar mt-14 overflow-hidden">
        <div className="flex w-max gap-3 animate-marquee">
          {row.map((tag, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-line px-4 py-2 font-display text-sm uppercase tracking-wide text-chalk-dim"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
