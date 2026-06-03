import { Suspense, lazy } from "react";
import SplitText from "@/free/TextAnimations/SplitText/SplitText";
import StarBorder from "@/free/Animations/StarBorder/StarBorder";
import CountUp from "@/free/TextAnimations/CountUp/CountUp";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { BRAND_CITY } from "@app/brand";

const Silk = lazy(() => import("@/free/Backgrounds/Silk/Silk"));

const HERO_STATS = [
  { key: "years", to: 12, suffix: "" },
  { key: "events", to: 180, suffix: "+" },
  { key: "staff", to: 40, suffix: "" },
] as const;

export function Hero() {
  const { t } = useT();
  const reduced = useReducedMotion();

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-espresso">
      {!reduced && (
        <Suspense fallback={null}>
          <div className="absolute inset-0">
            <Silk color="#9c7c3a" speed={2.4} scale={1.7} noiseIntensity={1.6} rotation={0.35} />
          </div>
        </Suspense>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_18%,transparent_14%,rgba(13,11,8,0.82)_94%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-espresso to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-28 md:px-10 md:pt-32">
        <span className="label text-gold-soft">Maison d'événements</span>
        <span className="label hidden text-cream/55 md:block">Est. — {BRAND_CITY}</span>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 md:px-10">
        {reduced ? (
          <h1 className="font-display text-[3.4rem] font-[420] leading-[0.94] text-cream md:text-[7.8rem]">
            {t("hero.h1a")}
            <br />
            <span className="italic text-gold-soft">{t("hero.h1b")}</span>
          </h1>
        ) : (
          <div className="font-display text-[3.4rem] font-[420] leading-[0.94] text-cream md:text-[7.8rem]">
            <SplitText
              text={t("hero.h1a")}
              tag="h1"
              splitType="words"
              delay={55}
              duration={1.1}
              ease="power4.out"
              from={{ opacity: 0, y: 60, rotateX: 40 }}
              to={{ opacity: 1, y: 0, rotateX: 0 }}
              textAlign="left"
            />
            <SplitText
              text={t("hero.h1b")}
              tag="div"
              splitType="words"
              delay={34}
              duration={1.1}
              ease="power4.out"
              from={{ opacity: 0, y: 60 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="left"
              className="italic text-gold-soft"
            />
          </div>
        )}

        <p className="mt-10 max-w-xl text-lg leading-relaxed text-cream/85 md:text-xl">
          {t("hero.sub")}
        </p>

        <div className="mt-12 flex flex-col items-start gap-10 sm:flex-row sm:items-center">
          <div className="flex">
            <StarBorder as="a" href="#contact" color="#ddc794" speed="6s" thickness={1}>
              <span className="px-8 py-3.5 text-sm tracking-[0.12em] text-cream">{t("hero.cta")}</span>
            </StarBorder>
          </div>

          {/* hero stat strip — density */}
          <div className="flex divide-x divide-cream/15">
            {HERO_STATS.map((s) => (
              <div key={s.key} className="px-6 first:pl-0">
                <div className="font-display text-3xl text-gold-soft md:text-4xl">
                  {reduced ? s.to : <CountUp to={s.to} duration={2} />}
                  {s.suffix}
                </div>
                <div className="label mt-1 !text-[0.6rem] text-cream/55">{t(`stats.items.${s.key}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-end justify-between px-6 pb-10 md:px-10">
        <span className="label text-cream/45">{BRAND_CITY} · Switzerland</span>
        <span className="flex items-center gap-3 text-cream/45">
          <span className="label">{t("hero.scroll")}</span>
          <span className="h-10 w-px bg-gradient-to-b from-gold/70 to-transparent" />
        </span>
      </div>
    </section>
  );
}
