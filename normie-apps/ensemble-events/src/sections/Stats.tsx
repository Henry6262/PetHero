import CountUp from "@/free/TextAnimations/CountUp/CountUp";
import { useT } from "@app/i18n";

// PLACEHOLDER figures — founder to confirm real numbers.
const STATS = [
  { key: "events", to: 180, suffix: "+" },
  { key: "guests", to: 45000, suffix: "+", separator: "’" },
  { key: "years", to: 12, suffix: "" },
  { key: "staff", to: 40, suffix: "" },
] as const;

export function Stats() {
  const { t } = useT();
  return (
    <section className="bg-espresso-2 px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-14 md:grid-cols-4 md:gap-y-0">
        {STATS.map((s, i) => (
          <div
            key={s.key}
            className="flex flex-col items-center px-4 text-center md:border-l md:border-cream/12 md:first:border-l-0"
          >
            <div className="font-display text-[3.4rem] leading-none text-gold md:text-[4.2rem]">
              <CountUp
                to={s.to}
                duration={2.2}
                separator={"separator" in s ? s.separator : ""}
                delay={i * 0.1}
              />
              <span className="text-gold-soft">{s.suffix}</span>
            </div>
            <p className="label mt-5 text-cream/55">{t(`stats.items.${s.key}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
