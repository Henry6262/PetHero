import { Suspense, lazy } from "react";
import SplitText from "@/free/TextAnimations/SplitText/SplitText";
import StarBorder from "@/free/Animations/StarBorder/StarBorder";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { BRAND_CITY } from "@app/brand";

// The animated shader IS the hero. Code-split so it doesn't block first paint;
// the espresso base colour is the instant LCP, the silk drifts in over it.
const Silk = lazy(() => import("@/free/Backgrounds/Silk/Silk"));

export function Hero() {
  const { t } = useT();
  const reduced = useReducedMotion();

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-espresso">
      {/* Animated React Bits shader — full bleed, no photo */}
      {!reduced && (
        <Suspense fallback={null}>
          <div className="absolute inset-0">
            <Silk color="#9c7c3a" speed={2.4} scale={1.7} noiseIntensity={1.6} rotation={0.35} />
          </div>
        </Suspense>
      )}

      {/* Vignette + tonal grade so type sits on it like foil on dark silk */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_18%,transparent_18%,rgba(13,11,8,0.78)_92%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-espresso to-transparent" />

      {/* Top bar inside hero */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-28 md:px-10 md:pt-32">
        <span className="label text-gold-soft">Maison d'événements</span>
        <span className="label hidden text-cream/55 md:block">Est. — {BRAND_CITY}</span>
      </div>

      {/* Headline block */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 md:px-10">
        {reduced ? (
          <h1 className="font-display text-[3rem] leading-[0.98] text-cream md:text-[6.5rem]">
            {t("hero.h1a")}
            <br />
            <span className="italic text-gold-soft">{t("hero.h1b")}</span>
          </h1>
        ) : (
          <div className="font-display text-[3rem] leading-[0.98] text-cream md:text-[6.5rem]">
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

        <p className="mt-10 max-w-lg text-base leading-relaxed text-cream/80 md:text-lg">
          {t("hero.sub")}
        </p>

        <div className="mt-12 flex">
          <StarBorder
            as="a"
            href="#contact"
            color="#d8c290"
            speed="6s"
            thickness={1}
          >
            <span className="px-8 py-3.5 text-sm tracking-[0.12em] text-cream">{t("hero.cta")}</span>
          </StarBorder>
        </div>
      </div>

      {/* Bottom rail */}
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
